import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const AGENT_ID = "agent_5301kk9vxzt0fpp92jxa49cakhdg";

type SessionState = "idle" | "connecting" | "listening" | "speaking";

interface Message {
  role: "agent" | "user";
  text: string;
}

declare global {
  interface Window {
    client: any;
  }
}

export function CyberMentorWidget() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<SessionState>("idle");
  const [muted, setMuted] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [gateStatus, setGateStatus] = useState<"pending" | "approved" | "rejected" | "not_found">("pending");
  const [verifiedName, setVerifiedName] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      text: "👋 Hey, I'm CyberMentor. Enter your display name below to get started.",
    },
  ]);
  const conversationRef = useRef<any>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  const addMsg = (text: string, role: "agent" | "user") =>
    setMessages((prev) => [...prev, { role, text }]);

  const checkAccess = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed.length < 2) return;
    setChecking(true);

    // Exact match first — use limit(5) to detect duplicates
    let { data, error } = await supabase
      .from("students")
      .select("full_name, display_name, is_profile_active")
      .or(`display_name.ilike.${trimmed},full_name.ilike.${trimmed}`)
      .limit(5);

    // Partial fallback only if zero exact matches
    if (!error && (!data || data.length === 0)) {
      ({ data, error } = await supabase
        .from("students")
        .select("full_name, display_name, is_profile_active")
        .or(`display_name.ilike.%${trimmed}%,full_name.ilike.%${trimmed}%`)
        .limit(5));
    }

    setChecking(false);

    if (error || !data || data.length === 0) {
      setGateStatus("not_found");
      addMsg("I couldn't find a profile under that name. Head to surveyresults.pages.dev to register first.", "agent");
      return;
    }

    // Multiple matches — ask for email instead
    if (data.length > 1) {
      setNeedsEmail(true);
      addMsg("I found more than one person with that name. Please enter your email address to identify you.", "agent");
      return;
    }

    if (!data[0].is_profile_active) {
      setGateStatus("rejected");
      addMsg("Hey! I found your profile but CyberMentor is currently in private beta. Fill out the beta interest form at surveyresults.pages.dev and we'll activate you soon!", "agent");
      return;
    }

    setVerifiedName(data[0].display_name || data[0].full_name || trimmed);
    setGateStatus("approved");
    addMsg(`Access confirmed! Starting your session now...`, "agent");
    setTimeout(() => startSession(), 800);
  };

  const checkByEmail = async () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) return;
    setChecking(true);

    const { data, error } = await supabase
      .from("students")
      .select("full_name, display_name, is_profile_active")
      .eq("email", trimmed)
      .maybeSingle();

    setChecking(false);

    if (error || !data) {
      setGateStatus("not_found");
      setNeedsEmail(false);
      addMsg("I couldn't find a profile with that email. Head to surveyresults.pages.dev to register first.", "agent");
      return;
    }

    if (!data.is_profile_active) {
      setGateStatus("rejected");
      setNeedsEmail(false);
      addMsg("Hey! I found your profile but CyberMentor is currently in private beta. Fill out the beta interest form at surveyresults.pages.dev and we'll activate you soon!", "agent");
      return;
    }

    setNeedsEmail(false);
    setVerifiedName(data.display_name || data.full_name || trimmed);
    setGateStatus("approved");
    addMsg("Access confirmed! Starting your session now...", "agent");
    setTimeout(() => startSession(), 800);
  };

  const startSession = async () => {
    const ElevenLabsClient = window.client;
    if (!ElevenLabsClient) {
      addMsg("SDK not ready yet. Please wait a moment and try again.", "agent");
      return;
    }
    setState("connecting");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      conversationRef.current = await ElevenLabsClient.Conversation.startSession({
        agentId: AGENT_ID,

        dynamicVariables: {
          verified_name: verifiedName,
        },

        clientTools: {
          // ElevenLabs calls this when it has a name to look up
          lookup_student: async ({ name }: { name: string }) => {
            const trimmed = name?.trim();
            if (!trimmed || trimmed.length < 2) {
              return JSON.stringify({ found: false, reason: "invalid_name" });
            }

            // Exact match first, fall back to partial if nothing found
            let { data, error } = await supabase
              .from("students")
              .select(
                "full_name, display_name, journey_level, target_role, weekly_hours, certifications, is_profile_active"
              )
              .or(
                `display_name.ilike.${trimmed},full_name.ilike.${trimmed}`
              )
              .limit(5);

            if (!error && (!data || data.length === 0)) {
              ({ data, error } = await supabase
                .from("students")
                .select(
                  "full_name, display_name, journey_level, target_role, weekly_hours, certifications, is_profile_active"
                )
                .or(
                  `display_name.ilike.%${trimmed}%,full_name.ilike.%${trimmed}%`
                )
                .limit(5));
            }

            if (error || !data || data.length === 0) {
              return JSON.stringify({ found: false });
            }

            if (data.length > 1) {
              // Multiple matches — ask agent to be more specific
              const names = data
                .map((s) => s.display_name || s.full_name)
                .filter(Boolean)
                .join(", ");
              return JSON.stringify({
                found: false,
                reason: "multiple_matches",
                matches: names,
              });
            }

            const s = data[0];

            // Beta gate — only active students can proceed
            if (!s.is_profile_active) {
              return JSON.stringify({ found: false, reason: "not_invited" });
            }

            return JSON.stringify({
              found: true,
              name: s.display_name || s.full_name || trimmed,
              journey_level: s.journey_level || "Not specified",
              target_role: s.target_role || "Not specified",
              weekly_hours: s.weekly_hours || "Not specified",
              certifications: s.certifications || "Not sure yet",
            });
          },
        },

        onConnect: () => {
          setState("listening");
          addMsg("Session started. CyberMentor is ready.", "agent");
        },
        onDisconnect: () => {
          conversationRef.current = null;
          setState("idle");
          addMsg("Session ended.", "agent");
        },
        onError: (err: any) => {
          console.error(err);
          setState("idle");
          addMsg("Connection error. Please try again.", "agent");
        },
        onModeChange: ({ mode }: { mode: string }) => {
          if (mode === "speaking") setState("speaking");
          else if (mode === "listening") setState("listening");
        },
        onMessage: ({ message, source }: { message: string; source: string }) => {
          if (message?.trim()) addMsg(message, source === "user" ? "user" : "agent");
        },
      });
    } catch {
      setState("idle");
      addMsg("Microphone access required. Please allow mic access and try again.", "agent");
    }
  };

  const endSession = async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
    }
    setState("idle");
    setMuted(false);
    setGateStatus("pending");
    setNameInput("");
    setEmailInput("");
    setNeedsEmail(false);
    setVerifiedName("");
  };

  const toggleMute = () => {
    if (!conversationRef.current) return;
    const next = !muted;
    conversationRef.current.setMicMuted(next);
    setMuted(next);
  };

  const isActive = state === "listening" || state === "speaking";

  const stateLabel: Record<SessionState, string> = {
    idle: "Ready to connect",
    connecting: "Connecting...",
    listening: "Listening",
    speaking: "Speaking",
  };

  const stateCode: Record<SessionState, string> = {
    idle: "// awaiting session",
    connecting: "// establishing link",
    listening: "// mic active",
    speaking: "// transmitting audio",
  };

  const WAVE_HEIGHTS = [8, 18, 28, 14, 24, 32, 20, 12, 26, 16, 22, 10];

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open CyberMentor voice assistant"
        className={[
          "fixed bottom-8 right-8 z-50",
          "w-16 h-16 rounded-full",
          "flex items-center justify-center",
          "border transition-all duration-300 bg-card",
          open
            ? "border-destructive shadow-[0_0_20px_hsl(var(--destructive)/0.4)]"
            : "border-primary/40 animate-pulse-glow hover:border-primary hover:scale-105",
        ].join(" ")}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 4l12 12M16 4L4 16" stroke="hsl(var(--destructive))" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="13" r="9" stroke="hsl(var(--primary))" strokeWidth="1.5" />
            <circle cx="13" cy="13" r="3.5" fill="hsl(var(--primary))" opacity="0.7" />
            <path d="M13 8v2M13 16v2M8 13H6M20 13h-2" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Panel */}
      <div
        role="dialog"
        aria-label="CyberMentor Voice Assistant"
        className={[
          "fixed bottom-[116px] right-8 z-50",
          "w-[360px] rounded-xl overflow-hidden",
          "bg-card border border-border/50",
          "shadow-[0_24px_80px_hsl(0_0%_0%/0.7)]",
          "transition-all duration-300 origin-bottom-right",
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 bg-secondary border-b border-border/50">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 border border-primary/30 bg-muted cyber-glow-subtle">
            🛡️
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-xs font-bold tracking-widest text-foreground uppercase">
              CyberMentor
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={[
                  "w-1.5 h-1.5 rounded-full flex-shrink-0",
                  state === "speaking"
                    ? "bg-cyber-green animate-pulse"
                    : state === "listening"
                    ? "bg-primary animate-pulse"
                    : state === "connecting"
                    ? "bg-cyber-amber animate-pulse"
                    : "bg-muted-foreground",
                ].join(" ")}
              />
              <span className="text-[11px] text-muted-foreground font-mono">
                {stateLabel[state]}
              </span>
            </div>
          </div>
          {isActive && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-primary/30 text-primary bg-primary/10 uppercase tracking-wider">
              Live
            </span>
          )}
        </div>

        {/* Visualizer */}
        <div className="flex flex-col items-center gap-4 py-6 px-4 bg-background border-b border-border/50">
          <div className="relative w-[88px] h-[88px]">
            <div
              className="absolute inset-[-8px] rounded-full border border-transparent"
              style={{
                borderTopColor: "hsl(var(--primary))",
                borderRightColor: "hsl(var(--primary)/0.3)",
                animation: "cm-spin 4s linear infinite",
              }}
            />
            <div
              className="absolute inset-[-16px] rounded-full border border-transparent"
              style={{
                borderBottomColor: "hsl(var(--cyber-purple)/0.3)",
                animation: "cm-spin 8s linear infinite reverse",
              }}
            />
            <div
              className={[
                "w-[88px] h-[88px] rounded-full z-10 relative",
                "flex items-center justify-center border transition-all duration-500",
                state === "listening"
                  ? "border-primary shadow-[0_0_0_8px_hsl(var(--primary)/0.08),0_0_40px_hsl(var(--primary)/0.25)]"
                  : state === "speaking"
                  ? "border-cyber-green shadow-[0_0_0_12px_hsl(var(--cyber-green)/0.08),0_0_50px_hsl(var(--cyber-green)/0.3)]"
                  : "border-primary/20",
              ].join(" ")}
              style={{
                background:
                  "radial-gradient(circle at 35% 35%, hsl(var(--secondary)), hsl(var(--background)))",
              }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path
                  d="M16 7a3.5 3.5 0 0 1 3.5 3.5v7a3.5 3.5 0 0 1-7 0v-7A3.5 3.5 0 0 1 16 7z"
                  stroke="hsl(var(--primary))"
                  strokeWidth="1.5"
                />
                <path
                  d="M9 18a7 7 0 0 0 14 0"
                  stroke="hsl(var(--primary))"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line x1="16" y1="25" x2="16" y2="29" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="12" y1="29" x2="20" y2="29" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Waveform */}
          <div className="flex items-center gap-[3px] h-8">
            {WAVE_HEIGHTS.map((h, i) => (
              <div
                key={i}
                className="w-[3px] rounded-full transition-all"
                style={{
                  height: isActive ? `${Math.max(4, h * (0.4 + Math.random() * 0.6))}px` : "4px",
                  background:
                    state === "speaking"
                      ? "hsl(var(--cyber-green))"
                      : "hsl(var(--primary))",
                  opacity: isActive ? 0.9 : 0.25,
                  transitionDuration: `${100 + i * 30}ms`,
                }}
              />
            ))}
          </div>

          <span className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
            {stateCode[state]}
          </span>
        </div>

        {/* Transcript */}
        <div
          ref={logRef}
          className="flex flex-col gap-2 p-4 max-h-[130px] overflow-y-auto"
          style={{ scrollbarColor: "hsl(var(--border)) transparent", scrollbarWidth: "thin" }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={[
                "text-xs leading-relaxed px-3 py-2 rounded-lg max-w-[92%] animate-fade-in",
                m.role === "agent"
                  ? "self-start bg-secondary border-l-2 border-primary text-foreground"
                  : "self-end bg-muted border-l-2 border-border text-muted-foreground",
              ].join(" ")}
            >
              {m.text}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2 px-4 py-3 border-t border-border/50">
          {/* Pre-session name gate */}
          {!isActive && gateStatus !== "approved" && !needsEmail && (
            <div className="flex gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => { setNameInput(e.target.value); setGateStatus("pending"); }}
                onKeyDown={(e) => e.key === "Enter" && checkAccess()}
                placeholder="Enter your display name..."
                className="flex-1 h-10 px-3 rounded-lg border border-border/50 bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono"
              />
              <button
                onClick={checkAccess}
                disabled={checking || nameInput.trim().length < 2}
                className="h-10 px-4 rounded-lg bg-primary text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
              >
                {checking ? "⋯" : "Check"}
              </button>
            </div>
          )}

          {/* Email fallback for multiple matches */}
          {!isActive && needsEmail && (
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkByEmail()}
                placeholder="Enter your email address..."
                className="flex-1 h-10 px-3 rounded-lg border border-cyber-amber/40 bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyber-amber font-mono"
              />
              <button
                onClick={checkByEmail}
                disabled={checking || !emailInput.includes("@")}
                className="h-10 px-4 rounded-lg bg-cyber-amber/80 text-background font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyber-amber"
              >
                {checking ? "⋯" : "Verify"}
              </button>
            </div>
          )}

          {/* Active session controls */}
          {(isActive || gateStatus === "approved") && (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                disabled={!isActive}
                title={muted ? "Unmute" : "Mute"}
                className={[
                  "flex items-center justify-center w-10 h-10 rounded-lg border text-sm",
                  "transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed",
                  muted
                    ? "border-destructive text-destructive bg-destructive/10"
                    : "border-border/50 text-muted-foreground hover:border-primary hover:text-primary",
                ].join(" ")}
              >
                {muted ? "🔇" : "🎤"}
              </button>
              <button
                onClick={isActive ? endSession : startSession}
                disabled={state === "connecting"}
                className={[
                  "flex-1 h-10 rounded-lg font-mono text-xs font-bold uppercase tracking-wider",
                  "transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                  isActive
                    ? "border border-destructive text-destructive hover:bg-destructive/10"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                ].join(" ")}
              >
                {state === "connecting"
                  ? "⋯ Connecting"
                  : isActive
                  ? "■ End Session"
                  : "▸ Start Session"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-t border-border/30">
          <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
            Powered by <span className="text-primary">EmmaLabs</span>
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">🔒 Encrypted</span>
        </div>
      </div>

      <style>{`@keyframes cm-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

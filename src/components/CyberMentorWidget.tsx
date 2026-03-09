import { useState, useRef, useEffect } from "react";

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
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      text: "👋 Hey, I'm CyberMentor. Start a session to ask me anything about cybersecurity.",
    },
  ]);
  const conversationRef = useRef<any>(null);
  const logRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  const addMsg = (text: string, role: "agent" | "user") =>
    setMessages((prev) => [...prev, { role, text }]);

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
        onConnect: () => {
          setState("listening");
          addMsg("Session started. Ask me anything about cybersecurity!", "agent");
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
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border/50">
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

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-t border-border/30">
          <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
            Powered by <span className="text-primary">ElevenLabs</span>
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">🔒 Encrypted</span>
        </div>
      </div>

      <style>{`@keyframes cm-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

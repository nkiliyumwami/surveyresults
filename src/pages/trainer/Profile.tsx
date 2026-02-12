import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type TrainerProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  timezone: string | null;
  country: string | null;
  city: string | null;
  bio: string | null;
  expertise: string[] | null;
  certifications: string[] | null;
  availability: string[] | null;
  max_students: number | null;
  is_active: boolean | null;
};

const EXPERTISE_OPTIONS = [
  "SOC / Incident Response",
  "Threat Hunting",
  "Penetration Testing",
  "Web Security",
  "Cloud Security",
  "GRC / Auditing",
  "Security Engineering",
  "Networking Fundamentals",
];

export default function TrainerProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");

  // Form state
  const [fullName, setFullName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [maxStudents, setMaxStudents] = useState<number>(10);

  // Arrays stored as text inputs (comma-separated) for now
  const [expertise, setExpertise] = useState<string[]>([]);
  const [certificationsText, setCertificationsText] = useState("");
  const [availabilityText, setAvailabilityText] = useState("");

  const certificationsArr = useMemo(() => {
    return certificationsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [certificationsText]);

  const availabilityArr = useMemo(() => {
    // allow comma-separated OR newline separated
    const raw = availabilityText.replace(/\n/g, ",");
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [availabilityText]);

  const toggleExpertise = (label: string) => {
    setExpertise((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  };

  const loadOrCreateProfile = async () => {
    setStatus(null);
    setLoading(true);

    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const user = userData.user;
      if (!user) throw new Error("No authenticated user found.");

      setUserId(user.id);
      setEmail(user.email ?? "");

      // Try fetch existing profile
      const { data: profile, error: selErr } = await supabase
        .from("trainer_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle<TrainerProfileRow>();

      if (selErr) throw selErr;

      if (!profile) {
        // Auto-create profile row
        const { error: insErr } = await supabase.from("trainer_profiles").insert({
          id: user.id,
          email: user.email ?? null,
          full_name: null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
          country: null,
          city: null,
          bio: null,
          expertise: [],
          certifications: [],
          availability: [],
          max_students: 10,
          is_active: true,
        });

        if (insErr) throw insErr;

        setStatus("Profile created. Please complete your details.");
        // Re-fetch
        const { data: created, error: sel2Err } = await supabase
          .from("trainer_profiles")
          .select("*")
          .eq("id", user.id)
          .single<TrainerProfileRow>();

        if (sel2Err) throw sel2Err;

        hydrateForm(created);
      } else {
        hydrateForm(profile);
      }
    } catch (e) {
      console.error(e);
      setStatus(e instanceof Error ? e.message : "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const hydrateForm = (p: TrainerProfileRow) => {
    setFullName(p.full_name ?? "");
    setTimezone(p.timezone ?? "");
    setCountry(p.country ?? "");
    setCity(p.city ?? "");
    setBio(p.bio ?? "");
    setMaxStudents(p.max_students ?? 10);
    setExpertise(p.expertise ?? []);
    setCertificationsText((p.certifications ?? []).join(", "));
    setAvailabilityText((p.availability ?? []).join("\n"));
  };

  const saveProfile = async () => {
    setStatus(null);
    if (!userId) {
      setStatus("No user id; cannot save.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("trainer_profiles")
        .update({
          email: email || null,
          full_name: fullName || null,
          timezone: timezone || null,
          country: country || null,
          city: city || null,
          bio: bio || null,
          expertise,
          certifications: certificationsArr,
          availability: availabilityArr,
          max_students: maxStudents,
        })
        .eq("id", userId);

      if (error) throw error;

      setStatus("Saved ✅");
    } catch (e) {
      console.error(e);
      setStatus(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadOrCreateProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
        <div className="relative flex min-h-screen items-center justify-center text-muted-foreground">
          Loading trainer profile…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 h-[300px] sm:h-[500px] w-[400px] sm:w-[800px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <main className="relative mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card-cyber p-4 sm:p-6"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg sm:text-2xl font-semibold text-foreground">
                Trainer Profile
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                This information is used to match you with student cohorts.
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Logged in as <span className="font-mono text-primary">{email}</span>
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={loadOrCreateProfile} disabled={saving}>
                Refresh
              </Button>
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          {status && (
            <div className="mt-4 rounded-md border border-primary/20 bg-primary/10 px-3 py-2">
              <p className="text-xs text-foreground">{status}</p>
            </div>
          )}
        </motion.header>

        <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-4 sm:gap-6">
          {/* Basic info */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="card-cyber p-4 sm:p-6"
          >
            <h2 className="text-sm font-semibold text-foreground">Basic info</h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">Full name</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Timezone</label>
                <Input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="Africa/Kigali"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Country</label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">City</label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-xs text-muted-foreground">Bio</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Short background, what you like teaching, etc."
                className="min-h-[110px]"
              />
            </div>

            <div className="mt-3">
              <label className="text-xs text-muted-foreground">Max students (capacity)</label>
              <Input
                type="number"
                value={maxStudents}
                onChange={(e) => setMaxStudents(Number(e.target.value || 0))}
                min={1}
              />
            </div>
          </motion.section>

          {/* Expertise */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="card-cyber p-4 sm:p-6"
          >
            <h2 className="text-sm font-semibold text-foreground">Expertise</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Select all that apply.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {EXPERTISE_OPTIONS.map((opt) => {
                const active = expertise.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleExpertise(opt)}
                    className={[
                      "text-left rounded-md border px-3 py-2 text-sm transition",
                      active
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border bg-background/30 text-muted-foreground hover:bg-background/50",
                    ].join(" ")}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </motion.section>

          {/* Certifications */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="card-cyber p-4 sm:p-6"
          >
            <h2 className="text-sm font-semibold text-foreground">Certifications</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Comma-separated (example: ISC2 CC, Security+, CEH).
            </p>
            <div className="mt-3">
              <Input
                value={certificationsText}
                onChange={(e) => setCertificationsText(e.target.value)}
                placeholder="ISC2 CC, Security+, CEH"
              />
            </div>
          </motion.section>

          {/* Availability */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="card-cyber p-4 sm:p-6"
          >
            <h2 className="text-sm font-semibold text-foreground">Availability</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              One per line (recommended). Example: <span className="font-mono">Mon 18:00–20:00</span>
            </p>
            <div className="mt-3">
              <Textarea
                value={availabilityText}
                onChange={(e) => setAvailabilityText(e.target.value)}
                placeholder={"Mon 18:00–20:00\nWed 19:00–21:00\nSat 09:00–11:00"}
                className="min-h-[140px]"
              />
            </div>
          </motion.section>
        </div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6 sm:mt-10 pb-6 sm:pb-8 text-center"
        >
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Trainer Portal • Profile saved to Supabase (RLS-protected)
          </p>
        </motion.footer>
      </main>
    </div>
  );
}

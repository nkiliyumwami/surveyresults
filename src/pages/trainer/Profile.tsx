import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, MapPin, Clock, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navbar } from "@/components/layout/Navbar";
import {
  getCountries,
  getCitiesForCountry,
  getTimezoneForLocation,
  WEEKLY_CAPACITY_OPTIONS,
  DAYS_OF_WEEK,
  TIME_SLOTS,
  parseAvailability,
  formatAvailability,
  type DayTimeSlot,
} from "@/data/locationData";

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

  // Arrays
  const [expertise, setExpertise] = useState<string[]>([]);
  const [certificationsText, setCertificationsText] = useState("");

  // Assigned students
  const [assignedStudents, setAssignedStudents] = useState<
    { id: string; full_name: string | null; email: string | null; assigned_at: string }[]
  >([]);

  // Availability - structured
  const [weeklyCapacity, setWeeklyCapacity] = useState("");
  const [availabilitySlots, setAvailabilitySlots] = useState<DayTimeSlot[]>([]);

  // Location helpers
  const countries = useMemo(() => getCountries(), []);
  const cities = useMemo(() => getCitiesForCountry(country), [country]);

  const certificationsArr = useMemo(() => {
    return certificationsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [certificationsText]);

  // Auto-populate timezone when location changes
  useEffect(() => {
    if (city && country) {
      const tz = getTimezoneForLocation(city, country);
      if (tz) {
        setTimezone(tz);
      }
    }
  }, [city, country]);

  const toggleExpertise = (label: string) => {
    setExpertise((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  };

  const addAvailabilitySlot = () => {
    setAvailabilitySlots((prev) => [
      ...prev,
      { day: "Monday", startTime: "09:00", endTime: "17:00" },
    ]);
  };

  const updateAvailabilitySlot = (
    index: number,
    field: keyof DayTimeSlot,
    value: string
  ) => {
    setAvailabilitySlots((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      )
    );
  };

  const removeAvailabilitySlot = (index: number) => {
    setAvailabilitySlots((prev) => prev.filter((_, i) => i !== index));
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
          user_id: user.id,
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
          is_active: false,
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

      // Load assigned students for this trainer
      await loadAssignedStudents(user.id);
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

    // Parse availability into structured format
    const { weeklyCapacity: wc, slots } = parseAvailability(p.availability ?? []);
    setWeeklyCapacity(wc);
    setAvailabilitySlots(slots);
  };

  const loadAssignedStudents = async (trainerId: string) => {
    try {
      const { data, error } = await supabase
        .from("assignments")
        .select("created_at, student:students(id, full_name, email)")
        .eq("trainer_id", trainerId)
        .eq("status", "active")
        .order("created_at", { ascending: true });

      if (error) throw error;

      setAssignedStudents(
        (data || []).map((row: any) => ({
          id: row.student?.id ?? "",
          full_name: row.student?.full_name ?? null,
          email: row.student?.email ?? null,
          assigned_at: row.created_at,
        }))
      );
    } catch (e) {
      console.error("Failed to load assigned students:", e);
    }
  };

  const saveProfile = async () => {
    setStatus(null);
    if (!userId) {
      setStatus("No user id; cannot save.");
      return;
    }

    setSaving(true);
    try {
      // Convert structured availability back to string array
      const availabilityArr = formatAvailability(weeklyCapacity, availabilitySlots);

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

      setStatus("Profile saved successfully!");
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
        <Navbar />
        <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
        <div className="relative flex min-h-screen items-center justify-center text-muted-foreground pt-16">
          Loading trainer profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 h-[300px] sm:h-[500px] w-[400px] sm:w-[800px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <main className="relative mx-auto max-w-4xl px-3 pt-20 pb-4 sm:px-6 sm:pt-24 sm:pb-8 lg:px-8">
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
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </div>

          {status && (
            <div
              className={`mt-4 rounded-md border px-3 py-2 ${
                status.includes("success") || status.includes("saved")
                  ? "border-green-500/20 bg-green-500/10"
                  : "border-primary/20 bg-primary/10"
              }`}
            >
              <p className="text-xs text-foreground">{status}</p>
            </div>
          )}
        </motion.header>

        <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-4 sm:gap-6">
          {/* Basic Info */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="card-cyber p-4 sm:p-6"
          >
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Basic Information
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStudents">Max Students (Capacity)</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  value={maxStudents}
                  onChange={(e) => setMaxStudents(Number(e.target.value || 0))}
                  min={1}
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Short background, what you like teaching, areas of specialty..."
                className="min-h-[110px]"
              />
            </div>
          </motion.section>

          {/* Location & Timezone */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="card-cyber p-4 sm:p-6"
          >
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location & Timezone
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Select your location and timezone will be set automatically.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Country</Label>
                <Select
                  value={country}
                  onValueChange={(val) => {
                    setCountry(val);
                    setCity(""); // Reset city when country changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>City</Label>
                <Select
                  value={city}
                  onValueChange={setCity}
                  disabled={!country}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={country ? "Select city" : "Select country first"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((loc) => (
                      <SelectItem key={loc.city} value={loc.city}>
                        {loc.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Timezone
                </Label>
                <Input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="Auto-detected from location"
                  className="bg-muted/50"
                />
                <p className="text-[10px] text-muted-foreground">
                  Auto-populated based on city selection
                </p>
              </div>
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
              Select all areas where you can mentor students.
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
            transition={{ duration: 0.4, delay: 0.25 }}
            className="card-cyber p-4 sm:p-6"
          >
            <h2 className="text-sm font-semibold text-foreground">Certifications</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Comma-separated list of your certifications.
            </p>
            <div className="mt-3">
              <Input
                value={certificationsText}
                onChange={(e) => setCertificationsText(e.target.value)}
                placeholder="ISC2 CC, Security+, CEH, OSCP"
              />
            </div>
          </motion.section>

          {/* Availability */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="card-cyber p-4 sm:p-6"
          >
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Availability
            </h2>

            {/* Weekly Capacity */}
            <div className="mt-4">
              <Label className="text-xs text-muted-foreground">Weekly Commitment</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {WEEKLY_CAPACITY_OPTIONS.map((opt) => {
                  const active = weeklyCapacity === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setWeeklyCapacity(active ? "" : opt.value)}
                      className={[
                        "rounded-md border px-3 py-2 text-center transition",
                        active
                          ? "border-primary/40 bg-primary/10 text-foreground"
                          : "border-border bg-background/30 text-muted-foreground hover:bg-background/50",
                      ].join(" ")}
                    >
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {opt.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specific Time Slots */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Specific Availability (optional)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAvailabilitySlot}
                  className="h-7 text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Time Slot
                </Button>
              </div>

              {availabilitySlots.length === 0 ? (
                <p className="mt-3 text-xs text-muted-foreground italic">
                  No specific time slots added. Click "Add Time Slot" to specify your
                  available hours.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {availabilitySlots.map((slot, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-background/30 p-2"
                    >
                      <Select
                        value={slot.day}
                        onValueChange={(val) =>
                          updateAvailabilitySlot(index, "day", val)
                        }
                      >
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={slot.startTime}
                        onValueChange={(val) =>
                          updateAvailabilitySlot(index, "startTime", val)
                        }
                      >
                        <SelectTrigger className="w-[90px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <span className="text-xs text-muted-foreground">to</span>

                      <Select
                        value={slot.endTime}
                        onValueChange={(val) =>
                          updateAvailabilitySlot(index, "endTime", val)
                        }
                      >
                        <SelectTrigger className="w-[90px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAvailabilitySlot(index)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>

          {/* Assigned Students */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="card-cyber p-4 sm:p-6"
          >
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assigned Students
              <span className="text-xs font-normal text-muted-foreground">
                ({assignedStudents.length})
              </span>
            </h2>

            {assignedStudents.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground italic">
                No students assigned to you yet.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">#</th>
                      <th className="pb-2 pr-4 font-medium">Name</th>
                      <th className="pb-2 pr-4 font-medium">Email</th>
                      <th className="pb-2 font-medium">Assigned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedStudents.map((s, i) => (
                      <tr
                        key={s.id}
                        className="border-b border-border/30 last:border-0"
                      >
                        <td className="py-2 pr-4 text-xs text-muted-foreground">
                          {i + 1}
                        </td>
                        <td className="py-2 pr-4 text-foreground">
                          {s.full_name || "Unknown"}
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                          {s.email || "—"}
                        </td>
                        <td className="py-2 text-xs text-muted-foreground">
                          {new Date(s.assigned_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.section>
        </div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6 sm:mt-10 pb-6 sm:pb-8 text-center"
        >
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Trainer Portal - Profile saved to Supabase (RLS-protected)
          </p>
        </motion.footer>
      </main>
    </div>
  );
}

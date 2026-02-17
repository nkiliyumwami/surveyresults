import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Navbar } from "@/components/layout/Navbar";

type TrainerProfileRow = {
  id: string; // uuid
  user_id?: string | null; // may exist, may be null depending on your schema/data
  email?: string | null;
  full_name?: string | null;
  timezone?: string | null;
  country?: string | null;
  city?: string | null;
  bio?: string | null;
  expertise?: string[] | null;
  certifications?: string[] | null;
  availability?: string[] | null;
  max_students?: number | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

type TrainerRoleRow = {
  user_id: string;
  role: string;
  created_at?: string | null;
};

const ROLE_OPTIONS = ["trainer", "admin"] as const;
type RoleOption = (typeof ROLE_OPTIONS)[number];

function safeLower(v: unknown) {
  return (v ?? "").toString().toLowerCase();
}

function formatDate(dt?: string | null) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<TrainerProfileRow[]>([]);
  const [roles, setRoles] = useState<TrainerRoleRow[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<TrainerProfileRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // -------- Fetch: trainer_profiles + trainer_roles ----------
  async function loadAll() {
    setLoading(true);
    try {
      // 1) Fetch all profiles
      const profRes = await supabase
        .from("trainer_profiles")
        .select(
          `
          id,
          user_id,
          email,
          full_name,
          timezone,
          country,
          city,
          bio,
          expertise,
          certifications,
          availability,
          max_students,
          is_active,
          created_at,
          updated_at
        `
        )
        .order("updated_at", { ascending: false, nullsFirst: false });

      if (profRes.error) throw profRes.error;

      // 2) Fetch all roles
      const roleRes = await supabase
        .from("trainer_roles")
        .select("user_id, role, created_at");

      if (roleRes.error) throw roleRes.error;

      setProfiles((profRes.data ?? []) as TrainerProfileRow[]);
      setRoles((roleRes.data ?? []) as TrainerRoleRow[]);
    } catch (err: any) {
      console.error("Admin loadAll error:", err);
      toast({
        title: "Failed to load admin data",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------- Derived: roles map ----------
  const rolesByUserId = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const r of roles) {
      if (!map.has(r.user_id)) map.set(r.user_id, new Set());
      map.get(r.user_id)!.add(r.role);
    }
    return map;
  }, [roles]);

  // -------- Filtered list ----------
  const filtered = useMemo(() => {
    const needle = safeLower(q).trim();
    if (!needle) return profiles;

    return profiles.filter((p) => {
      const hay = [
        p.full_name,
        p.email,
        p.country,
        p.city,
        p.timezone,
        p.user_id,
      ]
        .map((x) => safeLower(x))
        .join(" | ");
      return hay.includes(needle);
    });
  }, [profiles, q]);

  // -------- Mutations ----------
  async function toggleActive(profile: TrainerProfileRow) {
    const next = !profile.is_active;
    setBusyId(profile.id);

    // Optimistic update
    setProfiles((prev) =>
      prev.map((p) => (p.id === profile.id ? { ...p, is_active: next } : p))
    );

    try {
      const res = await supabase
        .from("trainer_profiles")
        .update({ is_active: next })
        .eq("id", profile.id)
        .select("id, is_active")
        .single();

      if (res.error) throw res.error;

      toast({
        title: "Updated",
        description: `${profile.full_name ?? profile.email ?? "Trainer"} is now ${
          next ? "active" : "inactive"
        }.`,
      });
    } catch (err: any) {
      console.error("toggleActive error:", err);

      // rollback
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profile.id ? { ...p, is_active: !next } : p
        )
      );

      toast({
        title: "Failed to update is_active",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function setRole(userId: string, role: RoleOption, enabled: boolean) {
    setBusyId(userId);

    // optimistic roles update
    setRoles((prev) => {
      const next = [...prev];
      const exists = next.some((r) => r.user_id === userId && r.role === role);

      if (enabled && !exists) {
        next.push({ user_id: userId, role });
      }
      if (!enabled && exists) {
        return next.filter((r) => !(r.user_id === userId && r.role === role));
      }
      return next;
    });

    try {
      if (enabled) {
        // Upsert (expects unique on (user_id, role) or similar)
        const ins = await supabase
          .from("trainer_roles")
          .upsert(
            [{ user_id: userId, role }],
            { onConflict: "user_id,role" }
          )
          .select("user_id, role")
          .single();

        if (ins.error) throw ins.error;
      } else {
        const del = await supabase
          .from("trainer_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);

        if (del.error) throw del.error;
      }

      toast({
        title: "Role updated",
        description: enabled
          ? `Added role: ${role}`
          : `Removed role: ${role}`,
      });
    } catch (err: any) {
      console.error("setRole error:", err);

      // rollback by reloading authoritative state
      toast({
        title: "Failed to update role",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });

      await loadAll();
    } finally {
      setBusyId(null);
    }
  }

  // -------- UI helpers ----------
  function getUserRoles(userId?: string | null): string[] {
    if (!userId) return [];
    return Array.from(rolesByUserId.get(userId) ?? []);
  }

  function StatusBadge({ active }: { active: boolean }) {
    return (
      <Badge variant={active ? "default" : "secondary"}>
        {active ? "Active" : "Inactive"}
      </Badge>
    );
  }

  async function deleteTrainer(userId: string, fullName: string) {
    if (!confirm("Are you sure you want to delete trainer " + fullName + "? This cannot be undone.")) return;
    setBusyId(userId);
    try {
      // Delete roles first (FK dependency)
      await supabase.from("trainer_roles").delete().eq("user_id", userId);
      // Delete the profile
      const { data, error } = await supabase
        .from("trainer_profiles")
        .delete()
        .eq("user_id", userId)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Delete blocked by database policy. Please add a DELETE RLS policy for admins on trainer_profiles.");
      }
      toast({ title: "Success", description: "Trainer " + fullName + " has been deleted." });
      await loadAll();
      setSelected(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete trainer", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />

      <div className="relative mx-auto w-full max-w-6xl px-2 sm:px-4 pt-20 pb-4 sm:pt-24 sm:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Admin • Trainers
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage trainer profiles, activation, and roles.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email, country, city…"
                className="w-full sm:w-[320px] text-sm"
              />
              <Button variant="outline" onClick={() => loadAll()} disabled={loading}>
                Refresh
              </Button>
            </div>
          </div>

          <Card className="border-border/60 bg-card/40 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Trainer profiles ({filtered.length})
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-2">
              {loading ? (
                <div className="py-10 text-center text-muted-foreground">
                  Loading trainers…
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  No matching trainers found.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr className="text-left">
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Email</th>
                        <th className="px-3 py-2 font-medium hidden md:table-cell">Location</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium hidden lg:table-cell">Roles</th>
                        <th className="px-3 py-2 font-medium text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filtered.map((p) => {
                        const userRoles = getUserRoles(p.user_id);
                        const name = p.full_name?.trim() || "—";
                        const email = p.email?.trim() || "—";
                        const loc = [p.city, p.country]
                          .filter(Boolean)
                          .join(", ")
                          .trim();
                        const isBusy = busyId === p.id || busyId === p.user_id;

                        return (
                          <tr
                            key={p.id}
                            className="border-t border-border/60 hover:bg-muted/20"
                          >
                            <td className="px-3 py-2">
                              <div className="font-medium">{name}</div>
                              <div className="text-xs text-muted-foreground">
                                Updated: {formatDate(p.updated_at)}
                              </div>
                            </td>

                            <td className="px-3 py-2">{email}</td>

                            <td className="px-3 py-2 hidden md:table-cell">
                              <div>{loc || "—"}</div>
                              <div className="text-xs text-muted-foreground">
                                TZ: {p.timezone || "—"}
                              </div>
                            </td>

                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <StatusBadge active={p.is_active} />
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={p.is_active}
                                    disabled={isBusy}
                                    onCheckedChange={() => toggleActive(p)}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="px-3 py-2 hidden lg:table-cell">
                              {p.user_id ? (
                                <div className="flex flex-wrap gap-1">
                                  {userRoles.length ? (
                                    userRoles.map((r) => (
                                      <Badge key={r} variant="outline">
                                        {r}
                                      </Badge>
                                    ))
                                  ) : (
                                    <Badge variant="secondary">none</Badge>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="secondary">no user_id</Badge>
                              )}
                            </td>

                            <td className="px-3 py-2 text-right">
                              <Button
                                variant="secondary"
                                onClick={() => setSelected(p)}
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Details modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl w-[95vw] sm:w-full max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trainer details</DialogTitle>
            <DialogDescription>
              View profile and manage roles / activation.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="text-lg font-semibold">
                    {selected.full_name || "—"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selected.email || "—"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {[
                      selected.city,
                      selected.country,
                      selected.timezone ? `(${selected.timezone})` : null,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Profile ID: {selected.id}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    User ID: {selected.user_id ?? "—"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge active={selected.is_active} />
                  <Switch
                    checked={selected.is_active}
                    disabled={busyId === selected.id}
                    onCheckedChange={async () => {
                      // keep modal state consistent with list
                      const before = selected;
                      await toggleActive(before);
                      // refresh modal selected object from latest profiles state
                      setSelected((curr) => {
                        if (!curr) return curr;
                        const latest = profiles.find((p) => p.id === curr.id);
                        return latest ?? curr;
                      });
                    }}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="bg-card/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Bio</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {selected.bio?.trim() || "—"}
                  </CardContent>
                </Card>

                <Card className="bg-card/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Capacity</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Max students</span>
                      <span className="font-medium">
                        {selected.max_students ?? "—"}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Created: {formatDate(selected.created_at)} <br />
                      Updated: {formatDate(selected.updated_at)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Expertise</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {selected.expertise?.length ? (
                    selected.expertise.map((x) => (
                      <Badge key={x} variant="outline">
                        {x}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="bg-card/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Certifications</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {selected.certifications?.length ? (
                      selected.certifications.map((x) => (
                        <Badge key={x} variant="outline">
                          {x}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Availability</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {selected.availability?.length ? (
                      selected.availability.map((x) => (
                        <Badge key={x} variant="outline">
                          {x}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <Card className="bg-card/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Roles</CardTitle>
                </CardHeader>
                <CardContent>
                  {!selected.user_id ? (
                    <div className="text-sm text-muted-foreground">
                      This trainer profile is not linked to an auth user
                      (`user_id` is missing), so roles cannot be managed here.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        Toggle roles for this user in <code>trainer_roles</code>.
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {ROLE_OPTIONS.map((r) => {
                          const userRoles = getUserRoles(selected.user_id);
                          const checked = userRoles.includes(r);
                          const isBusy = busyId === selected.user_id;

                          return (
                            <label
                              key={r}
                              className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2"
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={checked}
                                disabled={isBusy}
                                onChange={(e) =>
                                  setRole(
                                    selected.user_id as string,
                                    r,
                                    e.target.checked
                                  )
                                }
                              />
                              <span className="text-sm font-medium">{r}</span>
                              {checked && <Badge variant="outline">on</Badge>}
                            </label>
                          );
                        })}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Tip: keep at least one admin account to avoid lockout.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                              <Button
                variant="destructive"
                onClick={() => deleteTrainer(selected.user_id, selected.full_name || "Unknown")}
                disabled={busyId === selected.user_id}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Trainer
              </Button>
              <Button variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

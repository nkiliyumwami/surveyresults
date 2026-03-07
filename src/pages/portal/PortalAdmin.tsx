import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Clock,
  Shield,
  RefreshCw,
  RotateCcw,
  Square,
  Send,
  Trash2,
  Plus,
  Info,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Navbar } from "@/components/layout/Navbar";
import { KPICard } from "@/components/dashboard/KPICard";
import { usePortalAuth } from "@/hooks/usePortalAuth";
import { getPortalToken } from "@/lib/portalApi";
import {
  adminListStudents,
  adminCreateStudent,
  adminExtendStudent,
  adminRevokeStudent,
  adminDeleteStudent,
  adminNotifyStudent,
  adminRestartContainer,
  adminStopContainer,
  type AdminStudent,
} from "@/lib/portalApi";

function PageLoader() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <div className="relative flex min-h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    </div>
  );
}

function generatePassword(length = 12): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => charset[b % charset.length]).join("");
}

export default function PortalAdmin() {
  const navigate = useNavigate();
  const { student, loading: authLoading } = usePortalAuth();
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [tableLoading, setTableLoading] = useState(true);

  // Provision dialog state
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [provisionLoading, setProvisionLoading] = useState(false);
  const [formUsername, setFormUsername] = useState("");
  const [formName, setFormName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formDays, setFormDays] = useState(7);
  const [formTelegram, setFormTelegram] = useState("");

  // Revoke confirm dialog
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Action loading tracker
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Auth guards
  useEffect(() => {
    if (!authLoading && !getPortalToken()) {
      navigate("/portal/login", { replace: true });
    }
  }, [authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && student && student.role !== "admin") {
      navigate("/portal", { replace: true });
    }
  }, [authLoading, student, navigate]);

  const fetchStudents = useCallback(async () => {
    setTableLoading(true);
    try {
      const { students } = await adminListStudents();
      setStudents(students);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load students"
      );
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    if (student?.role === "admin") {
      fetchStudents();
    }
  }, [student, fetchStudents]);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionLoading(true);
    try {
      const result = await adminCreateStudent({
        username: formUsername,
        name: formName,
        password: formPassword,
        days: formDays,
        telegramUsername: formTelegram || undefined,
      });
      toast.success(
        `${formName} provisioned — SSH ${result.host}:${result.sshPort}`
      );
      setProvisionOpen(false);
      resetForm();
      fetchStudents();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Provisioning failed"
      );
    } finally {
      setProvisionLoading(false);
    }
  };

  const resetForm = () => {
    setFormUsername("");
    setFormName("");
    setFormPassword("");
    setFormDays(7);
    setFormTelegram("");
  };

  const handleAction = async (
    action: () => Promise<unknown>,
    successMsg: string,
    key: string
  ) => {
    setActionLoading(key);
    try {
      await action();
      toast.success(successMsg);
      fetchStudents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await handleAction(
      () => adminDeleteStudent(deleteTarget),
      `${deleteTarget} deleted`,
      `delete-${deleteTarget}`
    );
    setDeleteTarget(null);
  };
  const handleRevoke = async () => {
    if (!revokeTarget) return;
    await handleAction(
      () => adminRevokeStudent(revokeTarget),
      `${revokeTarget} revoked`,
      `revoke-${revokeTarget}`
    );
    setRevokeTarget(null);
  };

  if (authLoading) return <PageLoader />;
  if (!student || student.role !== "admin") return null;

  // Compute KPI stats
  const activeCount = students.filter(
    (s) => s.status === "running" && !s.revoked
  ).length;
  const expiringCount = students.filter((s) => {
    const diff = new Date(s.expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 86400000 && !s.revoked;
  }).length;
  const totalCount = students.length;

  const daysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / 86400000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => navigate("/portal")}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Dashboard
          </Button>

          <h1 className="text-3xl font-bold text-foreground mb-6">
            <span className="text-gradient-cyber">Admin Console</span>
          </h1>
        </motion.div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <KPICard
            title="Active Students"
            value={activeCount}
            icon={Users}
            iconColor="text-cyber-green"
            iconBg="bg-cyber-green/10"
            delay={0.1}
            isNumeric
          />
          <KPICard
            title="Expiring in 24h"
            value={expiringCount}
            icon={Clock}
            iconColor="text-cyber-amber"
            iconBg="bg-cyber-amber/10"
            delay={0.2}
            isNumeric
          />
          <KPICard
            title="Total Students"
            value={totalCount}
            icon={Shield}
            iconColor="text-primary"
            iconBg="bg-primary/10"
            delay={0.3}
            isNumeric
          />
        </div>

        {/* Students table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="card-cyber overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Students</h2>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={fetchStudents}
                disabled={tableLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${tableLoading ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  resetForm();
                  setProvisionOpen(true);
                }}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Provision
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>SSH</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trial</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No students provisioned yet
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((s) => {
                    const days = daysLeft(s.expiresAt);
                    const isRunning = s.status === "running";
                    const isRevoked = s.revoked;

                    return (
                      <TableRow key={s.username}>
                        <TableCell className="font-medium">
                          {s.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {s.username}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {s.host && s.sshPort
                            ? `${s.host}:${s.sshPort}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {isRevoked ? (
                            <Badge variant="secondary">Revoked</Badge>
                          ) : isRunning ? (
                            <Badge className="bg-cyber-green/20 text-cyber-green border-cyber-green/30">
                              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-cyber-green animate-pulse" />
                              Running
                            </Badge>
                          ) : (
                            <Badge variant="destructive">{s.status}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {days > 0 ? (
                            <Badge
                              variant="outline"
                              className={
                                days <= 1
                                  ? "border-destructive text-destructive"
                                  : days <= 3
                                    ? "border-cyber-amber text-cyber-amber"
                                    : ""
                              }
                            >
                              {days}d left
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Expired</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={
                                    actionLoading === `extend-${s.username}` ||
                                    isRevoked
                                  }
                                  onClick={() =>
                                    handleAction(
                                      () =>
                                        adminExtendStudent(s.username, 7),
                                      `${s.name} extended +7 days`,
                                      `extend-${s.username}`
                                    )
                                  }
                                >
                                  {actionLoading ===
                                  `extend-${s.username}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Extend +7 days</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={
                                    actionLoading ===
                                      `restart-${s.username}` || isRevoked
                                  }
                                  onClick={() =>
                                    handleAction(
                                      () =>
                                        adminRestartContainer(s.username),
                                      `${s.name} container restarted`,
                                      `restart-${s.username}`
                                    )
                                  }
                                >
                                  {actionLoading ===
                                  `restart-${s.username}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RotateCcw className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Restart container
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={
                                    actionLoading ===
                                      `stop-${s.username}` || isRevoked
                                  }
                                  onClick={() =>
                                    handleAction(
                                      () =>
                                        adminStopContainer(s.username),
                                      `${s.name} container stopped`,
                                      `stop-${s.username}`
                                    )
                                  }
                                >
                                  {actionLoading ===
                                  `stop-${s.username}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Square className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Stop container</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={
                                    actionLoading ===
                                      `notify-${s.username}` ||
                                    isRevoked ||
                                    !s.telegramLinked
                                  }
                                  onClick={() =>
                                    handleAction(
                                      () =>
                                        adminNotifyStudent(s.username),
                                      `Credentials sent to ${s.name}`,
                                      `notify-${s.username}`
                                    )
                                  }
                                >
                                  {actionLoading ===
                                  `notify-${s.username}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Send TG credentials
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  disabled={false}
                                  onClick={() =>
                                    setDeleteTarget(s.username)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete student</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </div>

      {/* Provision Dialog */}
      <Dialog open={provisionOpen} onOpenChange={setProvisionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Provision Student</DialogTitle>
            <DialogDescription>
              Create a new student training environment
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProvision} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Username
              </label>
              <Input
                placeholder="john.doe"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Display Name
              </label>
              <Input
                placeholder="John Doe"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  required
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormPassword(generatePassword())}
                >
                  Generate
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Trial Days
              </label>
              <Input
                type="number"
                min={1}
                max={90}
                value={formDays}
                onChange={(e) => setFormDays(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Telegram Username{" "}
                <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                placeholder="@johndoe"
                value={formTelegram}
                onChange={(e) => setFormTelegram(e.target.value)}
              />
            </div>

            <div className="rounded-md bg-primary/10 p-3 text-sm text-primary/80 flex gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                SSH host &amp; port are assigned automatically by the VPS.
              </span>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setProvisionOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={provisionLoading}>
                {provisionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Provisioning...
                  </>
                ) : (
                  "Provision"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Revoke confirm dialog */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Student Access</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently revoke{" "}
              <span className="font-mono font-semibold">{revokeTarget}</span>'s
              access, stop their container, and invalidate all sessions. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Delete confirm dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-mono font-semibold">{deleteTarget}</span>'s
              account, remove their container, and erase all data. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

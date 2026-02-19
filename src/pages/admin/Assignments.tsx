/**
 * Admin Assignments Dashboard
 *
 * Features:
 * - Lists unassigned students (no entry in assignments table)
 * - "Find Best Match" button runs matching algorithm
 * - Shows top 3 trainer matches with scores
 * - "Assign" button creates assignment in database
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, Sparkles, UserPlus, Check, RefreshCw, ChevronDown, ChevronUp, ExternalLink, Info, Zap, AlertCircle, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Navbar } from "@/components/layout/Navbar";
import { Progress } from "@/components/ui/progress";
import {
  getBestMatches,
  fetchActiveTrainers,
  bulkAutoAssign,
  type StudentForMatching,
  type TrainerForMatching,
  type MatchScore,
  type BulkAssignmentProgress,
  type BulkAssignmentResult,
} from "@/utils/matchingEngine";

// ============================================================
// Types
// ============================================================

interface StudentRow {
  id: string;
  email: string | null;
  full_name: string | null;
  country: string | null;
  journey_level: string | null;
  target_role: string | null;
  roadblock: string | null;
  weekly_hours: string | null;
  certifications: string | null;
  created_at: string | null;
}

interface AssignmentRow {
  id: string;
  student_id: string;
  trainer_id: string;
  status: string;
  created_at: string;
  trainer?: {
    id: string;
    full_name: string | null;
  };
}

// ============================================================
// Helper Functions
// ============================================================

function getShortRole(role: string | null): string {
  if (!role) return "Unknown";
  const colonIndex = role.indexOf(":");
  return colonIndex > -1 ? role.substring(0, colonIndex).trim() : role;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-green-500/10 border-green-500/30";
  if (score >= 60) return "bg-yellow-500/10 border-yellow-500/30";
  if (score >= 40) return "bg-orange-500/10 border-orange-500/30";
  return "bg-red-500/10 border-red-500/30";
}

// ============================================================
// Student Card Component
// ============================================================

interface StudentCardProps {
  student: StudentRow;
  trainers: TrainerForMatching[];
  onAssigned: () => void;
}

function StudentCard({ student, trainers, onAssigned }: StudentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matches, setMatches] = useState<MatchScore[] | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

  const handleFindMatch = async () => {
    setMatching(true);
    setMatches(null);

    try {
      const studentData: StudentForMatching = {
        id: student.id,
        full_name: student.full_name,
        target_role: student.target_role,
        weekly_hours: student.weekly_hours,
        journey_level: student.journey_level,
        roadblock: student.roadblock,
        certifications: student.certifications,
      };

      const results = await getBestMatches(studentData, trainers, 3);
      setMatches(results);
      setExpanded(true);
    } catch (error) {
      console.error("Matching error:", error);
      toast({
        title: "Matching Failed",
        description: "Could not calculate matches. Please try again.",
        variant: "destructive",
      });
    } finally {
      setMatching(false);
    }
  };

  const handleAssign = async (trainerId: string, trainerName: string) => {
    setAssigning(trainerId);

    try {
      const { error } = await supabase.from("assignments").insert({
        student_id: student.id,
        trainer_id: trainerId,
        status: "active",
      });

      if (error) throw error;

      toast({
        title: "Assignment Created",
        description: `Student has been assigned to ${trainerName}.`,
      });

      onAssigned();
    } catch (error: any) {
      console.error("Assignment error:", error);
      toast({
        title: "Assignment Failed",
        description: error.message || "Could not create assignment.",
        variant: "destructive",
      });
    } finally {
      setAssigning(null);
    }
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4">
        {/* Student Info Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Line 1: Full Name (Bold, Primary) */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-2 mb-1"
            >
              <span className="truncate">{student.full_name || "Unknown"}</span>
              <Info className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            </button>

            {/* Line 2: Email */}
            {student.email && (
              <p className="text-sm text-muted-foreground mb-1 font-mono">
                {student.email}
              </p>
            )}

            {/* Line 3: Role & Country (small) */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {student.target_role && (
                <span className="text-primary">{getShortRole(student.target_role)}</span>
              )}
              {student.country && (
                <>
                  <span>•</span>
                  <span>{student.country}</span>
                </>
              )}
              {student.weekly_hours && (
                <>
                  <span>•</span>
                  <span>{student.weekly_hours}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
              className="gap-1"
            >
              <Info className="h-4 w-4" />
              Details
            </Button>
            <Button
              size="sm"
              onClick={handleFindMatch}
              disabled={matching}
              className="gap-1"
            >
              {matching ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Matching...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Find Best Match
                </>
              )}
            </Button>

            {matches && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Student Details (Expandable) */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/50"
          >
            <h4 className="text-sm font-medium text-foreground mb-3">Student Profile</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Journey Level:</p>
                <p className="text-foreground">{student.journey_level || "Not specified"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Target Role:</p>
                <p className="text-foreground">{student.target_role || "Not specified"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Roadblock:</p>
                <p className="text-foreground">{student.roadblock || "Not specified"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Weekly Hours:</p>
                <p className="text-foreground">{student.weekly_hours || "Not specified"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-muted-foreground mb-1">Certifications:</p>
                <p className="text-foreground">{student.certifications || "None listed"}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Match Results (Expanded) */}
        {expanded && matches && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-border/50"
          >
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Top 3 Matches
            </h4>

            <div className="space-y-2">
              {matches.map((match, i) => (
                <div
                  key={match.trainerId}
                  className={`flex items-center justify-between p-3 rounded-lg border ${getScoreBg(match.totalScore)}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl font-bold ${getScoreColor(match.totalScore)}`}>
                      #{i + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {match.trainerName}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            match.breakdown.currentAssignments >= match.breakdown.maxCapacity
                              ? "bg-red-500/10 text-red-400 border-red-500/30"
                              : "bg-primary/10 text-primary border-primary/30"
                          }`}
                        >
                          ({match.breakdown.currentAssignments}/{match.breakdown.maxCapacity})
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {match.breakdown.skillsMatch.length > 0 ? (
                          <span>Skills: {match.breakdown.skillsMatch.slice(0, 2).join(", ")}</span>
                        ) : (
                          <span>No direct skill match</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-xl font-bold ${getScoreColor(match.totalScore)}`}>
                        {match.totalScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Match Score
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={i === 0 ? "default" : "outline"}
                      onClick={() => handleAssign(match.trainerId, match.trainerName)}
                      disabled={assigning === match.trainerId || match.breakdown.currentAssignments >= match.breakdown.maxCapacity}
                      className="gap-1"
                    >
                      {assigning === match.trainerId ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Assigning...
                        </>
                      ) : match.breakdown.currentAssignments >= match.breakdown.maxCapacity ? (
                        "At Capacity"
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3" />
                          Assign
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {matches.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No suitable trainers found. Try adding more trainers or updating their profiles.
              </p>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Assigned Student Card Component
// ============================================================

interface AssignedStudentCardProps {
  student: StudentRow;
  assignment: AssignmentRow;
}

function AssignedStudentCard({ student, assignment }: AssignedStudentCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Line 1: Full Name (Bold, Primary) + Status Badge */}
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <span className="truncate">{student.full_name || "Unknown"}</span>
                <Info className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              </button>
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
                {assignment.status}
              </Badge>
            </div>

            {/* Line 2: Email */}
            {student.email && (
              <p className="text-sm text-muted-foreground mb-1 font-mono">
                {student.email}
              </p>
            )}

            {/* Line 3: Role & Country (small) */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {student.target_role && (
                <span className="text-primary">{getShortRole(student.target_role)}</span>
              )}
              {student.country && (
                <>
                  <span>•</span>
                  <span>{student.country}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Info className="h-4 w-4" />
            </Button>

            <div className="text-right">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                <Link
                  to={`/trainer/admin`}
                  className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  {assignment.trainer?.full_name || "Unknown Trainer"}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                Assigned {new Date(assignment.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Student Details (Expandable) */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/50"
          >
            <h4 className="text-sm font-medium text-foreground mb-3">Student Profile</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Journey Level:</p>
                <p className="text-foreground">{student.journey_level || "Not specified"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Target Role:</p>
                <p className="text-foreground">{student.target_role || "Not specified"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Roadblock:</p>
                <p className="text-foreground">{student.roadblock || "Not specified"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Weekly Hours:</p>
                <p className="text-foreground">{student.weekly_hours || "Not specified"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-muted-foreground mb-1">Certifications:</p>
                <p className="text-foreground">{student.certifications || "None listed"}</p>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function Assignments() {
  const [loading, setLoading] = useState(true);
  const [unassignedStudents, setUnassignedStudents] = useState<StudentRow[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<(StudentRow & { assignment: AssignmentRow })[]>([]);
  const [trainers, setTrainers] = useState<TrainerForMatching[]>([]);
  const [activeTab, setActiveTab] = useState<"unassigned" | "assigned">("unassigned");

  // Bulk assignment state
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<BulkAssignmentProgress | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkAssignmentResult | null>(null);

  const handleBulkAutoAssign = async () => {
    if (unassignedStudents.length === 0) {
      toast({
        title: "No Students to Assign",
        description: "All students have already been assigned to trainers.",
      });
      return;
    }

    if (trainers.length === 0) {
      toast({
        title: "No Active Trainers",
        description: "Please add active trainers before assigning students.",
        variant: "destructive",
      });
      return;
    }

    // Confirm before proceeding
    const confirmed = window.confirm(
      `This will automatically assign ${unassignedStudents.length} students to trainers based on matching scores. Continue?`
    );
    if (!confirmed) return;

    setBulkAssigning(true);
    setBulkResult(null);
    setBulkProgress({ current: 0, total: unassignedStudents.length, currentStudent: "", phase: "matching" });

    try {
      // Convert StudentRow to StudentForMatching
      const studentsForMatching: StudentForMatching[] = unassignedStudents.map((s) => ({
        id: s.id,
        full_name: s.full_name,
        target_role: s.target_role,
        weekly_hours: s.weekly_hours,
        journey_level: s.journey_level,
        roadblock: s.roadblock,
        certifications: s.certifications,
      }));

      const result = await bulkAutoAssign(studentsForMatching, trainers, (progress) => {
        setBulkProgress(progress);
      });

      setBulkResult(result);

      if (result.success) {
        toast({
          title: "Bulk Assignment Complete",
          description: `Successfully assigned ${result.assigned} students to trainers.`,
        });
      } else if (result.assigned > 0) {
        toast({
          title: "Bulk Assignment Partially Complete",
          description: `Assigned ${result.assigned} of ${result.totalStudents} students. ${result.noMatchFound} could not be matched.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Bulk Assignment Failed",
          description: result.errors[0] || "Failed to assign students.",
          variant: "destructive",
        });
      }

      // Reload data to reflect changes
      await loadData();
    } catch (error: any) {
      console.error("Bulk assignment error:", error);
      toast({
        title: "Bulk Assignment Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setBulkAssigning(false);
      setBulkProgress(null);
    }
  };

  // Reset assignments state
  const [resetting, setResetting] = useState(false);

  const handleResetAllAssignments = async () => {
    // Safety confirmation
    const confirmed = window.confirm(
      "Are you sure? This will unassign all students from their trainers. You will need to run the Auto-Assign again."
    );
    if (!confirmed) return;

    setResetting(true);

    try {
      // Delete all assignments (keeps students intact)
      const { error } = await supabase
        .from("assignments")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all records

      if (error) throw error;

      toast({
        title: "Assignments Reset",
        description: `Successfully removed all assignments. ${assignedStudents.length} students are now unassigned.`,
      });

      // Reload data to reflect changes
      await loadData();
    } catch (error: any) {
      console.error("Reset assignments error:", error);
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset assignments.",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all students
      const { data: allStudents, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (studentsError) throw studentsError;

      // 2. Fetch all assignments with trainer info
      const { data: assignments, error: assignmentsError } = await supabase
        .from("assignments")
        .select(`
          id,
          student_id,
          trainer_id,
          status,
          created_at,
          trainer:trainer_profiles(id, full_name)
        `);

      if (assignmentsError) throw assignmentsError;

      // 3. Separate assigned vs unassigned
      const assignedIds = new Set((assignments || []).map((a) => a.student_id));

      const unassigned: StudentRow[] = [];
      const assigned: (StudentRow & { assignment: AssignmentRow })[] = [];

      for (const student of allStudents || []) {
        if (assignedIds.has(student.id)) {
          const assignment = assignments?.find((a) => a.student_id === student.id);
          if (assignment) {
            assigned.push({ ...student, assignment: assignment as AssignmentRow });
          }
        } else {
          unassigned.push(student);
        }
      }

      setUnassignedStudents(unassigned);
      setAssignedStudents(assigned);

      // 4. Fetch active trainers for matching
      const trainerData = await fetchActiveTrainers();
      setTrainers(trainerData);

    } catch (error: any) {
      console.error("Load error:", error);
      toast({
        title: "Failed to load data",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <Navbar />

      <main className="relative pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
              <Users className="h-7 w-7 text-primary" />
              Student Assignments
            </h1>
            <p className="text-muted-foreground mt-1">
              Match students with trainers based on skills and availability
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
          >
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Unassigned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-400">
                  {unassignedStudents.length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Assigned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-400">
                  {assignedStudents.length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Active Trainers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {trainers.length}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bulk Auto-Assign Section */}
          {unassignedStudents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-6"
            >
              <Card className="bg-gradient-to-r from-primary/10 via-cyber-purple/10 to-primary/10 border-primary/30">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Bulk Auto-Assignment</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Automatically match all {unassignedStudents.length} unassigned students with the best available trainers
                          using our weighted scoring algorithm (Skills, Availability, Load Balancing).
                        </p>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      onClick={handleBulkAutoAssign}
                      disabled={bulkAssigning || loading || trainers.length === 0}
                      className="gap-2 bg-primary hover:bg-primary/90 whitespace-nowrap"
                    >
                      {bulkAssigning ? (
                        <>
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <Zap className="h-5 w-5" />
                          Auto-Assign All Students
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  {bulkAssigning && bulkProgress && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 pt-4 border-t border-primary/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-foreground">
                          {bulkProgress.phase === "matching" ? "Matching students..." : "Saving assignments..."}
                        </span>
                        <span className="text-sm font-medium text-primary">
                          {bulkProgress.current} / {bulkProgress.total}
                        </span>
                      </div>
                      <Progress
                        value={(bulkProgress.current / bulkProgress.total) * 100}
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        {bulkProgress.currentStudent}
                      </p>
                    </motion.div>
                  )}

                  {/* Result Summary */}
                  {bulkResult && !bulkAssigning && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 pt-4 border-t border-primary/20"
                    >
                      <div className="flex items-start gap-3">
                        {bulkResult.success ? (
                          <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <span className="font-medium text-green-400">{bulkResult.assigned}</span>
                              <span className="text-muted-foreground">assigned</span>
                            </span>
                            {bulkResult.noMatchFound > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="font-medium text-yellow-400">{bulkResult.noMatchFound}</span>
                                <span className="text-muted-foreground">no match found</span>
                              </span>
                            )}
                            {bulkResult.failed > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="font-medium text-red-400">{bulkResult.failed}</span>
                                <span className="text-muted-foreground">failed</span>
                              </span>
                            )}
                          </div>
                          {bulkResult.errors.length > 0 && (
                            <p className="text-xs text-red-400 mt-1">
                              {bulkResult.errors[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === "unassigned" ? "default" : "outline"}
              onClick={() => setActiveTab("unassigned")}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Awaiting Match ({unassignedStudents.length})
            </Button>
            <Button
              variant={activeTab === "assigned" ? "default" : "outline"}
              onClick={() => setActiveTab("assigned")}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Completed Assignments ({assignedStudents.length})
            </Button>
            <Button
              variant="ghost"
              onClick={loadData}
              disabled={loading}
              className="ml-auto gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activeTab === "unassigned" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {unassignedStudents.length === 0 ? (
                <Card className="bg-card/50">
                  <CardContent className="py-12 text-center">
                    <Check className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      All Students Assigned!
                    </h3>
                    <p className="text-muted-foreground">
                      There are no students waiting for assignment.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                unassignedStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    trainers={trainers}
                    onAssigned={loadData}
                  />
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {assignedStudents.length === 0 ? (
                <Card className="bg-card/50">
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No Assignments Yet
                    </h3>
                    <p className="text-muted-foreground">
                      Start by assigning students to trainers.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                assignedStudents.map(({ assignment, ...student }) => (
                  <AssignedStudentCard
                    key={student.id}
                    student={student}
                    assignment={assignment}
                  />
                ))
              )}
            </motion.div>
          )}

          {/* Danger Zone */}
          {assignedStudents.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-12 pt-8 border-t border-border/50"
            >
              <Card className="bg-red-500/5 border-red-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-foreground">Reset All Assignments</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Remove all student-trainer assignments. Students will remain in the database
                        and can be re-assigned using Auto-Assign.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={handleResetAllAssignments}
                      disabled={resetting || loading || assignedStudents.length === 0}
                      className="gap-2 whitespace-nowrap"
                    >
                      {resetting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Reset All Assignments
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

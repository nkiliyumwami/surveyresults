/**
 * Hidden Dev Route: /dev/test-assignments
 *
 * Purpose: Verify that the assignments data infrastructure is working correctly.
 * This page tests:
 * - Insert a dummy student
 * - Insert a dummy assignment
 * - Read assignments
 * - Clean up test data
 *
 * Safety: This page is only for development/verification purposes.
 */

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  data?: unknown;
}

export default function TestAssignments() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const addResult = (result: TestResult) => {
    setResults((prev) => [...prev, result]);
  };

  const runTests = async () => {
    setResults([]);
    setRunning(true);

    let testStudentId: string | null = null;
    let testAssignmentId: string | null = null;
    let trainerId: string | null = null;

    try {
      // Step 1: Check authentication
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        addResult({
          step: "Authentication Check",
          success: false,
          message: "Not authenticated. Please log in as an admin to run tests.",
        });
        setRunning(false);
        return;
      }
      addResult({
        step: "Authentication Check",
        success: true,
        message: `Authenticated as: ${authData.user.email}`,
      });

      // Step 2: Check if tables exist by querying them
      const { error: studentsError } = await supabase
        .from("students")
        .select("id")
        .limit(1);

      if (studentsError) {
        addResult({
          step: "Students Table Check",
          success: false,
          message: `Students table error: ${studentsError.message}. Run the migration first!`,
        });
      } else {
        addResult({
          step: "Students Table Check",
          success: true,
          message: "Students table exists and is accessible",
        });
      }

      const { error: assignmentsError } = await supabase
        .from("assignments")
        .select("id")
        .limit(1);

      if (assignmentsError) {
        addResult({
          step: "Assignments Table Check",
          success: false,
          message: `Assignments table error: ${assignmentsError.message}. Run the migration first!`,
        });
      } else {
        addResult({
          step: "Assignments Table Check",
          success: true,
          message: "Assignments table exists and is accessible",
        });
      }

      // Step 3: Get a trainer to use for testing
      const { data: trainerData, error: trainerError } = await supabase
        .from("trainer_profiles")
        .select("id, full_name")
        .limit(1)
        .single();

      if (trainerError || !trainerData) {
        addResult({
          step: "Get Trainer",
          success: false,
          message: `Could not find a trainer: ${trainerError?.message || "No trainers exist"}`,
        });
        setRunning(false);
        return;
      }
      trainerId = trainerData.id;
      addResult({
        step: "Get Trainer",
        success: true,
        message: `Found trainer: ${trainerData.full_name || "Unnamed"} (${trainerId})`,
      });

      // Step 4: Insert a test student
      const testEmail = `test-${Date.now()}@example.com`;
      const { data: studentData, error: studentInsertError } = await supabase
        .from("students")
        .insert({
          email: testEmail,
          full_name: "Test Student",
          country: "Test Country",
          journey_level: "Absolute Beginner",
          target_role: "Defensive",
          roadblock: "Technical Skills",
          weekly_hours: "5-10 hours",
        })
        .select("id")
        .single();

      if (studentInsertError || !studentData) {
        addResult({
          step: "Insert Test Student",
          success: false,
          message: `Failed to insert student: ${studentInsertError?.message}`,
        });
        setRunning(false);
        return;
      }
      testStudentId = studentData.id;
      addResult({
        step: "Insert Test Student",
        success: true,
        message: `Created test student with ID: ${testStudentId}`,
      });

      // Step 5: Insert a test assignment
      const { data: assignmentData, error: assignmentInsertError } = await supabase
        .from("assignments")
        .insert({
          student_id: testStudentId,
          trainer_id: trainerId,
          status: "active",
          notes: "Test assignment - will be deleted",
        })
        .select("id, status, created_at")
        .single();

      if (assignmentInsertError || !assignmentData) {
        addResult({
          step: "Insert Test Assignment",
          success: false,
          message: `Failed to insert assignment: ${assignmentInsertError?.message}`,
        });
      } else {
        testAssignmentId = assignmentData.id;
        addResult({
          step: "Insert Test Assignment",
          success: true,
          message: `Created test assignment with ID: ${testAssignmentId}`,
          data: assignmentData,
        });
      }

      // Step 6: Read the assignment back
      if (testAssignmentId) {
        const { data: readData, error: readError } = await supabase
          .from("assignments")
          .select(`
            id,
            status,
            created_at,
            student:students(id, full_name, email),
            trainer:trainer_profiles(id, full_name)
          `)
          .eq("id", testAssignmentId)
          .single();

        if (readError) {
          addResult({
            step: "Read Assignment with Relations",
            success: false,
            message: `Failed to read assignment: ${readError.message}`,
          });
        } else {
          addResult({
            step: "Read Assignment with Relations",
            success: true,
            message: "Successfully read assignment with student and trainer data",
            data: readData,
          });
        }
      }

      // Step 7: Clean up - delete test data
      if (testAssignmentId) {
        const { error: deleteAssignmentError } = await supabase
          .from("assignments")
          .delete()
          .eq("id", testAssignmentId);

        addResult({
          step: "Cleanup: Delete Assignment",
          success: !deleteAssignmentError,
          message: deleteAssignmentError
            ? `Failed to delete: ${deleteAssignmentError.message}`
            : "Test assignment deleted",
        });
      }

      if (testStudentId) {
        const { error: deleteStudentError } = await supabase
          .from("students")
          .delete()
          .eq("id", testStudentId);

        addResult({
          step: "Cleanup: Delete Student",
          success: !deleteStudentError,
          message: deleteStudentError
            ? `Failed to delete: ${deleteStudentError.message}`
            : "Test student deleted",
        });
      }

      // Final summary
      addResult({
        step: "Test Complete",
        success: true,
        message: "All infrastructure tests completed. Check results above.",
      });

    } catch (err) {
      addResult({
        step: "Unexpected Error",
        success: false,
        message: `Error: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Assignment Infrastructure Test
        </h1>
        <p className="text-muted-foreground mb-6">
          This page verifies that the students and assignments tables are set up correctly.
          You must be logged in as an admin to run these tests.
        </p>

        <button
          onClick={runTests}
          disabled={running}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 mb-6"
        >
          {running ? "Running Tests..." : "Run Infrastructure Tests"}
        </button>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg border ${
                  result.success
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-red-500/10 border-red-500/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={result.success ? "text-green-500" : "text-red-500"}>
                    {result.success ? "✓" : "✗"}
                  </span>
                  <span className="font-medium text-foreground">{result.step}</span>
                </div>
                <p className="text-sm text-muted-foreground">{result.message}</p>
                {result.data && (
                  <pre className="mt-2 p-2 bg-black/20 rounded text-xs overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-muted/20 rounded-lg">
          <h2 className="font-semibold text-foreground mb-2">Migration Instructions</h2>
          <p className="text-sm text-muted-foreground mb-2">
            If tables don't exist, run this migration in your Supabase SQL Editor:
          </p>
          <code className="text-xs text-primary">
            supabase/migrations/20250217_student_trainer_matching.sql
          </code>
        </div>
      </div>
    </div>
  );
}

/**
 * Hidden Dev Route: /dev/sync-students
 *
 * Purpose: Sync survey respondents to the students table for matching.
 * Features:
 * - Sync from Google Sheets API
 * - Insert mock data for testing
 * - Clear all students (reset)
 */

import { useState } from "react";
import { RefreshCw, Upload, Trash2, Users, Database, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  syncSurveyToStudents,
  insertMockStudents,
  clearAllStudents,
  type SyncResult,
} from "@/utils/studentSync";
import { supabase } from "@/lib/supabase";

export default function SyncStudents() {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshCount = async () => {
    const { count } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true });
    setStudentCount(count || 0);
  };

  const handleSyncSurvey = async () => {
    setLoading("sync");
    setResult(null);
    setError(null);

    try {
      const syncResult = await syncSurveyToStudents();
      setResult(syncResult);
      await refreshCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(null);
    }
  };

  const handleInsertMock = async () => {
    setLoading("mock");
    setResult(null);
    setError(null);

    try {
      const syncResult = await insertMockStudents();
      setResult(syncResult);
      await refreshCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(null);
    }
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to delete ALL students and assignments? This cannot be undone.")) {
      return;
    }

    setLoading("clear");
    setResult(null);
    setError(null);

    try {
      const clearResult = await clearAllStudents();
      if (clearResult.success) {
        setResult({
          success: true,
          imported: 0,
          skipped: 0,
          errors: [],
          details: [`Deleted ${clearResult.deleted} students (and their assignments)`],
        });
      } else {
        setError(clearResult.error || "Failed to clear students");
      }
      await refreshCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(null);
    }
  };

  // Refresh count on mount
  useState(() => {
    refreshCount();
  });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Database className="h-7 w-7 text-primary" />
          Student Data Sync
        </h1>
        <p className="text-muted-foreground mb-6">
          Import survey respondents into the students table for matching.
        </p>

        {/* Current Count */}
        <Card className="mb-6 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Current Students in Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-4xl font-bold text-primary">
                {studentCount ?? "..."}
              </span>
              <Button variant="ghost" size="sm" onClick={refreshCount}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* NUKE BUTTON - Prominent Reset */}
        <Card className="mb-6 bg-red-500/10 border-red-500/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <div>
                  <h3 className="font-bold text-red-400">Nuke All Students</h3>
                  <p className="text-xs text-red-300/70">
                    Permanently delete ALL students and assignments. Use this to start fresh.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleClear}
                disabled={loading !== null}
                variant="destructive"
                size="lg"
                className="gap-2 bg-red-600 hover:bg-red-700"
              >
                {loading === "clear" ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
                NUKE ALL
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <h3 className="font-medium text-foreground mb-2">Sync Survey Data</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Import respondents from Google Sheets API
              </p>
              <Button
                onClick={handleSyncSurvey}
                disabled={loading !== null}
                className="w-full gap-2"
              >
                {loading === "sync" ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Sync Survey
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="p-4">
              <h3 className="font-medium text-foreground mb-2">Insert Mock Data</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Add 5 test students with varied profiles
              </p>
              <Button
                onClick={handleInsertMock}
                disabled={loading !== null}
                variant="outline"
                className="w-full gap-2"
              >
                {loading === "mock" ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
                Add Mock Students
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="p-4">
              <h3 className="font-medium text-foreground mb-2">Clear All</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Delete all students and assignments
              </p>
              <Button
                onClick={handleClear}
                disabled={loading !== null}
                variant="destructive"
                className="w-full gap-2"
              >
                {loading === "clear" ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Clear All
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 bg-red-500/10 border-red-500/30">
            <CardContent className="p-4">
              <h3 className="font-medium text-red-400 mb-2">Error</h3>
              <p className="text-sm text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Result Display */}
        {result && (
          <Card className={`mb-6 ${result.success ? "bg-green-500/10 border-green-500/30" : "bg-yellow-500/10 border-yellow-500/30"}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm ${result.success ? "text-green-400" : "text-yellow-400"}`}>
                {result.success ? "Operation Complete" : "Operation Completed with Warnings"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{result.imported}</div>
                  <div className="text-xs text-muted-foreground">Imported</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{result.skipped}</div>
                  <div className="text-xs text-muted-foreground">Skipped</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{result.errors.length}</div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                </div>
              </div>

              {result.details.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-muted-foreground">Details:</h4>
                  {result.details.map((detail, i) => (
                    <p key={i} className="text-xs text-foreground">{detail}</p>
                  ))}
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="mt-4 space-y-1">
                  <h4 className="text-xs font-medium text-red-400">Errors:</h4>
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-300">{err}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-muted/20">
          <CardContent className="p-4">
            <h3 className="font-medium text-foreground mb-2">Instructions</h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>
                <strong>Sync Survey:</strong> Fetches respondents from Google Sheets and imports them as students.
                Uses timestamp as unique identifier to avoid duplicates.
              </li>
              <li>
                <strong>Mock Data:</strong> Inserts 5 test students with different interests
                (Cloud, SOC, Compliance, Pentesting) for testing the matching algorithm.
              </li>
              <li>
                <strong>Clear All:</strong> Removes all students and their assignments. Use for testing resets.
              </li>
              <li>
                After syncing, go to <code className="text-primary">/admin/assignments</code> to see unassigned students.
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

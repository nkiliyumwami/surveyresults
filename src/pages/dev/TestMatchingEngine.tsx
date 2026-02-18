/**
 * Hidden Dev Route: /dev/test-matching
 *
 * Purpose: Verify the matching engine logic with mock data.
 * Tests the scenario:
 *   - 1 student interested in 'Cloud', needs 5-10 hours/week
 *   - Trainer A: Cloud expertise but AT CAPACITY (busy)
 *   - Trainer B: Web expertise but FREE (has capacity)
 *   - Trainer C: Cloud expertise AND FREE (best match)
 *
 * Expected: Trainer C should score highest
 */

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { StudentForMatching, TrainerForMatching, MatchScore } from "@/utils/matchingEngine";

interface TestResult {
  step: string;
  data?: unknown;
}

// Mock data for testing
const MOCK_STUDENT: StudentForMatching = {
  id: "test-student-001",
  full_name: "Test Student",
  target_role: "Architecture: Cloud Security / Security Engineering",
  weekly_hours: "Dedicated: 5–10 hours",
  journey_level: "IT Professional",
  roadblock: "Technical Skills: I struggle with hands-on tools",
};

const MOCK_TRAINERS: TrainerForMatching[] = [
  {
    id: "trainer-a-cloud-busy",
    full_name: "Trainer A (Cloud + Busy)",
    expertise: ["Cloud Security", "AWS", "Security Engineering"],
    specializations: ["DevSecOps", "Infrastructure Security"],
    availability: ["10 hours/week", "Monday 14:00–18:00", "Wednesday 14:00–18:00"],
    max_capacity: 5,
    max_students: 5,
    is_active: true,
  },
  {
    id: "trainer-b-web-free",
    full_name: "Trainer B (Web + Free)",
    expertise: ["Web Security", "Penetration Testing", "OWASP"],
    specializations: ["Application Security", "Bug Bounty"],
    availability: ["20 hours/week", "Monday 14:00–20:00", "Tuesday 14:00–20:00", "Friday 14:00–18:00"],
    max_capacity: 10,
    max_students: 10,
    is_active: true,
  },
  {
    id: "trainer-c-cloud-free",
    full_name: "Trainer C (Cloud + Free)",
    expertise: ["Cloud Security", "Azure", "GCP", "Security Engineering"],
    specializations: ["Cloud Architecture", "Zero Trust"],
    availability: ["15 hours/week", "Monday 14:00–18:00", "Thursday 14:00–20:00"],
    max_capacity: 8,
    max_students: 8,
    is_active: true,
  },
];

// Simulated assignment counts (to mock capacity)
const MOCK_ASSIGNMENT_COUNTS: Record<string, number> = {
  "trainer-a-cloud-busy": 5,  // AT CAPACITY (5/5)
  "trainer-b-web-free": 2,    // FREE (2/10)
  "trainer-c-cloud-free": 1,  // FREE (1/8)
};

/**
 * Simplified scoring functions (inline to avoid DB calls for simulation)
 */

const WEIGHTS = {
  AVAILABILITY: 40,
  SKILLS: 40,
  CAPACITY: 20,
};

function parseStudentHours(weeklyHours: string | null | undefined): { min: number; max: number } {
  if (!weeklyHours) return { min: 0, max: 0 };
  const lower = weeklyHours.toLowerCase();
  if (lower.includes("2–5") || lower.includes("2-5") || lower.includes("focused")) {
    return { min: 2, max: 5 };
  }
  if (lower.includes("5–10") || lower.includes("5-10") || lower.includes("dedicated")) {
    return { min: 5, max: 10 };
  }
  if (lower.includes("10+") || lower.includes("accelerated")) {
    return { min: 10, max: 40 };
  }
  return { min: 0, max: 0 };
}

function parseTrainerCapacity(availability: string[] | null | undefined): number {
  if (!availability) return 0;
  for (const item of availability) {
    const match = item.match(/^(\d+\+?)\s*hours?\/week$/i);
    if (match) {
      return parseInt(match[1].replace("+", "")) || 0;
    }
  }
  return 0;
}

function calculateAvailabilityScore(
  student: StudentForMatching,
  trainer: TrainerForMatching
): { score: number; description: string } {
  const studentHours = parseStudentHours(student.weekly_hours);
  const trainerCapacity = parseTrainerCapacity(trainer.availability);

  if (trainerCapacity >= studentHours.min) {
    if (trainerCapacity >= studentHours.max) {
      return {
        score: WEIGHTS.AVAILABILITY,
        description: `Full match: Trainer has ${trainerCapacity}h/week (student needs ${studentHours.min}-${studentHours.max}h)`,
      };
    }
    const ratio = (trainerCapacity - studentHours.min) / (studentHours.max - studentHours.min);
    return {
      score: WEIGHTS.AVAILABILITY * (0.7 + 0.3 * ratio),
      description: `Partial: Trainer has ${trainerCapacity}h/week (student needs ${studentHours.min}-${studentHours.max}h)`,
    };
  }
  const ratio = trainerCapacity / studentHours.min;
  return {
    score: WEIGHTS.AVAILABILITY * ratio * 0.5,
    description: `Limited: Trainer has ${trainerCapacity}h/week (student needs ${studentHours.min}-${studentHours.max}h)`,
  };
}

const ROLE_KEYWORDS: Record<string, string[]> = {
  "cloud": ["cloud security", "aws", "azure", "gcp", "cloud", "devsecops"],
  "architecture": ["security engineering", "architecture", "infrastructure"],
  "web": ["web security", "owasp", "penetration testing", "application security"],
};

function calculateSkillsScore(
  student: StudentForMatching,
  trainer: TrainerForMatching
): { score: number; matchedSkills: string[] } {
  const targetRole = (student.target_role || "").toLowerCase();
  const trainerSkills = [...(trainer.expertise || []), ...(trainer.specializations || [])];

  const studentKeywords: string[] = [];
  for (const [key, values] of Object.entries(ROLE_KEYWORDS)) {
    if (targetRole.includes(key)) {
      studentKeywords.push(...values);
    }
  }

  if (studentKeywords.length === 0 || trainerSkills.length === 0) {
    return { score: WEIGHTS.SKILLS * 0.25, matchedSkills: [] };
  }

  const matchedSkills: string[] = [];
  for (const skill of trainerSkills) {
    const normalized = skill.toLowerCase();
    for (const keyword of studentKeywords) {
      if (normalized.includes(keyword) || keyword.includes(normalized)) {
        if (!matchedSkills.includes(skill)) {
          matchedSkills.push(skill);
        }
      }
    }
  }

  if (matchedSkills.length === 0) {
    return { score: WEIGHTS.SKILLS * 0.1, matchedSkills: [] };
  }

  const matchRatio = Math.min(matchedSkills.length / studentKeywords.length, 1);
  return {
    score: WEIGHTS.SKILLS * (0.5 + 0.5 * matchRatio),
    matchedSkills,
  };
}

function calculateCapacityScore(
  trainer: TrainerForMatching,
  currentAssignments: number
): { score: number; available: number; max: number } {
  const maxCapacity = trainer.max_capacity || trainer.max_students || 10;

  if (currentAssignments >= maxCapacity) {
    return { score: 0, available: 0, max: maxCapacity };
  }

  const availableSlots = maxCapacity - currentAssignments;
  const capacityRatio = availableSlots / maxCapacity;

  return {
    score: WEIGHTS.CAPACITY * capacityRatio,
    available: availableSlots,
    max: maxCapacity,
  };
}

function runSimulation(student: StudentForMatching, trainers: TrainerForMatching[]) {
  const results: Array<{
    trainer: string;
    availability: { score: number; description: string };
    skills: { score: number; matchedSkills: string[] };
    capacity: { score: number; available: number; max: number };
    total: number;
  }> = [];

  for (const trainer of trainers) {
    const availability = calculateAvailabilityScore(student, trainer);
    const skills = calculateSkillsScore(student, trainer);
    const capacity = calculateCapacityScore(
      trainer,
      MOCK_ASSIGNMENT_COUNTS[trainer.id] || 0
    );

    const total = Math.round(availability.score + skills.score + capacity.score);

    results.push({
      trainer: trainer.full_name || trainer.id,
      availability,
      skills,
      capacity,
      total,
    });
  }

  // Sort by total score descending
  results.sort((a, b) => b.total - a.total);

  return results;
}

export default function TestMatchingEngine() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [simulationResults, setSimulationResults] = useState<ReturnType<typeof runSimulation> | null>(null);

  const runTest = () => {
    setResults([]);
    setSimulationResults(null);

    // Step 1: Show mock data
    setResults((prev) => [
      ...prev,
      {
        step: "Mock Student",
        data: {
          name: MOCK_STUDENT.full_name,
          target_role: MOCK_STUDENT.target_role,
          weekly_hours: MOCK_STUDENT.weekly_hours,
        },
      },
    ]);

    setResults((prev) => [
      ...prev,
      {
        step: "Mock Trainers",
        data: MOCK_TRAINERS.map((t) => ({
          name: t.full_name,
          expertise: t.expertise,
          availability: t.availability?.[0],
          max_capacity: t.max_capacity,
          current_assignments: MOCK_ASSIGNMENT_COUNTS[t.id] || 0,
        })),
      },
    ]);

    // Step 2: Run simulation
    const simResults = runSimulation(MOCK_STUDENT, MOCK_TRAINERS);
    setSimulationResults(simResults);

    // Step 3: Verify expected outcome
    const winner = simResults[0];
    const expectedWinner = "Trainer C (Cloud + Free)";
    const isCorrect = winner.trainer === expectedWinner;

    setResults((prev) => [
      ...prev,
      {
        step: isCorrect ? "✓ Test PASSED" : "✗ Test FAILED",
        data: {
          expected_winner: expectedWinner,
          actual_winner: winner.trainer,
          winner_score: winner.total,
        },
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Matching Engine Simulation
        </h1>
        <p className="text-muted-foreground mb-6">
          Tests the matching algorithm with mock data to verify scoring logic.
        </p>

        <div className="mb-6 p-4 bg-muted/20 rounded-lg">
          <h2 className="font-semibold text-foreground mb-2">Test Scenario</h2>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Student:</strong> Interested in Cloud Security, needs 5-10 hours/week</li>
            <li>• <strong>Trainer A:</strong> Cloud expertise, but AT CAPACITY (5/5 students)</li>
            <li>• <strong>Trainer B:</strong> Web expertise, FREE (2/10 students)</li>
            <li>• <strong>Trainer C:</strong> Cloud expertise, FREE (1/8 students)</li>
          </ul>
          <p className="mt-2 text-sm text-primary font-medium">
            Expected: Trainer C should win (Cloud match + capacity available)
          </p>
        </div>

        <button
          onClick={runTest}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium mb-6"
        >
          Run Simulation
        </button>

        {results.length > 0 && (
          <div className="space-y-4 mb-6">
            {results.map((result, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg border ${
                  result.step.includes("PASSED")
                    ? "bg-green-500/10 border-green-500/30"
                    : result.step.includes("FAILED")
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-muted/20 border-border"
                }`}
              >
                <div className="font-medium text-foreground mb-2">{result.step}</div>
                {result.data && (
                  <pre className="text-xs overflow-auto bg-black/20 p-2 rounded">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        {simulationResults && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Score Breakdown (Ranked)</h2>

            {simulationResults.map((result, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg border ${
                  i === 0
                    ? "bg-primary/10 border-primary/30 ring-2 ring-primary/20"
                    : "bg-muted/20 border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">#{i + 1}</span>
                    <span className="font-semibold text-foreground">{result.trainer}</span>
                    {i === 0 && (
                      <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-medium">
                        BEST MATCH
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-primary">{result.total}</div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="p-2 bg-black/10 rounded">
                    <div className="text-muted-foreground mb-1">Availability (40%)</div>
                    <div className="text-lg font-semibold text-foreground">
                      {Math.round(result.availability.score)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {result.availability.description}
                    </div>
                  </div>

                  <div className="p-2 bg-black/10 rounded">
                    <div className="text-muted-foreground mb-1">Skills (40%)</div>
                    <div className="text-lg font-semibold text-foreground">
                      {Math.round(result.skills.score)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {result.skills.matchedSkills.length > 0
                        ? `Matched: ${result.skills.matchedSkills.join(", ")}`
                        : "No direct matches"}
                    </div>
                  </div>

                  <div className="p-2 bg-black/10 rounded">
                    <div className="text-muted-foreground mb-1">Capacity (20%)</div>
                    <div className="text-lg font-semibold text-foreground">
                      {Math.round(result.capacity.score)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {result.capacity.available}/{result.capacity.max} slots free
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

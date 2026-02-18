/**
 * Student-Trainer Matching Engine
 *
 * Calculates compatibility scores between students and trainers based on:
 * - Availability matching (40%)
 * - Skills/specialization matching (40%)
 * - Trainer capacity (20%)
 */

import { supabase } from "@/lib/supabase";
import { parseAvailability, type DayTimeSlot } from "@/data/locationData";

// ============================================================
// Types
// ============================================================

export interface StudentForMatching {
  id: string;
  full_name?: string | null;
  target_role?: string | null;      // e.g., "Defensive: Incident Response / SOC Analyst"
  weekly_hours?: string | null;     // e.g., "Focused: 2–5 hours" or "Dedicated: 5–10 hours"
  journey_level?: string | null;    // e.g., "Absolute Beginner", "IT Professional"
  roadblock?: string | null;
  certifications?: string | null;
}

export interface TrainerForMatching {
  id: string;
  full_name?: string | null;
  expertise?: string[] | null;          // e.g., ["SOC / Incident Response", "Penetration Testing"]
  specializations?: string[] | null;    // Additional specializations
  availability?: string[] | null;       // e.g., ["10 hours/week", "Monday 09:00–17:00"]
  max_capacity?: number | null;
  max_students?: number | null;
  is_active?: boolean | null;
}

export interface MatchScore {
  trainerId: string;
  trainerName: string;
  totalScore: number;           // 0-100
  availabilityScore: number;    // 0-40
  skillsScore: number;          // 0-40
  capacityScore: number;        // 0-20
  breakdown: {
    availabilityMatch: string;
    skillsMatch: string[];
    currentAssignments: number;
    maxCapacity: number;
  };
}

// ============================================================
// Score Weights
// ============================================================

const WEIGHTS = {
  AVAILABILITY: 40,
  SKILLS: 40,
  CAPACITY: 20,
} as const;

// ============================================================
// Availability Matching (40%)
// ============================================================

/**
 * Maps student's weekly hours preference to numeric range
 */
function parseStudentHours(weeklyHours: string | null | undefined): { min: number; max: number } {
  if (!weeklyHours) return { min: 0, max: 0 };

  const lower = weeklyHours.toLowerCase();

  // Parse various formats from the survey
  if (lower.includes("2–5") || lower.includes("2-5") || lower.includes("focused")) {
    return { min: 2, max: 5 };
  }
  if (lower.includes("5–10") || lower.includes("5-10") || lower.includes("dedicated")) {
    return { min: 5, max: 10 };
  }
  if (lower.includes("10+") || lower.includes("accelerated")) {
    return { min: 10, max: 40 };
  }

  // Try to extract numbers directly
  const numbers = weeklyHours.match(/(\d+)/g);
  if (numbers && numbers.length >= 2) {
    return { min: parseInt(numbers[0]), max: parseInt(numbers[1]) };
  }
  if (numbers && numbers.length === 1) {
    const num = parseInt(numbers[0]);
    return { min: num, max: num + 5 };
  }

  return { min: 0, max: 0 };
}

/**
 * Parses trainer's weekly capacity from availability array
 */
function parseTrainerCapacity(availability: string[] | null | undefined): number {
  if (!availability || availability.length === 0) return 0;

  const { weeklyCapacity } = parseAvailability(availability);

  if (!weeklyCapacity) return 0;

  // Handle "40+" format
  if (weeklyCapacity.includes("+")) {
    return parseInt(weeklyCapacity.replace("+", "")) || 40;
  }

  return parseInt(weeklyCapacity) || 0;
}

/**
 * Calculates availability overlap between student needs and trainer availability
 * Returns a score from 0 to WEIGHTS.AVAILABILITY (40)
 */
function calculateAvailabilityScore(
  student: StudentForMatching,
  trainer: TrainerForMatching
): { score: number; matchDescription: string } {
  const studentHours = parseStudentHours(student.weekly_hours);
  const trainerCapacity = parseTrainerCapacity(trainer.availability);

  // If we can't determine either, give partial credit
  if (studentHours.max === 0 && trainerCapacity === 0) {
    return { score: WEIGHTS.AVAILABILITY * 0.5, matchDescription: "Unknown availability" };
  }

  if (studentHours.max === 0) {
    return { score: WEIGHTS.AVAILABILITY * 0.6, matchDescription: "Student availability unknown" };
  }

  if (trainerCapacity === 0) {
    return { score: WEIGHTS.AVAILABILITY * 0.4, matchDescription: "Trainer availability unknown" };
  }

  // Check if trainer can accommodate student's minimum needs
  if (trainerCapacity >= studentHours.min) {
    // Full match or better
    if (trainerCapacity >= studentHours.max) {
      return {
        score: WEIGHTS.AVAILABILITY,
        matchDescription: `Trainer has ${trainerCapacity}h/week (student needs ${studentHours.min}-${studentHours.max}h)`,
      };
    }
    // Partial match - trainer can cover minimum but not maximum
    const ratio = (trainerCapacity - studentHours.min) / (studentHours.max - studentHours.min);
    const score = WEIGHTS.AVAILABILITY * (0.7 + 0.3 * ratio);
    return {
      score,
      matchDescription: `Trainer has ${trainerCapacity}h/week (student needs ${studentHours.min}-${studentHours.max}h)`,
    };
  }

  // Trainer can't meet minimum - score based on how close they are
  const ratio = trainerCapacity / studentHours.min;
  const score = WEIGHTS.AVAILABILITY * ratio * 0.5;
  return {
    score,
    matchDescription: `Limited: Trainer has ${trainerCapacity}h/week (student needs ${studentHours.min}-${studentHours.max}h)`,
  };
}

// ============================================================
// Skills Matching (40%)
// ============================================================

/**
 * Role keyword mappings for matching student interests to trainer expertise
 */
const ROLE_TO_EXPERTISE_KEYWORDS: Record<string, string[]> = {
  // Defensive roles
  "defensive": ["soc", "incident response", "threat hunting", "defensive", "blue team", "monitoring"],
  "soc": ["soc", "incident response", "security operations", "monitoring", "siem"],
  "incident response": ["incident response", "soc", "forensics", "dfir"],
  "threat hunting": ["threat hunting", "soc", "threat intelligence", "detection"],

  // Offensive roles
  "offensive": ["penetration testing", "ethical hacking", "red team", "offensive", "pentest"],
  "penetration testing": ["penetration testing", "ethical hacking", "pentest", "red team", "web security"],
  "ethical hacking": ["penetration testing", "ethical hacking", "offensive", "red team"],

  // Architecture roles
  "architecture": ["cloud security", "security engineering", "architecture", "infrastructure"],
  "cloud security": ["cloud security", "aws", "azure", "gcp", "cloud", "devsecops"],
  "security engineering": ["security engineering", "architecture", "infrastructure", "networking"],

  // Governance roles
  "governance": ["grc", "governance", "compliance", "auditing", "risk", "policy"],
  "grc": ["grc", "governance", "risk", "compliance", "audit"],
  "auditing": ["auditing", "grc", "compliance", "assessment"],

  // General skills
  "networking": ["networking", "network security", "infrastructure", "firewall"],
  "web security": ["web security", "application security", "owasp", "penetration testing"],
};

/**
 * Extracts keywords from student's target role
 */
function extractRoleKeywords(targetRole: string | null | undefined): string[] {
  if (!targetRole) return [];

  const lower = targetRole.toLowerCase();
  const keywords: Set<string> = new Set();

  // Check for direct role matches
  for (const [key, values] of Object.entries(ROLE_TO_EXPERTISE_KEYWORDS)) {
    if (lower.includes(key)) {
      values.forEach((v) => keywords.add(v));
    }
  }

  // Also extract individual words from the role
  const words = lower
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  words.forEach((w) => keywords.add(w));

  return Array.from(keywords);
}

/**
 * Normalizes an expertise string for comparison
 */
function normalizeExpertise(expertise: string): string {
  return expertise
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculates skills match between student interests and trainer expertise
 * Returns a score from 0 to WEIGHTS.SKILLS (40)
 */
function calculateSkillsScore(
  student: StudentForMatching,
  trainer: TrainerForMatching
): { score: number; matchedSkills: string[] } {
  const studentKeywords = extractRoleKeywords(student.target_role);
  const trainerExpertise = [
    ...(trainer.expertise || []),
    ...(trainer.specializations || []),
  ];

  if (studentKeywords.length === 0) {
    // No student preferences - give partial credit if trainer has any expertise
    if (trainerExpertise.length > 0) {
      return { score: WEIGHTS.SKILLS * 0.5, matchedSkills: [] };
    }
    return { score: 0, matchedSkills: [] };
  }

  if (trainerExpertise.length === 0) {
    // Trainer has no listed expertise
    return { score: WEIGHTS.SKILLS * 0.25, matchedSkills: [] };
  }

  // Normalize trainer expertise for comparison
  const normalizedExpertise = trainerExpertise.map(normalizeExpertise);

  // Find matches
  const matchedSkills: string[] = [];

  for (const keyword of studentKeywords) {
    for (let i = 0; i < normalizedExpertise.length; i++) {
      if (normalizedExpertise[i].includes(keyword) || keyword.includes(normalizedExpertise[i])) {
        if (!matchedSkills.includes(trainerExpertise[i])) {
          matchedSkills.push(trainerExpertise[i]);
        }
      }
    }
  }

  // Calculate score based on match ratio
  if (matchedSkills.length === 0) {
    // No direct matches - minimal score
    return { score: WEIGHTS.SKILLS * 0.1, matchedSkills: [] };
  }

  // At least one match - scale score based on number of matches
  const matchRatio = Math.min(matchedSkills.length / Math.max(studentKeywords.length, 1), 1);
  const score = WEIGHTS.SKILLS * (0.5 + 0.5 * matchRatio);

  return { score, matchedSkills };
}

// ============================================================
// Capacity Scoring (20%)
// ============================================================

/**
 * Fetches the count of active assignments for a trainer
 */
async function getActiveAssignmentCount(trainerId: string): Promise<number> {
  const { count, error } = await supabase
    .from("assignments")
    .select("*", { count: "exact", head: true })
    .eq("trainer_id", trainerId)
    .eq("status", "active");

  if (error) {
    console.warn(`Failed to fetch assignment count for trainer ${trainerId}:`, error);
    return 0;
  }

  return count || 0;
}

/**
 * Calculates capacity score based on how much room the trainer has
 * Returns a score from 0 to WEIGHTS.CAPACITY (20)
 */
async function calculateCapacityScore(
  trainer: TrainerForMatching
): Promise<{ score: number; currentAssignments: number; maxCapacity: number }> {
  const maxCapacity = trainer.max_capacity || trainer.max_students || 10;
  const currentAssignments = await getActiveAssignmentCount(trainer.id);

  // If at or over capacity, very low score
  if (currentAssignments >= maxCapacity) {
    return { score: 0, currentAssignments, maxCapacity };
  }

  // Score based on available capacity
  const availableSlots = maxCapacity - currentAssignments;
  const capacityRatio = availableSlots / maxCapacity;

  // Trainers with more available slots get higher scores
  const score = WEIGHTS.CAPACITY * capacityRatio;

  return { score, currentAssignments, maxCapacity };
}

// ============================================================
// Main Functions
// ============================================================

/**
 * Calculates a match score (0-100) between a student and trainer
 *
 * @param student - Student data for matching
 * @param trainer - Trainer data for matching
 * @returns MatchScore object with total and component scores
 */
export async function calculateMatchScore(
  student: StudentForMatching,
  trainer: TrainerForMatching
): Promise<MatchScore> {
  // Skip inactive trainers
  if (trainer.is_active === false) {
    return {
      trainerId: trainer.id,
      trainerName: trainer.full_name || "Unknown",
      totalScore: 0,
      availabilityScore: 0,
      skillsScore: 0,
      capacityScore: 0,
      breakdown: {
        availabilityMatch: "Trainer is inactive",
        skillsMatch: [],
        currentAssignments: 0,
        maxCapacity: 0,
      },
    };
  }

  // Calculate each component
  const { score: availabilityScore, matchDescription } = calculateAvailabilityScore(student, trainer);
  const { score: skillsScore, matchedSkills } = calculateSkillsScore(student, trainer);
  const { score: capacityScore, currentAssignments, maxCapacity } = await calculateCapacityScore(trainer);

  const totalScore = Math.round(availabilityScore + skillsScore + capacityScore);

  return {
    trainerId: trainer.id,
    trainerName: trainer.full_name || "Unknown",
    totalScore: Math.min(totalScore, 100),
    availabilityScore: Math.round(availabilityScore),
    skillsScore: Math.round(skillsScore),
    capacityScore: Math.round(capacityScore),
    breakdown: {
      availabilityMatch: matchDescription,
      skillsMatch: matchedSkills,
      currentAssignments,
      maxCapacity,
    },
  };
}

/**
 * Returns the top N best matching trainers for a student, ranked by score
 *
 * @param student - Student data for matching
 * @param allTrainers - Array of all available trainers
 * @param topN - Number of top matches to return (default: 3)
 * @returns Array of MatchScore objects, sorted by totalScore descending
 */
export async function getBestMatches(
  student: StudentForMatching,
  allTrainers: TrainerForMatching[],
  topN: number = 3
): Promise<MatchScore[]> {
  // Filter to only active trainers
  const activeTrainers = allTrainers.filter((t) => t.is_active !== false);

  // Calculate scores for all trainers in parallel
  const scorePromises = activeTrainers.map((trainer) =>
    calculateMatchScore(student, trainer)
  );

  const scores = await Promise.all(scorePromises);

  // Sort by total score descending
  scores.sort((a, b) => b.totalScore - a.totalScore);

  // Return top N
  return scores.slice(0, topN);
}

/**
 * Fetches all active trainers from the database
 * Convenience function for getting trainers to match against
 */
export async function fetchActiveTrainers(): Promise<TrainerForMatching[]> {
  const { data, error } = await supabase
    .from("trainer_profiles")
    .select(`
      id,
      full_name,
      expertise,
      specializations,
      availability,
      max_capacity,
      max_students,
      is_active
    `)
    .eq("is_active", true);

  if (error) {
    console.error("Failed to fetch trainers:", error);
    return [];
  }

  return data || [];
}

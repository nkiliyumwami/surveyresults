/**
 * Student Sync Utility
 *
 * Syncs survey respondents from Google Sheets API to the students table.
 * Also provides mock data generation for testing.
 */

import { supabase } from "@/lib/supabase";
import { normalizeCountry } from "@/data/surveyData";

// Google Sheets API URL (same as used in LandingPage)
const SURVEY_API_URL =
  "https://script.google.com/macros/s/AKfycbyBIkLx7lvdgtzasUZChLlo--wf0fb8FYaUH9fwvz5A6aAy7NhT1dmEvACpMAkk6nmDNw/exec";

// ============================================================
// Types
// ============================================================

export interface SurveyResponse {
  timestamp: string;
  name?: string; // Optional name field from survey
  journey: string;
  role: string;
  roadblock: string;
  time: string;
  country: string;
  certs: string;
  suggestion?: string;
}

export interface StudentInsert {
  email: string;
  full_name: string | null;
  country: string;
  journey_level: string;
  target_role: string;
  roadblock: string;
  weekly_hours: string;
  certifications: string;
  survey_timestamp: string;
}

export interface SyncResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  details: string[];
}

// ============================================================
// Sync Functions
// ============================================================

/**
 * Fetches survey responses from Google Sheets API
 */
export async function fetchSurveyResponses(): Promise<SurveyResponse[]> {
  const response = await fetch(SURVEY_API_URL);
  const data = await response.json();

  if (!data.ok || !data.responses) {
    throw new Error("Failed to fetch survey data");
  }

  return data.responses as SurveyResponse[];
}

/**
 * Generates a unique email identifier from timestamp
 * Since survey doesn't collect emails, we create a pseudo-email
 */
function generateEmailFromTimestamp(timestamp: string): string {
  // Clean timestamp to create a unique identifier
  const cleaned = timestamp
    .replace(/[\/\s:]/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase();
  return `student-${cleaned}@survey.local`;
}

/**
 * Checks if a string looks like a timestamp/date
 */
function looksLikeTimestamp(str: string): boolean {
  if (!str) return false;
  // Check for common date patterns
  const datePatterns = [
    /^\d{1,2}\/\d{1,2}\/\d{2,4}/, // 2/10/2026
    /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s/i, // Sun Feb 08
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s/i, // Feb 08
    /^\d{4}-\d{2}-\d{2}/, // 2026-02-08
    /^Student\s+(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s/i, // Student Sun Feb
    /^Student\s+\d{1,2}[-\/]/i, // Student 2/10 or Student 2-10
  ];
  return datePatterns.some(pattern => pattern.test(str.trim()));
}

/**
 * Generates a display name from survey data
 * Priority: 1) Real name from survey, 2) null (let UI handle fallback)
 */
function generateDisplayName(response: SurveyResponse): string | null {
  // Check if survey has a name field with a real name
  if (response.name && response.name.trim()) {
    const name = response.name.trim();
    // Make sure it's not a timestamp
    if (!looksLikeTimestamp(name)) {
      return name;
    }
  }

  // Don't generate fake names - return null and let UI show email
  return null;
}

/**
 * Converts a survey response to a student insert object
 */
function surveyToStudent(response: SurveyResponse): StudentInsert {
  return {
    email: generateEmailFromTimestamp(response.timestamp),
    full_name: generateDisplayName(response),
    country: normalizeCountry(response.country),
    journey_level: response.journey || "",
    target_role: response.role || "",
    roadblock: response.roadblock || "",
    weekly_hours: response.time || "",
    certifications: response.certs || "",
    survey_timestamp: response.timestamp,
  };
}

/**
 * Deduplicates students by email, keeping the last occurrence (most recent)
 */
function deduplicateByEmail(students: StudentInsert[]): StudentInsert[] {
  const emailMap = new Map<string, StudentInsert>();

  // Iterate through all students - later entries overwrite earlier ones
  for (const student of students) {
    emailMap.set(student.email, student);
  }

  return Array.from(emailMap.values());
}

/**
 * Syncs all survey respondents to the students table
 * Uses upsert to handle duplicates (updates existing records based on email)
 */
export async function syncSurveyToStudents(): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    imported: 0,
    skipped: 0,
    errors: [],
    details: [],
  };

  try {
    // 1. Fetch survey responses
    result.details.push("Fetching survey responses...");
    const responses = await fetchSurveyResponses();
    result.details.push(`Found ${responses.length} survey responses`);

    // 2. Convert all responses to student records
    const allStudents: StudentInsert[] = responses.map((response) =>
      surveyToStudent(response)
    );

    // 3. Deduplicate by email (keep last occurrence = most recent)
    const uniqueStudents = deduplicateByEmail(allStudents);
    const duplicatesFiltered = allStudents.length - uniqueStudents.length;

    console.log(`Filtered ${allStudents.length} rows down to ${uniqueStudents.length} unique students`);
    result.details.push(`Filtered ${allStudents.length} rows down to ${uniqueStudents.length} unique students (${duplicatesFiltered} duplicates removed)`);

    // 4. Upsert unique students (insert or update on email conflict)
    if (uniqueStudents.length > 0) {
      const { data, error } = await supabase
        .from("students")
        .upsert(uniqueStudents, { onConflict: "email" })
        .select("id");

      if (error) {
        result.errors.push(`Upsert error: ${error.message}`);
      } else {
        result.imported = data?.length || 0;
        result.details.push(`Successfully synced ${result.imported} students`);
      }
    }

    result.success = result.errors.length === 0;

  } catch (error) {
    result.errors.push(`Sync error: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

// ============================================================
// Mock Data Functions
// ============================================================

const MOCK_STUDENTS: StudentInsert[] = [
  {
    email: "alice.cloud@test.local",
    full_name: "Alice Chen",
    country: "United States",
    journey_level: "IT Professional: I work in IT (Helpdesk, SysAdmin) and want to pivot to Security.",
    target_role: "Architecture: Cloud Security / Security Engineering",
    roadblock: "Technical Skills: I struggle with hands-on tools",
    weekly_hours: "Dedicated: 5–10 hours",
    certifications: "AWS Solutions Architect, Security+",
    survey_timestamp: "2/10/2026 09:00:00",
  },
  {
    email: "bob.network@test.local",
    full_name: "Bob Martinez",
    country: "Canada",
    journey_level: "Knowledgeable: I have some certifications or am currently studying (e.g., Security+, ISC2 CC).",
    target_role: "Defensive: Incident Response / SOC Analyst / Threat Hunting",
    roadblock: "Networking: I lack professional connections or mentorship",
    weekly_hours: "Accelerated: 10+ hours",
    certifications: "Network+, CCNA, Security+",
    survey_timestamp: "2/10/2026 10:00:00",
  },
  {
    email: "carol.compliance@test.local",
    full_name: "Carol Williams",
    country: "United Kingdom",
    journey_level: "Security Professional: I already work in Security but want to level up my advanced skills.",
    target_role: "Governance: GRC (Governance, Risk, and Compliance) / Auditing",
    roadblock: "Career Guidance: I don't know how to navigate the job market or interviews",
    weekly_hours: "Focused: 2–5 hours",
    certifications: "CISA, CISSP",
    survey_timestamp: "2/10/2026 11:00:00",
  },
  {
    email: "david.pentest@test.local",
    full_name: "David Okonkwo",
    country: "Rwanda",
    journey_level: "Absolute Beginner: I am just starting and have no IT/Security background.",
    target_role: "Offensive: Ethical Hacking / Penetration Testing",
    roadblock: "Technical Skills: I struggle with hands-on tools",
    weekly_hours: "Accelerated: 10+ hours",
    certifications: "CEH (studying)",
    survey_timestamp: "2/10/2026 12:00:00",
  },
  {
    email: "emma.soc@test.local",
    full_name: "Emma Nakamura",
    country: "Japan",
    journey_level: "IT Professional: I work in IT (Helpdesk, SysAdmin) and want to pivot to Security.",
    target_role: "Defensive: Incident Response / SOC Analyst / Threat Hunting",
    roadblock: "Theory Overload: I have certifications but struggle applying them",
    weekly_hours: "Dedicated: 5–10 hours",
    certifications: "Security+, CySA+, Splunk Certified",
    survey_timestamp: "2/10/2026 13:00:00",
  },
];

/**
 * Inserts mock students for testing (uses upsert to handle duplicates)
 */
export async function insertMockStudents(): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    imported: 0,
    skipped: 0,
    errors: [],
    details: [],
  };

  try {
    result.details.push(`Upserting ${MOCK_STUDENTS.length} mock students...`);

    const { data, error } = await supabase
      .from("students")
      .upsert(MOCK_STUDENTS, { onConflict: "email" })
      .select("id");

    if (error) {
      result.errors.push(`Upsert error: ${error.message}`);
    } else {
      result.imported = data?.length || 0;
      result.details.push(`Successfully synced ${result.imported} mock students`);
    }

    result.success = result.errors.length === 0;

  } catch (error) {
    result.errors.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

/**
 * Clears all students (for testing/reset)
 */
export async function clearAllStudents(): Promise<{ success: boolean; deleted: number; error?: string }> {
  try {
    // First delete all assignments (FK constraint)
    await supabase.from("assignments").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Then delete all students
    const { data, error } = await supabase
      .from("students")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select("id");

    if (error) {
      return { success: false, deleted: 0, error: error.message };
    }

    return { success: true, deleted: data?.length || 0 };
  } catch (error) {
    return { success: false, deleted: 0, error: error instanceof Error ? error.message : String(error) };
  }
}

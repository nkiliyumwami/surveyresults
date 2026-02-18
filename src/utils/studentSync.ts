/**
 * Student Sync Utility
 *
 * Syncs survey respondents from Google Sheets API to the students table.
 *
 * Column Mapping (slug headers):
 * - timestamp: Record timestamp
 * - email: PRIMARY IDENTIFIER
 * - journey: Where they are in their journey
 * - role: Their dream role
 * - roadblock: Their biggest roadblock
 * - commitment: Time commitment per week
 * - location: Country
 * - certs: Interested certifications
 * - notes: Special requests/suggestions
 */

import { supabase } from "@/lib/supabase";
import { normalizeCountry } from "@/data/surveyData";

// Google Sheets API URL
const SURVEY_API_URL =
  "https://script.google.com/macros/s/AKfycbyBIkLx7lvdgtzasUZChLlo--wf0fb8FYaUH9fwvz5A6aAy7NhT1dmEvACpMAkk6nmDNw/exec";

// ============================================================
// Types
// ============================================================

export interface SurveyResponse {
  timestamp: string;    // Record timestamp
  email: string;        // PRIMARY IDENTIFIER
  journey: string;      // Where they are in their journey
  role: string;         // Their dream role
  roadblock: string;    // Their biggest roadblock
  commitment: string;   // Time commitment per week
  location: string;     // Country
  certs: string;        // Interested certifications
  notes?: string;       // Special requests/suggestions (optional)
}

export interface StudentInsert {
  email: string;
  full_name: string;
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
// Validation Functions
// ============================================================

/**
 * Checks if a string looks like a valid email address
 */
function isValidEmail(str: string | undefined | null): boolean {
  if (!str || typeof str !== "string") return false;
  const trimmed = str.trim();
  // Basic email pattern: something@something.something
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(trimmed);
}

/**
 * Extracts the name part from an email (before the @)
 * Cleans it up for display
 */
function getNameFromEmail(email: string): string {
  const prefix = email.split("@")[0];
  // Replace dots, underscores, hyphens with spaces and capitalize
  return prefix
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
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
 * Converts a survey response to a student insert object
 * Returns null if the row should be skipped (no valid email)
 */
function surveyToStudent(response: SurveyResponse): StudentInsert | null {
  // SKIP rows without valid email - this is our primary identifier
  if (!isValidEmail(response.email)) {
    return null;
  }

  const email = response.email.trim().toLowerCase();

  return {
    email: email,
    // Use email-derived name since there's no Name column
    full_name: getNameFromEmail(email),
    country: normalizeCountry(response.location) || "",
    journey_level: response.journey || "",
    target_role: response.role || "",
    roadblock: response.roadblock || "",
    weekly_hours: response.commitment || "",
    certifications: response.certs || "",
    survey_timestamp: response.timestamp || "",
  };
}

/**
 * Deduplicates students by email, keeping the last occurrence (most recent)
 */
function deduplicateByEmail(students: StudentInsert[]): StudentInsert[] {
  const emailMap = new Map<string, StudentInsert>();

  for (const student of students) {
    emailMap.set(student.email.toLowerCase(), student);
  }

  return Array.from(emailMap.values());
}

/**
 * Syncs all survey respondents to the students table
 * Only imports rows with valid email addresses
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

    // 2. Convert responses to student records, skipping invalid rows
    const validStudents: StudentInsert[] = [];
    let skippedNoEmail = 0;

    for (const response of responses) {
      const student = surveyToStudent(response);
      if (student) {
        validStudents.push(student);
      } else {
        skippedNoEmail++;
      }
    }

    result.details.push(`${skippedNoEmail} rows skipped (no valid email)`);
    result.skipped = skippedNoEmail;

    // 3. Deduplicate by email (keep last occurrence = most recent)
    const uniqueStudents = deduplicateByEmail(validStudents);
    const duplicatesFiltered = validStudents.length - uniqueStudents.length;

    if (duplicatesFiltered > 0) {
      result.details.push(`${duplicatesFiltered} duplicate emails merged`);
    }

    console.log(`Syncing ${uniqueStudents.length} unique students (skipped ${skippedNoEmail} without email, merged ${duplicatesFiltered} duplicates)`);
    result.details.push(`Ready to sync ${uniqueStudents.length} unique students`);

    // 4. Upsert unique students
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
    } else {
      result.details.push("No valid students to sync");
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
    email: "alice.chen@example.com",
    full_name: "Alice Chen",
    country: "United States",
    journey_level: "IT Professional: I work in IT (Helpdesk, SysAdmin) and want to pivot to Security.",
    target_role: "Architecture: Cloud Security / Security Engineering",
    roadblock: "Technical Skills: I struggle with hands-on tools",
    weekly_hours: "Dedicated: 5-10 hours",
    certifications: "AWS Solutions Architect, Security+",
    survey_timestamp: "2/10/2026 09:00:00",
  },
  {
    email: "bob.martinez@example.com",
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
    email: "carol.williams@example.com",
    full_name: "Carol Williams",
    country: "United Kingdom",
    journey_level: "Security Professional: I already work in Security but want to level up my advanced skills.",
    target_role: "Governance: GRC (Governance, Risk, and Compliance) / Auditing",
    roadblock: "Career Guidance: I don't know how to navigate the job market or interviews",
    weekly_hours: "Focused: 2-5 hours",
    certifications: "CISA, CISSP",
    survey_timestamp: "2/10/2026 11:00:00",
  },
  {
    email: "david.okonkwo@example.com",
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
    email: "emma.nakamura@example.com",
    full_name: "Emma Nakamura",
    country: "Japan",
    journey_level: "IT Professional: I work in IT (Helpdesk, SysAdmin) and want to pivot to Security.",
    target_role: "Defensive: Incident Response / SOC Analyst / Threat Hunting",
    roadblock: "Theory Overload: I have certifications but struggle applying them",
    weekly_hours: "Dedicated: 5-10 hours",
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

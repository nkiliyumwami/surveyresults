// Survey response data (emails anonymized)
export interface SurveyResponse {
  timestamp: string;
  journey: string;
  role: string;
  roadblock: string;
  time: string;
  country: string;
  certs: string;
  suggestion: string;
}

export const surveyResponses: SurveyResponse[] = [
  { timestamp: "2/5/2026 12:41:54", journey: "Knowledgeable: I have some certifications or am currently studying (e.g., Security+, ISC2 CC).", role: "Governance: GRC (Governance, Risk, and Compliance) / Auditing", roadblock: "Networking: I lack professional connections or mentorship", time: "Dedicated: 5–10 hours", country: "USA", certs: "Not Sure Yet", suggestion: "" },
  { timestamp: "2/6/2026 16:44:27", journey: "Absolute Beginner: I am just starting and have no IT/Security background.", role: "Architecture: Cloud Security / Security Engineering", roadblock: "Technical Skills: I struggle with hands-on tools", time: "Focused: 2–5 hours", country: "Rwanda", certs: "ISC2 CC, CEH, RHCE", suggestion: "" },
  { timestamp: "2/6/2026 16:48:17", journey: "Knowledgeable: I have some certifications or am currently studying (e.g., Security+, ISC2 CC).", role: "Defensive: Incident Response / SOC Analyst / Threat Hunting", roadblock: "Technical Skills: I struggle with hands-on tools", time: "Focused: 2–5 hours", country: "Rwanda", certs: "ISC2 CC, Security+, CISSP, CEH, RedHat Certified System Admin", suggestion: "" },
  { timestamp: "2/6/2026 16:52:40", journey: "Absolute Beginner: I am just starting and have no IT/Security background.", role: "Defensive: Incident Response / SOC Analyst / Threat Hunting", roadblock: "Networking: I lack professional connections or mentorship", time: "Focused: 2–5 hours", country: "Rwanda", certs: "ISC2 CC, Not sure yet", suggestion: "" },
  { timestamp: "2/6/2026 16:52:52", journey: "IT Professional: I work in IT (Helpdesk, SysAdmin) and want to pivot to Security.", role: "Defensive: Incident Response / SOC Analyst / Threat Hunting", roadblock: "Theory Overload: I have certifications but struggle applying them", time: "Accelerated: 10+ hours", country: "Reanda", certs: "ISC2 CC, CISSP, CEH, Cloud Security Certifications, RedHat Certified System Admin, RedHat Certified System Engineer", suggestion: "" },
  { timestamp: "2/6/2026 16:54:45", journey: "IT Professional: I work in IT (Helpdesk, SysAdmin) and want to pivot to Security.", role: "Offensive: Ethical Hacking / Penetration Testing", roadblock: "Career Guidance: I don't know how to navigate the job market or interviews", time: "Dedicated: 5–10 hours", country: "Rwanda", certs: "ISC2 CC, Security+, CISSP, CEH, Cloud Security Certifications, RHCSA, RHCE, RedHat Certified System Admin, RedHat Certified System Engineer, Not sure yet", suggestion: "" },
  { timestamp: "2/6/2026 16:55:28", journey: "IT Professional: I work in IT (Helpdesk, SysAdmin) and want to pivot to Security.", role: "Offensive: Ethical Hacking / Penetration Testing", roadblock: "Networking: I lack professional connections or mentorship", time: "Accelerated: 10+ hours", country: "Rwanda", certs: "CEH, Cloud Security Certifications, RHCSA", suggestion: "My suggestion would be to ask you for the opportunity to get more advanced certifications and hands on labs in penetration testing and also get some basics in cloud security if possible" },
  { timestamp: "2/6/2026 16:55:54", journey: "IT Professional: I work in IT (Helpdesk, SysAdmin) and want to pivot to Security.", role: "Defensive: Incident Response / SOC Analyst / Threat Hunting", roadblock: "Career Guidance: I don't know how to navigate the job market or interviews", time: "Accelerated: 10+ hours", country: "Rwanda", certs: "ISC2 CC, Security+, CEH, Cloud Security Certifications", suggestion: "Great job to Petero! Many thanks for this mentorship program" },
  { timestamp: "2/6/2026 16:58:13", journey: "Knowledgeable: I have some certifications or am currently studying (e.g., Security+, ISC2 CC).", role: "Defensive: Incident Response / SOC Analyst / Threat Hunting", roadblock: "Technical Skills: I struggle with hands-on tools", time: "Dedicated: 5–10 hours", country: "Rwanda", certs: "Security+, CISSP, Cloud Security Certifications", suggestion: "" },
  { timestamp: "2/6/2026 16:59:23", journey: "Absolute Beginner: I am just starting and have no IT/Security background.", role: "Offensive: Ethical Hacking / Penetration Testing", roadblock: "Technical Skills: I struggle with hands-on tools", time: "Focused: 2–5 hours", country: "Rwanda", certs: "CEH", suggestion: "" },
  { timestamp: "2/6/2026 17:05:11", journey: "Absolute Beginner: I am just starting and have no IT/Security background.", role: "Governance: GRC (Governance, Risk, and Compliance) / Auditing", roadblock: "Career Guidance: I don't know how to navigate the job market or interviews", time: "Focused: 2–5 hours", country: "USA", certs: "Not sure yet", suggestion: "" },
  { timestamp: "2/6/2026 17:06:41", journey: "IT Professional: I work in IT (Helpdesk, SysAdmin) and want to pivot to Security.", role: "Architecture: Cloud Security / Security Engineering", roadblock: "Technical Skills: I struggle with hands-on tools", time: "Dedicated: 5–10 hours", country: "Canada", certs: "Not sure yet", suggestion: "I would prefer hands on project/work from zero to mastery... Thank you in advance" },
  { timestamp: "2/6/2026 17:07:33", journey: "Knowledgeable: I have some certifications or am currently studying (e.g., Security+, ISC2 CC).", role: "Defensive: Incident Response / SOC Analyst / Threat Hunting", roadblock: "Technical Skills: I struggle with hands-on tools", time: "Accelerated: 10+ hours", country: "Rwanda", certs: "ISC2 CC, Security+, Cloud Security Certifications", suggestion: "As a request I would like guidance in building practical cybersecurity skills, learning security tools , preparing for certifications and developing a strong career path in the field .  Thank you" },
  { timestamp: "2/6/2026 17:08:17", journey: "IT Professional: I work in IT (Helpdesk, SysAdmin) and want to pivot to Security.", role: "Defensive: Incident Response / SOC Analyst / Threat Hunting", roadblock: "Networking: I lack professional connections or mentorship", time: "Accelerated: 10+ hours", country: "Rwanda", certs: "Security+, CISSP, RHCE, RedHat Certified System Admin, RedHat Certified System Engineer", suggestion: "" },
  { timestamp: "2/6/2026 17:14:05", journey: "IT Professional: I work in IT (Helpdesk, SysAdmin) and want to pivot to Security.", role: "Architecture: Cloud Security / Security Engineering", roadblock: "Networking: I lack professional connections or mentorship", time: "Dedicated: 5–10 hours", country: "Rwanda", certs: "ISC2 CC, CISSP, Cloud Security Certifications, RHCSA, RHCE, RedHat Certified System Admin, RedHat Certified System Engineer", suggestion: "I come from a background in developing web-based applications, and I believe that considering the importance of cybersecurity today, it would be wise to start focusing on creating security solutions. This way, I can keep my developer portfolio aligned with the capability to provide and maintain secure systems.   I am seeking your mentorship to help align this focus.   I am also in the final stages of completing my Google IT Support Professional certification." },
  { timestamp: "2/6/2026 17:18:15", journey: "Knowledgeable: I have some certifications or am currently studying (e.g., Security+, ISC2 CC).", role: "Architecture: Cloud Security / Security Engineering", roadblock: "Technical Skills: I struggle with hands-on tools", time: "Dedicated: 5–10 hours", country: "Rwanda", certs: "ISC2 CC, Security+, Cloud Security Certifications, RedHat Certified System Admin, RedHat Certified System Engineer", suggestion: "Thank you" },
  { timestamp: "2/6/2026 17:18:27", journey: "Absolute Beginner: I am just starting and have no IT/Security background.", role: "Defensive: Incident Response / SOC Analyst / Threat Hunting", roadblock: "Technical Skills: I struggle with hands-on tools", time: "Dedicated: 5–10 hours", country: "USA", certs: "ISC2 CC, Security+, CISSP, CEH, Cloud Security Certifications, RHCSA, RHCE, RedHat Certified System Admin, RedHat Certified System Engineer", suggestion: "" },
  { timestamp: "2/6/2026 17:26:56", journey: "Absolute Beginner: I am just starting and have no IT/Security background.", role: "Architecture: Cloud Security / Security Engineering", roadblock: "Technical Skills: I struggle with hands-on tools", time: "Accelerated: 10+ hours", country: "Canada", certs: "ISC2 CC, Security+, CISSP, CEH, Cloud Security Certifications, RHCSA, RHCE, RedHat Certified System Admin, RedHat Certified System Engineer", suggestion: "I have a bachelor in bit business information technology but since 2017 got the degree I have never worked in any IT career , I would like to switch to any IT career" },
  { timestamp: "2/6/2026 17:47:20", journey: "Knowledgeable: I have some certifications or am currently studying (e.g., Security+, ISC2 CC).", role: "Offensive: Ethical Hacking / Penetration Testing", roadblock: "Technical Skills: I struggle with hands-on tools", time: "Accelerated: 10+ hours", country: "Russia", certs: "CEH, RHCSA, RHCE, RedHat Certified System Admin, RedHat Certified System Engineer, Not sure yet", suggestion: "" },
  { timestamp: "2/6/2026 18:25:05", journey: "Security Professional: I already work in Security but want to level up my advanced skills.", role: "Governance: GRC (Governance, Risk, and Compliance) / Auditing", roadblock: "Technical Skills: I struggle with hands-on tools", time: "Focused: 2–5 hours", country: "USA", certs: "Not sure yet", suggestion: "N/A" },
  { timestamp: "2/6/2026 18:37:14", journey: "Knowledgeable: I have some certifications or am currently studying (e.g., Security+, ISC2 CC).", role: "Architecture: Cloud Security / Security Engineering", roadblock: "Networking: I lack professional connections or mentorship", time: "Dedicated: 5–10 hours", country: "Rwanda", certs: "Security+, Cloud Security Certifications, Not sure yet", suggestion: "" },
  { timestamp: "2/6/2026 18:58:14", journey: "Knowledgeable: I have some certifications or am currently studying (e.g., Security+, ISC2 CC).", role: "Architecture: Cloud Security / Security Engineering", roadblock: "Networking: I lack professional connections or mentorship", time: "Accelerated: 10+ hours", country: "Rwanda", certs: "Security+, CEH, Cloud Security Certifications, RHCE, RedHat Certified System Engineer", suggestion: "" }
];

// Country normalization map
const countryNormalization: Record<string, string> = {
  "Reanda": "Rwanda",
  "reanda": "Rwanda"
};

export function normalizeCountry(country: string): string {
  const trimmed = (country ?? "").toString().trim();
  return countryNormalization[trimmed] || trimmed;
}

export function getShortLabel(fullLabel: string): string {
  const colonIndex = fullLabel.indexOf(':');
  return colonIndex > -1 ? fullLabel.substring(0, colonIndex).trim() : fullLabel;
}

export function countBy<T>(items: T[], keyFn: (item: T) => string): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = (keyFn(item) ?? "").toString().trim() || "—";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

export function mapToSortedPairs(map: Map<string, number>, limit?: number): [string, number][] {
  const pairs = [...map.entries()].sort((a, b) => b[1] - a[1]);
  return limit ? pairs.slice(0, limit) : pairs;
}

export function top1(map: Map<string, number>): { label: string; value: number } {
  const pairs = mapToSortedPairs(map, 1);
  return pairs.length ? { label: pairs[0][0], value: pairs[0][1] } : { label: "—", value: 0 };
}

export function getPercentage(value: number, total: number): string {
  return total > 0 ? ((value / total) * 100).toFixed(1) : "0";
}

export function parseTimestampToDate(ts: string): Date | null {
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

export function getLastUpdated(): string {
  const dates = surveyResponses
    .map(r => parseTimestampToDate(r.timestamp))
    .filter((d): d is Date => d !== null);
  
  if (dates.length === 0) return "—";
  
  const last = new Date(Math.max(...dates.map(d => d.getTime())));
  return last.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

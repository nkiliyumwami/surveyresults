import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface CertEntry {
  name: string;
  credly_url: string;
}

interface CertifiedStudent {
  id: string;
  full_name: string | null;
  display_name: string | null;
  country: string | null;
  certification_name: string | null;
  certification_date: string | null;
  credly_url: string | null;
  profile_image_url: string | null;
  student_certifications: CertEntry[] | null;
}

/** Resolve the certifications array: prefer JSONB column, fall back to legacy single fields. */
function resolveCerts(s: CertifiedStudent): CertEntry[] {
  if (Array.isArray(s.student_certifications) && s.student_certifications.length > 0) {
    return s.student_certifications;
  }
  if (s.certification_name) {
    return [{ name: s.certification_name, credly_url: s.credly_url || "" }];
  }
  return [];
}

export function CertifiedCorner() {
  const [students, setStudents] = useState<CertifiedStudent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetchFeatured() {
      const { data } = await supabase
        .from("students")
        .select(
          "id, full_name, display_name, country, certification_name, certification_date, credly_url, profile_image_url, student_certifications"
        )
        .eq("featured_in_certified_corner", true)
        .order("certification_date", { ascending: false });

      setStudents(data || []);
      setLoaded(true);
    }
    fetchFeatured();
  }, []);

  if (!loaded || students.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyber-amber/10 border border-cyber-amber/20 mb-4">
            <Award className="h-4 w-4 text-cyber-amber" />
            <span className="text-sm font-medium text-cyber-amber">
              Hall of Fame
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Certified Corner
          </h2>
          <p className="mt-2 text-muted-foreground">
            Celebrating students who earned their cybersecurity certifications
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((s, i) => {
            const certs = resolveCerts(s);

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-xl border border-cyber-amber/30 bg-cyber-amber/5 p-6 text-center hover:border-cyber-amber/50 transition-colors"
              >
                {/* Photo or fallback */}
                <div className="mx-auto mb-4 h-20 w-20 rounded-full border-2 border-cyber-amber/40 bg-cyber-amber/10 flex items-center justify-center overflow-hidden">
                  {s.profile_image_url ? (
                    <img
                      src={s.profile_image_url}
                      alt={s.display_name || s.full_name || "Student"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Award className="h-8 w-8 text-cyber-amber" />
                  )}
                </div>

                {/* Name */}
                <h3 className="font-semibold text-foreground text-lg">
                  {s.display_name || s.full_name || "Anonymous"}
                </h3>

                {/* Country */}
                {s.country && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {s.country}
                  </p>
                )}

                {/* Certification badges */}
                {certs.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    {certs.map((c, ci) => (
                      <div
                        key={ci}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyber-amber/15 border border-cyber-amber/30"
                      >
                        <Award className="h-3.5 w-3.5 text-cyber-amber" />
                        <span className="text-sm font-medium text-cyber-amber">
                          {c.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Date */}
                {s.certification_date && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Earned{" "}
                    {new Date(s.certification_date + "T00:00:00").toLocaleDateString(
                      undefined,
                      { year: "numeric", month: "long" }
                    )}
                  </p>
                )}

                {/* Credly links */}
                {certs.some((c) => c.credly_url) && (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                    {certs
                      .filter((c) => c.credly_url)
                      .map((c, ci) => (
                        <a
                          key={ci}
                          href={c.credly_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-cyber-amber hover:text-cyber-amber/80 transition-colors"
                        >
                          {certs.filter((x) => x.credly_url).length > 1
                            ? c.name
                            : "Verify on Credly"}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

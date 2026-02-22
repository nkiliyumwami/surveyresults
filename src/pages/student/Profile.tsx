import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Globe, BookOpen, Award, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";

interface StudentData {
  id: string;
  full_name: string | null;
  display_name: string | null;
  email: string | null;
  country: string | null;
  journey_level: string | null;
  target_role: string | null;
  weekly_hours: string | null;
  certifications: string | null;
  profile_image_url: string | null;
  is_profile_active: boolean;
  student_certifications: { name: string; credly_url: string }[] | null;
}

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    (async () => {
      const { data, error } = await supabase
        .from("students")
        .select(
          "id, full_name, display_name, email, country, journey_level, target_role, weekly_hours, certifications, profile_image_url, is_profile_active, student_certifications"
        )
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setStudent(data);
      }
      setLoading(false);
    })();
  }, [id]);

  const name = student?.display_name || student?.full_name || "Student";

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <Navbar />

      <main className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Button asChild variant="ghost" size="sm" className="mb-6 gap-1.5">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          {loading && (
            <div className="flex items-center justify-center py-24">
              <div className="animate-pulse text-muted-foreground">Loading profile…</div>
            </div>
          )}

          {notFound && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24"
            >
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Profile Not Found
              </h2>
              <p className="text-muted-foreground">
                The student profile you're looking for doesn't exist.
              </p>
            </motion.div>
          )}

          {student && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header Card */}
              <div className="card-cyber p-6 sm:p-8">
                <div className="flex items-start gap-5">
                  <div className="h-16 w-16 rounded-full border-2 border-primary/30 bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {student.profile_image_url ? (
                      <img
                        src={student.profile_image_url}
                        alt={name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Shield className="h-7 w-7 text-primary" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{name}</h1>
                    {student.country && (
                      <p className="flex items-center gap-1.5 text-muted-foreground mt-1">
                        <Globe className="h-4 w-4" />
                        {student.country}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="card-cyber p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Learning Profile
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {student.target_role && (
                    <div>
                      <p className="text-muted-foreground mb-0.5">Target Role</p>
                      <p className="text-foreground">{student.target_role}</p>
                    </div>
                  )}
                  {student.journey_level && (
                    <div>
                      <p className="text-muted-foreground mb-0.5">Journey Level</p>
                      <p className="text-foreground">{student.journey_level}</p>
                    </div>
                  )}
                  {student.weekly_hours && (
                    <div>
                      <p className="text-muted-foreground mb-0.5">Weekly Hours</p>
                      <p className="text-foreground">{student.weekly_hours}</p>
                    </div>
                  )}
                  {student.certifications && (
                    <div className="sm:col-span-2">
                      <p className="text-muted-foreground mb-0.5">Certifications Pursuing</p>
                      <p className="text-foreground">{student.certifications}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Earned Certifications */}
              {Array.isArray(student.student_certifications) &&
                student.student_certifications.length > 0 && (
                  <div className="card-cyber p-6 sm:p-8">
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Award className="h-5 w-5 text-cyber-amber" />
                      Earned Certifications
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {student.student_certifications.map((c, i) => (
                        <div
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyber-amber/10 border border-cyber-amber/30"
                        >
                          <Award className="h-3.5 w-3.5 text-cyber-amber" />
                          <span className="text-sm font-medium text-cyber-amber">
                            {c.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TutorialPopup } from "@/components/ui/TutorialPopup";

const INDUSTRIES = [
  "אופנה",
  "יופי וקוסמטיקה",
  "כושר ובריאות",
  "אוכל ומשקאות",
  "טכנולוגיה",
  "משחקים",
  "טיולים ונופש",
  "עיצוב הבית",
  "DIY ויצירה",
  "עסקים ויזמות",
  "חינוך",
  "בידור",
  "ספורט",
  "מוזיקה",
  "אמנות",
  "ספרים",
  "רכב",
  "ביטוח ופיננסים",
  "אחר",
];

export default function BrandRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    brandName: "",
    industry: "",
    website: "",
  });

  // Function to normalize website URL
  const normalizeWebsite = (url: string): string => {
    if (!url) return '';
    
    let normalized = url.trim();
    
    // If it doesn't start with http:// or https://, add https://
    if (!normalized.match(/^https?:\/\//i)) {
      normalized = 'https://' + normalized;
    }
    
    return normalized;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      // Normalize website URL
      const normalizedWebsite = normalizeWebsite(formData.website);

      // 1. הרשמה ל-Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.displayName,
            user_type: "brand",
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // 2. יצירת פרופיל
      const { error: profileError } = await supabase
        .from("users_profiles")
        .insert({
          user_id: authData.user.id,
          display_name: formData.displayName,
          email: formData.email,
          language: "he",
        });

      if (profileError) throw profileError;

      // 3. יצירת מותג
      const { data: brandData, error: brandError } = await supabase
        .from("brands")
        .insert({
          name: formData.brandName,
          industry: formData.industry,
          website: normalizedWebsite,
        })
        .select()
        .single();

      if (brandError) throw brandError;

      // 4. יצירת membership
      const { error: membershipError } = await supabase
        .from("memberships")
        .insert({
          user_id: authData.user.id,
          role: "brand_manager",
          entity_type: "brand",
          entity_id: brandData.id,
          is_active: true,
        });

      if (membershipError) throw membershipError;

      // 5. יצירת brand_users
      const { error: brandUserError } = await supabase
        .from("brand_users")
        .insert({
          brand_id: brandData.id,
          user_id: authData.user.id,
          role: "brand_manager",
          is_active: true,
        });

      if (brandUserError) throw brandUserError;

      // 6. התחברות אוטומטית עם הסיסמה
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

      if (signInError) throw signInError;

      // 7. Redirect ישירות ל-dashboard
      window.location.href = "/brand/dashboard";
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "שגיאה בהרשמה");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#f8f9fa] border border-[#dee2e6] rounded-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#212529] mb-2">
              הרשמה למותגים
            </h1>
            <p className="text-[#6c757d]">
              צרו חשבון מותג וצאו לקמפיינים
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="שם מלא"
              type="text"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              required
            />

            <Input
              label="אימייל"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />

            <Input
              label="סיסמה"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />

            <Input
              label="שם המותג"
              type="text"
              value={formData.brandName}
              onChange={(e) =>
                setFormData({ ...formData, brandName: e.target.value })
              }
              required
            />

            <div>
              <label className="block text-sm font-medium text-[#212529] mb-2">
                תעשייה *
              </label>
              <select
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                required
                className="w-full px-4 py-3 bg-white border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold transition-colors"
              >
                <option value="" disabled>בחר תעשייה...</option>
                {INDUSTRIES.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="אתר אינטרנט"
              type="text"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
              placeholder="example.com או www.example.com"
            />

            <Button
              type="submit"
              className="w-full bg-[#f2cc0d] text-[#121212] hover:bg-[#d4b00b]"
              disabled={loading}
            >
              {loading ? "מתבצעת הרשמה..." : "הרשמה"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#6c757d] text-sm">
              כבר יש לך חשבון?{" "}
              <a href="/auth/login" className="text-[#f2cc0d] hover:underline">
                התחבר
              </a>
            </p>
            <p className="text-[#6c757d] text-sm mt-2">
              משפיען?{" "}
              <a
                href="/auth/register/creator"
                className="text-[#f2cc0d] hover:underline"
              >
                הירשם כמשפיען
              </a>
            </p>
          </div>
        </div>
      </div>

      <TutorialPopup tutorialKey="brand_onboarding" />
    </div>
  );
}

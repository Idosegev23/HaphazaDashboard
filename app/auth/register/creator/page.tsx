"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TutorialPopup } from "@/components/ui/TutorialPopup";

type Platform = {
  name: string;
  handle: string;
  followers: string;
};

type FormData = {
  // Step 1: Basic Info
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;

  // Step 2: Personal Details
  age: string;
  gender: string;
  country: string;
  city: string;

  // Step 3: Professional Info
  niches: string[];
  occupations: string[];

  // Step 4: Social Platforms
  platforms: Platform[];

  // Step 5: Portfolio
  portfolioLinks: string[];
};

const NICHES = [
  "אופנה",
  "יופי וקוסמטיקה",
  "כושר ובריאות",
  "אוכל ומתכונים",
  "טכנולוגיה",
  "משחקים",
  "טיולים ונופש",
  "לייפסטייל",
  "הורות וילדים",
  "עיצוב הבית",
  "DIY ויצירה",
  "עסקים ויזמות",
  "חינוך",
  "בידור",
  "ספורט",
  "מוזיקה",
  "אמנות",
  "ספרים",
];

const OCCUPATIONS = [
  "סטודנט/ית",
  "עובד/ת במשרה מלאה",
  "עובד/ת במשרה חלקית",
  "פרילנסר/ית",
  "יזם/ית",
  "הורה במשרה מלאה",
  "פנסיונר/ית",
  "אחר",
];

const SOCIAL_PLATFORMS = [
  { name: "TikTok", icon: "🎵" },
  { name: "Instagram", icon: "📷" },
  { name: "YouTube", icon: "📹" },
  { name: "Facebook", icon: "👍" },
  { name: "Twitter/X", icon: "🐦" },
  { name: "LinkedIn", icon: "💼" },
  { name: "Threads", icon: "🧵" },
];

export default function CreatorRegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    age: "",
    gender: "",
    country: "ישראל",
    city: "",
    niches: [],
    occupations: [],
    platforms: [],
    portfolioLinks: [""],
  });

  const totalSteps = 5;

  const handleNext = () => {
    // Validation per step
    if (currentStep === 1) {
      if (!formData.email || !formData.password || !formData.displayName) {
        setError("יש למלא את כל השדות");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("הסיסמאות לא תואמות");
        return;
      }
      if (formData.password.length < 6) {
        setError("הסיסמה חייבת להיות לפחות 6 תווים");
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.age || !formData.gender || !formData.city) {
        setError("יש למלא את כל השדות");
        return;
      }
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
        setError("גיל לא תקין (חייב להיות בין 13-120)");
        return;
      }
    }

    if (currentStep === 3) {
      if (formData.niches.length === 0 || formData.occupations.length === 0) {
        setError("יש לבחור לפחות תחום עניין אחד ומצב תעסוקתי");
        return;
      }
    }

    if (currentStep === 4) {
      if (formData.platforms.length === 0) {
        setError("יש להוסיף לפחות פלטפורמה אחת");
        return;
      }
      // Check all platforms have followers count
      const incompletePlatforms = formData.platforms.some(
        (p) => !p.handle || !p.followers
      );
      if (incompletePlatforms) {
        setError("יש למלא את כל פרטי הפלטפורמות");
        return;
      }
    }

    setError("");
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const toggleNiche = (niche: string) => {
    setFormData((prev) => ({
      ...prev,
      niches: prev.niches.includes(niche)
        ? prev.niches.filter((n) => n !== niche)
        : [...prev.niches, niche],
    }));
  };

  const toggleOccupation = (occupation: string) => {
    setFormData((prev) => ({
      ...prev,
      occupations: prev.occupations.includes(occupation)
        ? prev.occupations.filter((o) => o !== occupation)
        : [...prev.occupations, occupation],
    }));
  };

  const addPlatform = (platformName: string) => {
    if (formData.platforms.some((p) => p.name === platformName)) return;
    setFormData((prev) => ({
      ...prev,
      platforms: [
        ...prev.platforms,
        { name: platformName, handle: "", followers: "" },
      ],
    }));
  };

  const removePlatform = (platformName: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.filter((p) => p.name !== platformName),
    }));
  };

  const updatePlatform = (
    platformName: string,
    field: "handle" | "followers",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.map((p) =>
        p.name === platformName ? { ...p, [field]: value } : p
      ),
    }));
  };

  const addPortfolioLink = () => {
    setFormData((prev) => ({
      ...prev,
      portfolioLinks: [...prev.portfolioLinks, ""],
    }));
  };

  const removePortfolioLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.filter((_, i) => i !== index),
    }));
  };

  const updatePortfolioLink = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.map((link, i) =>
        i === index ? value : link
      ),
    }));
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      console.log("Starting registration...");

      // 1. הרשמה ל-Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.displayName,
            user_type: "creator",
          },
          emailRedirectTo: undefined, // Disable email confirmation
        },
      });

      if (authError) {
        console.error("Auth error:", authError);
        throw authError;
      }
      if (!authData.user) throw new Error("Failed to create user");

      console.log("User created:", authData.user.id);

      // 2. יצירת פרופיל
      const { error: profileError } = await supabase
        .from("users_profiles")
        .insert({
          user_id: authData.user.id,
          display_name: formData.displayName,
          email: formData.email,
          language: "he",
        });

      if (profileError) {
        console.error("Profile error:", profileError);
        throw profileError;
      }

      console.log("Profile created");

      // 3. יצירת creator עם כל הפרטים
      const platformsData = formData.platforms.reduce((acc, p) => {
        acc[p.name] = {
          handle: p.handle,
          followers: parseInt(p.followers.replace(/,/g, "")) || 0,
        };
        return acc;
      }, {} as any);

      const { error: creatorError } = await supabase.from("creators").insert({
        user_id: authData.user.id,
        age: parseInt(formData.age),
        gender: formData.gender,
        country: formData.country,
        niches: formData.niches,
        occupations: formData.occupations,
        platforms: platformsData,
        portfolio_links: formData.portfolioLinks.filter((link) => link.trim()),
      });

      if (creatorError) {
        console.error("Creator error:", creatorError);
        throw creatorError;
      }

      console.log("Creator created");

      // 4. יצירת membership
      const { error: membershipError } = await supabase
        .from("memberships")
        .insert({
          user_id: authData.user.id,
          role: "creator",
          entity_type: null,
          entity_id: null,
          is_active: true,
        });

      if (membershipError) {
        console.error("Membership error:", membershipError);
        throw membershipError;
      }

      console.log("Membership created");

      // 5. התחבר מחדש עם הסיסמה (כדי לוודא שהסשן פעיל)
      console.log("Signing in...");
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

      if (signInError) {
        console.error("Sign in error:", signInError);
        // אם ההתחברות נכשלה, נסה בכל זאת לעבור לדשבורד
        console.log("Sign in failed, but user was created. Redirecting...");
      } else {
        console.log("Signed in successfully:", signInData);
      }

      // 6. המתן קצר
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Redirecting to dashboard...");

      // 7. Redirect עם window.location
      window.location.href = "/creator/dashboard";
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "שגיאה בהרשמה");
      setLoading(false);
    }
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#232010] p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-[#2e2a1b] border border-[#494222] rounded-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              הרשמה למשפיענים
            </h1>
            <p className="text-[#cbc190]">
              שלב {currentStep} מתוך {totalSteps}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="h-2 bg-[#232010] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#f2cc0d] transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <h2 className="text-xl font-bold text-white mb-4">
                  פרטים בסיסיים
                </h2>

                <Input
                  label="שם מלא"
                  type="text"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  placeholder="לדוגמה: דני כהן"
                  required
                />

                <Input
                  label="אימייל"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="example@email.com"
                  required
                />

                <Input
                  label="סיסמה"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="לפחות 6 תווים"
                  required
                />

                <Input
                  label="אימות סיסמה"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="הזן את הסיסמה שוב"
                  required
                />
              </div>
            )}

            {/* Step 2: Personal Details */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <h2 className="text-xl font-bold text-white mb-4">
                  פרטים אישיים
                </h2>

                <Input
                  label="גיל"
                  type="number"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  placeholder="הזן את גילך"
                  min="13"
                  max="120"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-[#cbc190] mb-2">
                    מגדר
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#232010] border border-[#494222] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f2cc0d]"
                    required
                  >
                    <option value="">בחר מגדר</option>
                    <option value="male">זכר</option>
                    <option value="female">נקבה</option>
                    <option value="other">אחר</option>
                    <option value="prefer_not_to_say">מעדיף/ה לא לציין</option>
                  </select>
                </div>

                <Input
                  label="עיר"
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="לדוגמה: תל אביב"
                  required
                />
              </div>
            )}

            {/* Step 3: Professional Info */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    תחומי עניין
                  </h2>
                  <p className="text-sm text-[#cbc190] mb-4">
                    בחר את התחומים שאתה יוצר בהם תוכן (מינימום 1)
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {NICHES.map((niche) => (
                      <button
                        key={niche}
                        type="button"
                        onClick={() => toggleNiche(niche)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all text-sm ${
                          formData.niches.includes(niche)
                            ? "border-[#f2cc0d] bg-[#f2cc0d]/20 text-white"
                            : "border-[#494222] bg-[#232010] text-[#cbc190] hover:border-[#f2cc0d]/50"
                        }`}
                      >
                        {niche}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    מצב תעסוקתי
                  </h2>
                  <p className="text-sm text-[#cbc190] mb-4">
                    בחר את המצב התעסוקתי שלך (ניתן לבחור כמה)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {OCCUPATIONS.map((occupation) => (
                      <button
                        key={occupation}
                        type="button"
                        onClick={() => toggleOccupation(occupation)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all text-sm ${
                          formData.occupations.includes(occupation)
                            ? "border-[#f2cc0d] bg-[#f2cc0d]/20 text-white"
                            : "border-[#494222] bg-[#232010] text-[#cbc190] hover:border-[#f2cc0d]/50"
                        }`}
                      >
                        {occupation}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Social Platforms */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    פלטפורמות סושיאל
                  </h2>
                  <p className="text-sm text-[#cbc190] mb-4">
                    הוסף את הפלטפורמות שבהן אתה פעיל (מינימום 1)
                  </p>

                  {/* Available Platforms */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {SOCIAL_PLATFORMS.map((platform) => {
                      const isAdded = formData.platforms.some(
                        (p) => p.name === platform.name
                      );
                      return (
                        <button
                          key={platform.name}
                          type="button"
                          onClick={() =>
                            isAdded
                              ? removePlatform(platform.name)
                              : addPlatform(platform.name)
                          }
                          className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                            isAdded
                              ? "border-[#f2cc0d] bg-[#f2cc0d]/20 text-white"
                              : "border-[#494222] bg-[#232010] text-[#cbc190] hover:border-[#f2cc0d]/50"
                          }`}
                        >
                          <span>{platform.icon}</span>
                          <span>{platform.name}</span>
                          {isAdded && <span>✓</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Platform Details */}
                  {formData.platforms.map((platform) => (
                    <div
                      key={platform.name}
                      className="bg-[#232010] border border-[#494222] rounded-lg p-4 mb-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-bold">
                          {platform.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removePlatform(platform.name)}
                          className="text-red-400 hover:text-red-300"
                        >
                          הסר
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          label="שם משתמש/@"
                          type="text"
                          value={platform.handle}
                          onChange={(e) =>
                            updatePlatform(
                              platform.name,
                              "handle",
                              e.target.value
                            )
                          }
                          placeholder="@username"
                        />
                        <Input
                          label="מספר עוקבים"
                          type="text"
                          value={platform.followers}
                          onChange={(e) =>
                            updatePlatform(
                              platform.name,
                              "followers",
                              e.target.value
                            )
                          }
                          placeholder="לדוגמה: 10000"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Portfolio */}
            {currentStep === 5 && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    תיק עבודות (אופציונלי)
                  </h2>
                  <p className="text-sm text-[#cbc190] mb-4">
                    הוסף קישורים לעבודות קודמות, תיק עבודות או תוכן מצטיין
                  </p>

                  {formData.portfolioLinks.map((link, index) => (
                    <div key={index} className="flex gap-2 mb-3">
                      <Input
                        label={`קישור ${index + 1}`}
                        type="url"
                        value={link}
                        onChange={(e) =>
                          updatePortfolioLink(index, e.target.value)
                        }
                        placeholder="https://..."
                      />
                      {formData.portfolioLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePortfolioLink(index)}
                          className="mt-8 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                        >
                          הסר
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addPortfolioLink}
                    className="w-full py-2 border-2 border-dashed border-[#494222] rounded-lg text-[#cbc190] hover:border-[#f2cc0d] hover:text-[#f2cc0d] transition-all"
                  >
                    + הוסף קישור נוסף
                  </button>
                </div>

                <div className="bg-[#f2cc0d]/10 border border-[#f2cc0d]/30 rounded-lg p-4 mt-6">
                  <p className="text-[#f2cc0d] text-sm">
                    🎉 כמעט סיימנו! לחץ על "השלם הרשמה" כדי ליצור את החשבון שלך
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={handleBack}
                className="flex-1 bg-[#232010] text-white border border-[#494222] hover:bg-[#2e2a1b]"
                disabled={loading}
              >
                חזור
              </Button>
            )}

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex-1 bg-[#f2cc0d] text-[#121212] hover:bg-[#d4b00b]"
              >
                המשך
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                className="flex-1 bg-[#f2cc0d] text-[#121212] hover:bg-[#d4b00b]"
                disabled={loading}
              >
                {loading ? "מבצע הרשמה..." : "השלם הרשמה"}
              </Button>
            )}
          </div>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <p className="text-[#cbc190] text-sm">
              כבר יש לך חשבון?{" "}
              <a href="/auth/login" className="text-[#f2cc0d] hover:underline">
                התחבר
              </a>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>

      <TutorialPopup tutorialKey="creator_onboarding" />
    </div>
  );
}

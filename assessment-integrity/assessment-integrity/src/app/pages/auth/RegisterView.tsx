import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import imgAssessmentIntegrityLogo from "../../../imports/LoginPortalIntegrityOs/assessment_integrity_logo.png";

interface RegisterViewProps {
  setView: (view: any) => void;
  onRegisterSuccess: (email: string) => void;
  isFacultyPortal?: boolean;
}

export function RegisterView({ setView, onRegisterSuccess, isFacultyPortal = false }: RegisterViewProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const isValidDomain = normalizedEmail.endsWith("@srmap.edu.in") || normalizedEmail === "admin@university.edu" || normalizedEmail === "neelampallicharanbalaji14@gmail.com";
    if (!isValidDomain) {
      toast.error("Only @srmap.edu.in email domains are allowed.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          name: name.trim(),
          role: isFacultyPortal ? "faculty" : "user",
        }),
      });

      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Non-JSON signup response:", text);
        if (text.includes("<html") || text.includes("<HTML")) {
          throw new Error(`Server error: HTTP ${response.status}. Please check if the backend server is running.`);
        }
        throw new Error(text || `Server error: HTTP ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to create account.");
      }

      toast.success("Account created successfully! Configure institution credentials.");
      onRegisterSuccess(normalizedEmail);
    } catch (err: any) {
      toast.error(err.message || "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      key="register"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6 w-full"
    >
      {/* Header */}
      <div className="flex flex-col">
        <div className="flex items-center gap-3.5 mb-6 w-fit">
          <img
            src={imgAssessmentIntegrityLogo}
            alt="Assessment Integrity Logo"
            className="h-12 w-auto object-contain"
          />
          <h2 className="text-[32px] font-bold leading-[38.4px] tracking-[-1.6px] text-[#1a1917]">
            IntegrityOS
          </h2>
        </div>
        <h3 className="text-xl font-bold leading-[28px] tracking-[-0.4px] text-[#1a1917] mb-1">
          {isFacultyPortal ? "Create Faculty Account" : "Create Account"}
        </h3>
        <p className="text-sm font-normal leading-[21px] text-[#6b6861]">
          {isFacultyPortal ? "Register to access the faculty dashboard." : "Register to access the examination dashboard."}
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-5">
        {/* Full Name */}
        <div className="flex flex-col gap-2 relative">
          <Label className="text-xs font-semibold leading-[16.8px] tracking-[0.24px] text-[#5e5a52]">
            Full Name
          </Label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="h-[50px] w-full rounded-xl border border-[#e2dfd5] bg-[#fafaf8] pl-11 pr-4 py-4 text-sm text-[#1c1b1b] placeholder:text-[#a09c94] outline-none caret-[#c5af8a] transition-all duration-[250ms] ease-out hover:border-[#d5cbb8] hover:shadow-[0_0_12px_rgba(197,175,138,0.15)] focus:border-[#c5af8a] focus:ring-2 focus:ring-[#c5af8a]/20 focus:shadow-[0_0_20px_rgba(197,175,138,0.2)]"
            />
            <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#9b9690] pointer-events-none" />
          </div>
        </div>

        {/* University Email */}
        <div className="flex flex-col gap-2 relative">
          <Label className="text-xs font-semibold leading-[16.8px] tracking-[0.24px] text-[#5e5a52]">
            University Email
          </Label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@srmap.edu.in"
              className="h-[50px] w-full rounded-xl border border-[#e2dfd5] bg-[#fafaf8] pl-11 pr-4 py-4 text-sm text-[#1c1b1b] placeholder:text-[#a09c94] outline-none caret-[#c5af8a] transition-all duration-[250ms] ease-out hover:border-[#d5cbb8] hover:shadow-[0_0_12px_rgba(197,175,138,0.15)] focus:border-[#c5af8a] focus:ring-2 focus:ring-[#c5af8a]/20 focus:shadow-[0_0_20px_rgba(197,175,138,0.2)]"
            />
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#9b9690] pointer-events-none" />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2 relative">
          <Label className="text-xs font-semibold leading-[16.8px] tracking-[0.24px] text-[#5e5a52]">
            Password
          </Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-[50px] w-full rounded-xl border-[#e2dfd5] bg-[#fafaf8] pl-[44px] pr-[44px] py-[15px] text-sm text-[#1c1b1b] placeholder:text-[#a09c94] focus-visible:border-[#c5af8a] transition-all duration-300"
            />
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#9b9690] pointer-events-none" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#8e8a80] hover:text-[#1a1917] transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:text-[#1a1917]"
            >
              {showPassword ? (
                <EyeOff className="size-[18px]" />
              ) : (
                <Eye className="size-[18px]" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-2 relative">
          <Label className="text-xs font-semibold leading-[16.8px] tracking-[0.24px] text-[#5e5a52]">
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="h-[50px] w-full rounded-xl border-[#e2dfd5] bg-[#fafaf8] pl-[44px] pr-4 py-[15px] text-sm text-[#1c1b1b] placeholder:text-[#a09c94] focus-visible:border-[#c5af8a] transition-all duration-300"
            />
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#9b9690] pointer-events-none" />
          </div>
        </div>

        {/* Register Button */}
        <motion.button
          type="button"
          onClick={handleRegister}
          disabled={isSubmitting}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="btn-liquid-glass-black h-auto w-full flex items-center justify-center gap-2 rounded-xl py-4 text-base font-bold leading-6 transition-all duration-300 cursor-pointer outline-none disabled:opacity-50"
        >
          {isSubmitting ? "Creating account..." : "Register"}
          <motion.div variants={{ idle: { x: 0 }, hover: { x: 6 } }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="flex items-center">
            <ArrowRight className="size-[13.333px]" />
          </motion.div>
        </motion.button>
      </div>

      <div className="relative flex items-center">
        <div className="flex-1 border-t border-[#ebdcc9]/60" />
        <div className="bg-[#d5c7ab] px-3 py-1 rounded-[4px] mx-3">
          <p className="text-[10px] font-bold uppercase leading-[14px] tracking-[1px] text-white">OR</p>
        </div>
        <div className="flex-1 border-t border-[#ebdcc9]/60" />
      </div>

      <div className="text-center text-sm text-[#6b6861]">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => setView("login")}
          className="font-bold text-[#1a1917] hover:underline cursor-pointer bg-transparent border-none outline-none"
        >
          Login
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 mt-2 text-xs text-[#9b9690] border-t border-[#ebdcc9]/40 pt-4">
        <button
          type="button"
          onClick={() => setView("terms")}
          className="hover:text-[#1a1917] hover:underline cursor-pointer bg-transparent border-none outline-none"
        >
          Terms & Conditions
        </button>
        <span>•</span>
        <button
          type="button"
          onClick={() => setView("privacy")}
          className="hover:text-[#1a1917] hover:underline cursor-pointer bg-transparent border-none outline-none"
        >
          Privacy Policy
        </button>
      </div>
    </motion.div>
  );
}

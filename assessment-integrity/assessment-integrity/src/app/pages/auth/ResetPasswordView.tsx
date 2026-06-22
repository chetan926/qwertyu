import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { LockKeyhole, Lock, ArrowRight, Check } from "lucide-react";
import { Label } from "../../components/ui/label";

interface ResetPasswordViewProps {
  newPassword: string;
  setNewPassword: (pw: string) => void;
  confirmPassword: string;
  setConfirmPassword: (pw: string) => void;
  newPasswordError: boolean;
  confirmPasswordError: boolean;
  resetCompleted: boolean;
  handleResetPassword: () => void;
  handleBackToLogin: () => void;
}

export function ResetPasswordView({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  newPasswordError,
  confirmPasswordError,
  resetCompleted,
  handleResetPassword,
  handleBackToLogin,
}: ResetPasswordViewProps) {
  return (
    <motion.div
      key="forgot-reset"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6 w-full"
    >
      {!resetCompleted ? (
        <>
          <div className="text-center py-2 flex flex-col items-center">
            <div className="w-14 h-14 bg-[#eaf5ee] rounded-full flex items-center justify-center mb-4 border border-[#b5dec2]/50">
              <LockKeyhole className="size-6 text-emerald-600" />
            </div>
            <div className="otp-heading text-[18px] font-bold text-[#1a1917] mb-1">Reset Password</div>
            <div className="otp-desc text-xs text-[#6b6560]">Create a new secure password for your account.</div>
          </div>

          <div className="flex flex-col gap-5">
            {/* New Password */}
            <div className="flex flex-col gap-2 relative">
              <Label className="text-xs font-semibold leading-[16.8px] tracking-[0.24px] text-[#5e5a52]">
                New Password
              </Label>
              <div className="relative">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className={`h-[50px] w-full rounded-xl border bg-[#fafaf8] pl-11 pr-4 py-4 text-sm text-[#1c1b1b] placeholder:text-[#a09c94] outline-none caret-[#c5af8a] transition-all duration-[250ms] ease-out cursor-text placeholder:transition-opacity placeholder:duration-[250ms] focus:placeholder:opacity-50
                    ${newPasswordError
                      ? "border-[#d4183d] focus:border-[#d4183d] focus:ring-2 focus:ring-[#d4183d]/20 shadow-[0_0_12px_rgba(212,24,61,0.08)]"
                      : "border-[#e2dfd5] hover:border-[#d5cbb8] hover:shadow-[0_0_12px_rgba(197,175,138,0.15)] focus:border-[#c5af8a] focus:ring-2 focus:ring-[#c5af8a]/20 focus:shadow-[0_0_20px_rgba(197,175,138,0.2)]"
                    }`}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#9b9690] pointer-events-none" />
              </div>
              <AnimatePresence>
                {newPasswordError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-[calc(100%+2px)] left-0 pointer-events-none z-10"
                  >
                    <span className="text-[11px] font-semibold text-[#d4183d] tracking-wide">
                      Password must be at least 8 characters.
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-2 relative">
              <Label className="text-xs font-semibold leading-[16.8px] tracking-[0.24px] text-[#5e5a52]">
                Confirm Password
              </Label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={`h-[50px] w-full rounded-xl border bg-[#fafaf8] pl-11 pr-4 py-4 text-sm text-[#1c1b1b] placeholder:text-[#a09c94] outline-none caret-[#c5af8a] transition-all duration-[250ms] ease-out cursor-text placeholder:transition-opacity placeholder:duration-[250ms] focus:placeholder:opacity-50
                    ${confirmPasswordError
                      ? "border-[#d4183d] focus:border-[#d4183d] focus:ring-2 focus:ring-[#d4183d]/20 shadow-[0_0_12px_rgba(212,24,61,0.08)]"
                      : "border-[#e2dfd5] hover:border-[#d5cbb8] hover:shadow-[0_0_12px_rgba(197,175,138,0.15)] focus:border-[#c5af8a] focus:ring-2 focus:ring-[#c5af8a]/20 focus:shadow-[0_0_20px_rgba(197,175,138,0.2)]"
                    }`}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#9b9690] pointer-events-none" />
              </div>
              <AnimatePresence>
                {confirmPasswordError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-[calc(100%+2px)] left-0 pointer-events-none z-10"
                  >
                    <span className="text-[11px] font-semibold text-[#d4183d] tracking-wide">
                      Passwords must match and not be empty.
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reset Password Button */}
            <motion.button
              type="button"
              onClick={handleResetPassword}
              initial="idle"
              whileHover="hover"
              whileTap={{ scale: 0.98 }}
              variants={{
                idle: { y: 0, backgroundColor: "#1f1e1a", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" },
                hover: { y: -2, backgroundColor: "#161512", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }
              }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="h-auto w-full flex items-center justify-center gap-2 rounded-xl py-4 text-base font-bold leading-6 text-white/90 hover:text-white transition-all duration-[250ms] ease-out cursor-pointer outline-none"
            >
              <span>Reset Password</span>
              <motion.div variants={{ idle: { x: 0 }, hover: { x: 6 } }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="flex items-center">
                <ArrowRight className="size-[13.333px]" />
              </motion.div>
            </motion.button>
          </div>
        </>
      ) : (
        <div className="text-center py-6 flex flex-col items-center w-full">
          <div className="w-16 h-16 bg-[#eaf5ee] rounded-full flex items-center justify-center mb-5 border border-[#b5dec2]">
            <Check className="size-8 text-emerald-600" />
          </div>
          <div className="otp-heading text-xl font-bold text-[#1a1917] mb-2">All Done!</div>
          <div className="otp-desc text-sm leading-relaxed text-[#6b6560] mb-8">
            Your password has been successfully reset.<br />Return to login to access your account.
          </div>
          <motion.button
            type="button"
            onClick={handleBackToLogin}
            initial="idle"
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            variants={{
              idle: { y: 0, backgroundColor: "#1f1e1a", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" },
              hover: { y: -2, backgroundColor: "#161512", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }
            }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="h-auto w-full flex items-center justify-center gap-2 rounded-xl py-4 text-base font-bold leading-6 text-white/90 hover:text-white transition-all duration-[250ms] ease-out cursor-pointer outline-none"
          >
            <span>Back to Login</span>
            <motion.div variants={{ idle: { x: 0 }, hover: { x: 6 } }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="flex items-center">
              <ArrowRight className="size-[13.333px]" />
            </motion.div>
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

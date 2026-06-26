"use client";
import { useState, useRef, KeyboardEvent } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Car, Mail, ArrowLeft, ShieldCheck, Lock } from "lucide-react";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ── Step 1: Send OTP ── */
  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      setLoading(false);
      if (error) {
        setError(
          typeof error.message === "string" && error.message
            ? error.message
            : "Failed to send code. Please check your email and try again."
        );
        return;
      }
      setStep("otp");
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  };

  /* ── Step 2: Verify OTP ── */
  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.join("");
    if (token.length < 6) { setError("Enter all 6 digits."); return; }
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    setLoading(false);
    if (error) { setError("Invalid or expired code. Try again."); return; }
    setStep("password");
  };

  /* ── Step 3: Set New Password ── */
  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSuccess(true);
    setTimeout(() => { window.location.href = "/dashboard"; }, 2000);
  };

  /* ── OTP input helpers ── */
  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (digits.length) {
      setOtp([...digits, ...Array(6 - digits.length).fill("")]);
      otpRefs.current[Math.min(digits.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  /* ── Step indicators ── */
  const steps: { key: Step; label: string }[] = [
    { key: "email", label: "Email" },
    { key: "otp", label: "Verify" },
    { key: "password", label: "Password" },
  ];
  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-3 shadow-lg shadow-blue-500/30">
            <Car size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Handysolver</h1>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">

          {/* Step indicators */}
          {!success && (
            <div className="flex items-center gap-2 mb-7">
              {steps.map((s, idx) => (
                <div key={s.key} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      idx < stepIndex ? "bg-green-500 text-white" :
                      idx === stepIndex ? "bg-blue-600 text-white" :
                      "bg-white/10 text-gray-500"
                    }`}>
                      {idx < stepIndex ? "✓" : idx + 1}
                    </div>
                    <span className={`text-xs ${idx === stepIndex ? "text-white font-medium" : "text-gray-500"}`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-px ${idx < stepIndex ? "bg-green-500/50" : "bg-white/10"}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Success ── */}
          {success && (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-500/20 rounded-2xl mb-4">
                <ShieldCheck size={28} className="text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Password Updated!</h2>
              <p className="text-gray-400 text-sm">Redirecting you to the dashboard…</p>
            </div>
          )}

          {/* ── Step 1: Email ── */}
          {!success && step === "email" && (
            <>
              <h2 className="text-lg font-semibold text-white mb-1">Forgot password?</h2>
              <p className="text-gray-400 text-sm mb-6">Enter your email and we&apos;ll send a 6-digit code.</p>
              <form onSubmit={sendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@handysolver.com" required
                      className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
                {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">{error}</div>}
                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2 text-sm">
                  {loading && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                  {loading ? "Sending…" : "Send Code"}
                </button>
              </form>
              <div className="mt-5 text-center">
                <Link href="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 text-sm">
                  <ArrowLeft size={14} /> Back to Sign in
                </Link>
              </div>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {!success && step === "otp" && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-2xl mb-3">
                  <ShieldCheck size={22} className="text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-1">Enter verification code</h2>
                <p className="text-gray-400 text-sm">
                  We sent a 6-digit code to <span className="text-white font-medium">{email}</span>
                </p>
              </div>
              <form onSubmit={verifyOtp} className="space-y-5">
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKey(i, e)}
                      className="w-11 h-13 text-center text-xl font-bold bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors py-3"
                    />
                  ))}
                </div>
                {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm text-center">{error}</div>}
                <button type="submit" disabled={loading || otp.join("").length < 6} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2 text-sm">
                  {loading && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                  {loading ? "Verifying…" : "Verify Code"}
                </button>
              </form>
              <div className="mt-5 flex items-center justify-between text-sm">
                <button onClick={() => { setStep("email"); setOtp(["","","","","",""]); setError(""); }} className="text-gray-400 hover:text-gray-200 inline-flex items-center gap-1">
                  <ArrowLeft size={14} /> Change email
                </button>
                <button
                  onClick={async () => {
                    setError("");
                    await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
                    setOtp(["","","","","",""]);
                  }}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Resend code
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: New Password ── */}
          {!success && step === "password" && (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Lock size={18} className="text-green-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Set new password</h2>
                  <p className="text-gray-400 text-xs">Choose a strong password for your account.</p>
                </div>
              </div>
              <form onSubmit={updatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters" required minLength={6}
                      className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat password" required
                      className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
                {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">{error}</div>}
                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2 text-sm">
                  {loading && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                  {loading ? "Updating…" : "Update Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Car, Eye, EyeOff, Mail, Lock, User, Phone, Briefcase, Building2, MapPin, Calendar } from "lucide-react";

const ROLES = ["admin", "employee", "hr", "manager", "sales", "support"] as const;
const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

const DEPARTMENTS = ["Sales", "HR", "Finance", "Operations", "Marketing", "Support", "Management", "IT"];
const COUNTRIES = ["India", "USA", "UK", "UAE", "Australia", "Canada", "Singapore"];

interface FormData {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  phone: string;
  role: string;
  gender: string;
  department: string;
  job_title: string;
  date_of_birth: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

const INITIAL: FormData = {
  full_name: "", email: "", password: "", confirm_password: "",
  phone: "", role: "employee", gender: "", department: "",
  job_title: "", date_of_birth: "", address: "", city: "",
  state: "", country: "India", pincode: "",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm";
const iconInputCls = "w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm";
const selectCls = "w-full bg-gray-800 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) { setError("Passwords do not match"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError("");
    setStep(2);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name } },
    });

    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        role: form.role,
        gender: form.gender || null,
        department: form.department || null,
        job_title: form.job_title || null,
        date_of_birth: form.date_of_birth || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        country: form.country || null,
        pincode: form.pincode || null,
      });
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-2xl mb-4 shadow-lg shadow-green-500/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
          <p className="text-gray-400 text-sm mb-6">
            Check your email <span className="text-white font-medium">{form.email}</span> to confirm your account, then sign in.
          </p>
          <Link href="/login" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2.5 px-8 transition-colors text-sm">
            Go to Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-3 shadow-lg shadow-blue-500/30">
            <Car size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Handysolver</h1>
          <p className="text-gray-400 text-xs mt-0.5">Car Dealership Dashboard</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-blue-600 text-white" : "bg-white/10 text-gray-400"}`}>1</div>
              <span className={`text-xs font-medium ${step >= 1 ? "text-white" : "text-gray-500"}`}>Account</span>
            </div>
            <div className={`flex-1 h-px ${step >= 2 ? "bg-blue-600" : "bg-white/10"}`} />
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? "bg-blue-600 text-white" : "bg-white/10 text-gray-400"}`}>2</div>
              <span className={`text-xs font-medium ${step >= 2 ? "text-white" : "text-gray-500"}`}>Profile</span>
            </div>
          </div>

          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold text-white mb-5">Create your account</h2>

              <form onSubmit={nextStep} className="space-y-4">
                <Field label="Full Name" required>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="text" value={form.full_name} onChange={set("full_name")} placeholder="Pranay Khadse" required className={iconInputCls} />
                  </div>
                </Field>

                <Field label="Email Address" required>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="email" value={form.email} onChange={set("email")} placeholder="you@handysolver.com" required className={iconInputCls} />
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Password" required>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type={showPassword ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="••••••••" required minLength={6} className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-9 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </Field>

                  <Field label="Confirm Password" required>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type={showConfirm ? "text" : "password"} value={form.confirm_password} onChange={set("confirm_password")} placeholder="••••••••" required className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-9 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                        {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </Field>
                </div>

                {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">{error}</div>}

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2.5 mt-1 transition-colors text-sm">
                  Continue →
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-lg font-semibold text-white mb-5">Complete your profile</h2>
              <form onSubmit={handleSignup} className="space-y-4">

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Role" required>
                    <select value={form.role} onChange={set("role")} required className={selectCls}>
                      {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                  </Field>

                  <Field label="Gender">
                    <select value={form.gender} onChange={set("gender")} className={selectCls}>
                      <option value="">Select gender</option>
                      {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone Number">
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 XXXXX XXXXX" className={iconInputCls} />
                    </div>
                  </Field>

                  <Field label="Date of Birth">
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="date" value={form.date_of_birth} onChange={set("date_of_birth")} className={iconInputCls} />
                    </div>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Department">
                    <div className="relative">
                      <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <select value={form.department} onChange={set("department")} className="w-full bg-gray-800 border border-white/20 rounded-lg pl-9 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                        <option value="">Select department</option>
                        {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </Field>

                  <Field label="Job Title">
                    <div className="relative">
                      <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="text" value={form.job_title} onChange={set("job_title")} placeholder="Sales Executive" className={iconInputCls} />
                    </div>
                  </Field>
                </div>

                <Field label="Address">
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3 text-gray-500" />
                    <textarea value={form.address} onChange={set("address")} placeholder="Street address" rows={2} className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
                  </div>
                </Field>

                <div className="grid grid-cols-3 gap-3">
                  <Field label="City">
                    <input type="text" value={form.city} onChange={set("city")} placeholder="Mumbai" className={inputCls} />
                  </Field>
                  <Field label="State">
                    <input type="text" value={form.state} onChange={set("state")} placeholder="Maharashtra" className={inputCls} />
                  </Field>
                  <Field label="Pincode">
                    <input type="text" value={form.pincode} onChange={set("pincode")} placeholder="400001" maxLength={6} className={inputCls} />
                  </Field>
                </div>

                <Field label="Country">
                  <select value={form.country} onChange={set("country")} className={selectCls}>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>

                {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">{error}</div>}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => { setStep(1); setError(""); }} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg py-2.5 transition-colors text-sm">
                    ← Back
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2 text-sm">
                    {loading && (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {loading ? "Creating account…" : "Create Account"}
                  </button>
                </div>
              </form>
            </>
          )}

          <p className="text-center text-gray-500 text-sm mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

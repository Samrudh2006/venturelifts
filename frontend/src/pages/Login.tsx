import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Logo from "../components/Logo";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get("register") === "1");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("founder");
  const [expertise, setExpertise] = useState("");
  const [status, setStatus] = useState("");
  const { login, register, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("verify");
    const oauth = searchParams.get("oauth");
    if (token) {
      setStatus("Verifying your email...");
      api.auth.verifyEmail(token)
        .then(() => setStatus("Email verified. You can login now."))
        .catch((err) => setStatus(err.message || "Verification failed."));
    } else if (oauth === "not-configured") {
      setStatus("Google login is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
    } else if (oauth) {
      setStatus("Google login could not be completed. Please try email login.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setStatus(isRegister ? "Creating account..." : "Logging in...");
    try {
      if (isRegister) {
        await register({ name, email, password, role, expertise });
        setStatus("Account created! You can login now.");
        setIsRegister(false);
      } else {
        await login(email, password);
        navigate("/dashboard");
      }
    } catch (err: any) {
      setStatus(err.message || "Something went wrong");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 venturelift-platform-bg">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <Logo markClassName="h-16 w-16" wordmarkClassName="text-2xl" showTagline />
          </div>
          <p className="mt-3 text-sm text-gray-400">Secure access for founders, mentors, and venture teams.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gray-900/85 p-6 shadow-2xl shadow-black/30 backdrop-blur">
          <a
            href="/api/v1/oauth/google"
            className="mb-4 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-700 bg-white px-4 py-3 text-sm font-bold text-gray-900 transition hover:bg-gray-100"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
            </svg>
            Continue with Google
          </a>

          <div className="mb-4 flex gap-2 rounded-lg bg-gray-800/50 p-1">
            <button type="button" onClick={() => { setIsRegister(false); clearError(); setStatus(""); }} className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wider transition ${!isRegister ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30" : "text-gray-500 hover:text-gray-300"}`}>Login</button>
            <button type="button" onClick={() => { setIsRegister(true); clearError(); setStatus(""); }} className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wider transition ${isRegister ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30" : "text-gray-500 hover:text-gray-300"}`}>Register</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && <div><label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">Name</label><input value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" /></div>}
            <div><label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" /></div>
            <div><label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" /></div>
            {isRegister && <><div><label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">Role</label><select value={role} onChange={e => setRole(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"><option value="founder">Founder</option><option value="mentor">Mentor</option></select><p className="mt-1 text-xs text-gray-500">Admin access is invite-only for security.</p></div><div><label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">Expertise</label><input value={expertise} onChange={e => setExpertise(e.target.value)} placeholder="AI, healthtech, fundraising..." className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" /></div></>}
            <button type="submit" className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-red-600 p-3 text-sm font-bold text-white shadow-lg shadow-orange-600/30 transition hover:shadow-xl hover:shadow-orange-600/40 active:scale-[0.98]">{isRegister ? "Create Account" : "Login"}</button>
            {status && <p className="text-center text-xs font-semibold text-amber-400">{status}</p>}
            {error && <p className="text-center text-xs font-semibold text-red-400">{error}</p>}
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-gray-500">By continuing, you agree to VentureLift security, acceptable use, and founder data protection standards. <Link to="/" className="text-orange-400 hover:text-orange-300">Back to homepage</Link></p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("founder");
  const [expertise, setExpertise] = useState("");
  const [status, setStatus] = useState("");
  const { login, register, error, clearError } = useAuthStore();
  const navigate = useNavigate();

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
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-xl font-black text-white shadow-lg shadow-orange-600/30">
            VL
          </div>
          <h1 className="text-3xl font-black text-white font-heading">VENTURELIFT</h1>
          <p className="mt-2 text-sm text-gray-500">Entrepreneurial Support Platform</p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-6 backdrop-blur">
          <div className="mb-4 flex gap-2 rounded-lg bg-gray-800/50 p-1">
            <button
              onClick={() => { setIsRegister(false); clearError(); setStatus(""); }}
              className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wider transition ${
                !isRegister ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setIsRegister(true); clearError(); setStatus(""); }}
              className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wider transition ${
                isRegister ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} required
                  className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" />
            </div>
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">Role</label>
                  <select value={role} onChange={e => setRole(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20">
                    <option value="founder">Founder</option>
                    <option value="mentor">Mentor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">Expertise</label>
                  <input value={expertise} onChange={e => setExpertise(e.target.value)} placeholder="AI, healthtech, fundraising..."
                    className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" />
                </div>
              </>
            )}
            <button type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-red-600 p-3 text-sm font-bold text-white shadow-lg shadow-orange-600/30 transition hover:shadow-xl hover:shadow-orange-600/40 active:scale-[0.98]">
              {isRegister ? "Create Account" : "Login"}
            </button>
            {status && <p className="text-center text-xs font-semibold text-amber-400">{status}</p>}
            {error && <p className="text-center text-xs font-semibold text-red-400">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { api } from "../lib/api";

export default function Search() {
  const { user } = useAuthStore();
  const [mentorQuery, setMentorQuery] = useState("");
  const [ventureQuery, setVentureQuery] = useState("");
  const [mentors, setMentors] = useState<any[]>([]);
  const [ventures, setVentures] = useState<any[]>([]);
  const [searchingMentors, setSearchingMentors] = useState(false);
  const [searchingVentures, setSearchingVentures] = useState(false);

  const searchMentors = async () => {
    if (!mentorQuery.trim()) return;
    setSearchingMentors(true);
    try {
      const data = await api.mentors.search(mentorQuery);
      setMentors(data.mentors);
    } catch { setMentors([]); }
    setSearchingMentors(false);
  };

  const searchVentures = async () => {
    if (!ventureQuery.trim()) return;
    setSearchingVentures(true);
    try {
      const data = await api.ventures.list(ventureQuery);
      setVentures(data.ventures);
    } catch { setVentures([]); }
    setSearchingVentures(false);
  };

  const role = user?.role;

  return (
    <div className="animate-fade-in">
      <div className="mb-6 border-b border-gray-800 pb-4 text-center">
        <h1 className="text-3xl font-black text-white">Search</h1>
        <p className="mt-1 text-sm text-gray-500">Find mentors or explore ventures across the platform.</p>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 lg:grid-cols-2">
        {(role === "founder" || role === "admin") && (
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Find Mentors</h2>
            <div className="flex gap-2">
              <input value={mentorQuery} onChange={e => setMentorQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchMentors()}
                placeholder="Search by name, email, product, AI, fundraising"
                className="flex-1 rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm outline-none focus:border-orange-500" />
              <button onClick={searchMentors} disabled={searchingMentors}
                className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800">
                {searchingMentors ? "..." : "Search"}
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {mentors.length === 0 && <p className="text-xs text-gray-500">No mentors found. Try a broader search.</p>}
              {mentors.map((m: any) => (
                <div key={m.id} className="rounded-lg border border-gray-800 border-l-4 border-l-orange-500/40 bg-gray-900/30 p-4">
                  <h3 className="font-bold text-white">{m.name}</h3>
                  <p className="text-xs text-gray-500">{m.email}</p>
                  <span className="mt-2 inline-block rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-bold text-orange-400">{m.expertise || "General startup support"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(role === "mentor" || role === "admin") && (
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Find Ventures</h2>
            <div className="flex gap-2">
              <input value={ventureQuery} onChange={e => setVentureQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchVentures()}
                placeholder="Search by sector, stage, founder, customer, problem"
                className="flex-1 rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm outline-none focus:border-orange-500" />
              <button onClick={searchVentures} disabled={searchingVentures}
                className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800">
                {searchingVentures ? "..." : "Search"}
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {ventures.length === 0 && <p className="text-xs text-gray-500">No ventures found. Try searching by stage, sector, founder, or customer.</p>}
              {ventures.map((v: any) => (
                <div key={v.id} className="rounded-lg border border-gray-800 border-l-4 border-l-orange-500/40 bg-gray-900/30 p-4">
                  <h3 className="font-bold text-white">{v.name}</h3>
                  <p className="text-xs text-gray-500">{v.problem?.slice(0, 120)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-bold text-orange-400">{v.stage}</span>
                    <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-bold text-orange-400">{v.sector}</span>
                    <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-bold text-orange-400">{v.owner_name || v.founder}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { api } from "../lib/api";

const roleCards: Record<string, Array<{ label: string; detail: string }>> = {
  founder: [
    { label: "Discover", detail: "Customer pain, market size, alternatives" },
    { label: "Validate", detail: "Experiments, interviews, proof" },
    { label: "Launch", detail: "MVP, early users, traction" },
    { label: "Fund", detail: "Pitch, grants, investor readiness" },
  ],
  mentor: [
    { label: "Review", detail: "Study founder ventures and identify key risks" },
    { label: "Advise", detail: "Suggest experiments, milestones, and customer evidence" },
    { label: "Match", detail: "Connect founders with programs, experts, and funders" },
    { label: "Track", detail: "Follow venture progress across stages" },
  ],
  admin: [
    { label: "Manage users", detail: "View founder, mentor, and admin accounts" },
    { label: "Monitor ventures", detail: "See all platform venture profiles" },
    { label: "Coordinate mentors", detail: "Route ventures to the right expertise" },
    { label: "Govern platform", detail: "Keep roles and workflows organized" },
  ],
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data: venturesData, isLoading } = useQuery({
    queryKey: ["ventures"],
    queryFn: () => api.ventures.list(),
  });

  const ventures = venturesData?.ventures || [];
  const cards = roleCards[user?.role || "founder"];

  const stageCounts = ventures.reduce((acc: Record<string, number>, v: any) => {
    acc[v.stage] = (acc[v.stage] || 0) + 1;
    return acc;
  }, {});
  const topStage = Object.entries(stageCounts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "Idea";

  return (
    <div>
      <div className="mb-6 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-black text-white font-heading">
          {user?.role === "mentor" ? "Mentor" : user?.role === "admin" ? "Admin" : "Founder"} Command Center
        </h1>
        <p className="mt-1 text-sm text-gray-500">Your venture platform overview</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 animate-fade-in">
        <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 p-5 hover:border-orange-600/50 transition-all duration-300">
          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-orange-500 to-orange-400" />
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Portfolio</p>
          <p className="text-4xl font-black text-orange-500">{ventures.length}</p>
          <p className="mt-1 text-xs text-gray-600">ventures tracked</p>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-orange-500 to-orange-400" />
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Validation</p>
          <p className="text-4xl font-black text-orange-500">{venturesData?.ventures?.[0] ? "--" : "--"}</p>
          <p className="mt-1 text-xs text-gray-600">latest validation score</p>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-orange-500 to-orange-400" />
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Stage Focus</p>
          <p className="text-4xl font-black text-orange-500">{topStage}</p>
          <p className="mt-1 text-xs text-gray-600">dominant stage</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-slide-up">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Portfolio</h2>
          </div>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-lg bg-gray-800" />)}
            </div>
          ) : ventures.length === 0 ? (
            <div className="rounded-lg border border-gray-800 p-4">
              <h3 className="font-bold text-white">No ventures yet</h3>
              <p className="mt-1 text-xs text-gray-500">
                {user?.role === "founder" ? "Create your first venture profile to activate the platform." : "No founder ventures are available for review yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {ventures.map((v: any) => (
                <div key={v.id} className="rounded-lg border border-gray-800 border-l-4 border-l-orange-500/40 bg-gray-900/30 p-4 transition hover:border-l-orange-500">
                  <h3 className="font-bold text-white">{v.name}</h3>
                  <p className="mt-1 text-xs text-gray-500">{v.problem?.slice(0, 150)}...</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-bold text-orange-400">{v.stage}</span>
                    <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-bold text-orange-400">{v.sector}</span>
                    <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-bold text-orange-400">{v.traction}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Quick Actions</h2>
          <div className="space-y-2">
            {cards.map(card => (
              <div key={card.label} className="rounded-lg border border-gray-800 border-l-4 border-l-orange-500/40 bg-gray-900/30 p-4 transition hover:translate-x-1">
                <strong className="text-sm text-white">{card.label}</strong>
                <p className="mt-1 text-xs text-gray-500">{card.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <a href="/api/v1/reports/export?type=platform" target="_blank"
              className="flex items-center justify-center rounded-lg border border-gray-700 p-3 text-xs font-semibold text-gray-400 transition hover:border-orange-500 hover:text-orange-500">
              Export Platform Report
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import Comments from "../components/Comments";

export default function VentureBuilder() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", founder: "", sector: "", stage: "Idea", problem: "", solution: "", customer: "", traction: "", goals: "" });
  const [status, setStatus] = useState("");
  const [similarVenture, setSimilarVenture] = useState<any>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { data } = useQuery({
    queryKey: ["ventures"],
    queryFn: () => api.ventures.list(),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.ventures.create(data),
    onSuccess: () => {
      setStatus("Venture saved to the database.");
      setForm({ name: "", founder: "", sector: "", stage: "Idea", problem: "", solution: "", customer: "", traction: "", goals: "" });
      setSimilarVenture(null);
      queryClient.invalidateQueries({ queryKey: ["ventures"] });
    },
    onError: async (error: any, variables) => {
      try {
        const res = await fetch("/api/v1/ventures", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(variables) });
        const data = await res.json();
        if (data.similarVenture) {
          setSimilarVenture(data.similarVenture);
          setStatus("A similar venture already exists on the platform.");
        } else {
          setStatus(data.error || error.message);
        }
      } catch {
        setStatus(error.message);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Saving...");
    setSimilarVenture(null);
    mutation.mutate(form);
  };

  const ventures = data?.ventures || [];

  return (
    <div>
      <div className="mb-6 border-b border-gray-800 pb-4 text-center">
        <h1 className="text-3xl font-black text-white font-heading">Build a Venture Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Save startup details, then send them to AI validation.</p>
      </div>

      <div className="mx-auto max-w-2xl animate-fade-in">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-800 bg-gray-900/50 p-6" ref={formRef}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400">Venture Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400">Founder</label>
              <input value={form.founder} onChange={e => setForm({ ...form, founder: e.target.value })} required
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm outline-none focus:border-orange-500" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400">Sector</label>
              <input value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} required
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400">Stage</label>
              <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm outline-none focus:border-orange-500">
                {["Idea", "Prototype", "MVP", "Pilot", "Revenue"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400">Problem</label>
            <textarea value={form.problem} onChange={e => setForm({ ...form, problem: e.target.value })} required rows={3}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm outline-none focus:border-orange-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400">Solution</label>
            <textarea value={form.solution} onChange={e => setForm({ ...form, solution: e.target.value })} required rows={3}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm outline-none focus:border-orange-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400">Target Customer</label>
            <textarea value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} required rows={2}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm outline-none focus:border-orange-500" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400">Traction</label>
              <input value={form.traction} onChange={e => setForm({ ...form, traction: e.target.value })} required
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400">Next Goal</label>
              <input value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} required
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm outline-none focus:border-orange-500" />
            </div>
          </div>
          <button type="submit" disabled={mutation.isPending}
            className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-red-600 p-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl active:scale-[0.98] disabled:opacity-50">
            {mutation.isPending ? "Saving..." : "Save Venture"}
          </button>
          {status && <p className="text-center text-sm font-semibold text-amber-400">{status}</p>}
          {similarVenture && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              <p className="font-bold">Similar venture found: {similarVenture.name}</p>
              <p className="mt-1 text-amber-200/80">Review the existing profile before creating a duplicate.</p>
            </div>
          )}
        </form>

        {ventures.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Your Ventures</h2>
            <div className="space-y-2">
              {ventures.map((v: any) => (
                <div key={v.id}>
                  <div className="flex items-center justify-between rounded-lg border border-gray-800 border-l-4 border-l-orange-500/40 bg-gray-900/30 p-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{v.name}</h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-bold text-orange-400">{v.stage}</span>
                        <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-bold text-orange-400">{v.sector}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={`/api/v1/reports/export?type=validation&ventureId=${v.id}`} target="_blank"
                        className="rounded border border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-400 transition hover:border-orange-500 hover:text-orange-500">
                        Export Report
                      </a>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Comments ventureId={v.id} />
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

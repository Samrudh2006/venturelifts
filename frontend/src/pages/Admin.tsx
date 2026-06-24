import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";

export default function Admin() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(s => s.user);
  const [activeTab, setActiveTab] = useState("users");
  const [statusMsg, setStatusMsg] = useState("");

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.users.list(),
  });

  const { data: venturesData } = useQuery({
    queryKey: ["all-ventures"],
    queryFn: () => api.ventures.all(),
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => api.users.analytics(),
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => api.users.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["users"] }); setStatusMsg("User deleted."); },
    onError: (e: any) => setStatusMsg(e.message),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => api.users.updateRole(id, role),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["users"] }); setStatusMsg("Role updated."); },
    onError: (e: any) => setStatusMsg(e.message),
  });

  const deleteVenture = useMutation({
    mutationFn: (id: number) => api.ventures.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["all-ventures"] }); setStatusMsg("Venture deleted."); },
    onError: (e: any) => setStatusMsg(e.message),
  });

  const users = usersData?.users || [];
  const ventures = venturesData?.ventures || [];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-black text-white font-heading">Admin Panel</h1>
        <p className="mt-1 text-sm text-gray-500">Full platform management, analytics, and user control.</p>
      </div>

      {statusMsg && (
        <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2 text-sm text-amber-400">{statusMsg}</div>
      )}

      <div className="mb-6 flex gap-2">
        {["users", "ventures", "analytics"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-bold capitalize transition ${
              activeTab === tab ? "bg-orange-500 text-white" : "border border-gray-700 text-gray-400 hover:border-orange-500 hover:text-orange-500"
            }`}>{tab}</button>
        ))}
      </div>

      {activeTab === "users" && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">User Management</h2>
            <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-bold text-orange-400">{users.length} users</span>
          </div>
          {usersLoading ? (
            <div className="animate-pulse space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-16 rounded-lg bg-gray-800" />)}</div>
          ) : (
            <div className="space-y-2">
              {users.map((u: any) => (
                <div key={u.id} className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-white">{u.name}</h3>
                      <p className="text-xs text-gray-500">{u.email}</p>
                      {u.expertise && <p className="text-xs text-gray-600">{u.expertise}</p>}
                      <p className="text-[10px] text-gray-700">Sessions: {u._count?.sessions || 0} | Ventures: {u._count?.ventures || 0} | Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={u.role} onChange={e => updateRole.mutate({ id: u.id, role: e.target.value })}
                        className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs font-bold uppercase text-gray-300 outline-none">
                        <option value="founder">Founder</option>
                        <option value="mentor">Mentor</option>
                        <option value="admin">Admin</option>
                      </select>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                        u.role === "admin" ? "bg-red-500/15 text-red-400" : u.role === "mentor" ? "bg-blue-500/15 text-blue-400" : "bg-green-500/15 text-green-400"
                      }`}>{u.role}</span>
                      {currentUser?.id !== u.id && (
                        <button onClick={() => { if (confirm("Delete this user?")) deleteUser.mutate(u.id); }}
                          className="rounded border border-red-800 px-2 py-1 text-xs font-bold text-red-400 transition hover:bg-red-900/30">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "ventures" && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Venture Management</h2>
            <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-bold text-orange-400">{ventures.length} ventures</span>
          </div>
          <div className="space-y-2">
            {ventures.map((v: any) => (
              <div key={v.id} className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white">{v.name}</h3>
                    <p className="text-xs text-gray-500">By {v.owner_name || v.founder} ({v.owner_email})</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold text-orange-400">{v.stage}</span>
                      <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold text-orange-400">{v.sector}</span>
                      <span className="rounded-full bg-gray-700 px-2 py-0.5 text-[10px] font-bold text-gray-400">{v.report_count} reports</span>
                    </div>
                  </div>
                  <button onClick={() => { if (confirm("Delete this venture?")) deleteVenture.mutate(v.id); }}
                    className="rounded border border-red-800 px-3 py-1 text-xs font-bold text-red-400 transition hover:bg-red-900/30">
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {ventures.length === 0 && <p className="text-sm text-gray-500">No ventures on the platform yet.</p>}
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div>
          {analytics ? (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
                  <p className="text-3xl font-black text-orange-500">{analytics.totalUsers}</p>
                  <p className="text-xs font-bold uppercase text-gray-500">Users</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
                  <p className="text-3xl font-black text-orange-500">{analytics.totalVentures}</p>
                  <p className="text-xs font-bold uppercase text-gray-500">Ventures</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
                  <p className="text-3xl font-black text-orange-500">{analytics.totalReports}</p>
                  <p className="text-xs font-bold uppercase text-gray-500">Reports</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
                  <p className="text-3xl font-black text-orange-500">{analytics.totalComments}</p>
                  <p className="text-xs font-bold uppercase text-gray-500">Comments</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Users by Role</h3>
                  <div className="space-y-2">
                    {analytics.roleCounts.map((r: any) => (
                      <div key={r.role} className="flex items-center justify-between">
                        <span className="text-sm capitalize text-gray-400">{r.role}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 rounded-full bg-orange-500/30" style={{ width: `${Math.min(100, (r.count / analytics.totalUsers) * 100)}px` }} />
                          <span className="text-sm font-bold text-white">{r.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Ventures by Stage</h3>
                  <div className="space-y-2">
                    {analytics.stageCounts.map((s: any) => (
                      <div key={s.stage} className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">{s.stage}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 rounded-full bg-red-500/30" style={{ width: `${Math.min(100, (s.count / analytics.totalVentures) * 100)}px` }} />
                          <span className="text-sm font-bold text-white">{s.count}</span>
                        </div>
                      </div>
                    ))}
                    {analytics.stageCounts.length === 0 && <p className="text-sm text-gray-500">No ventures yet.</p>}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 lg:col-span-2">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Top Sectors</h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {analytics.sectorCounts.map((s: any) => (
                      <div key={s.sector} className="rounded-lg border border-gray-800 bg-gray-900/30 p-3 text-center">
                        <p className="text-lg font-black text-orange-500">{s.count}</p>
                        <p className="text-xs text-gray-500 truncate">{s.sector}</p>
                      </div>
                    ))}
                    {analytics.sectorCounts.length === 0 && <p className="text-sm text-gray-500 col-span-full">No ventures yet.</p>}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="animate-pulse space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-800" />)}</div>
          )}
        </div>
      )}
    </div>
  );
}

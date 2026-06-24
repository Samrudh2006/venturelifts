import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function SessionsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => api.sessions.list(),
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: number) => api.sessions.revoke(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const sessions = data?.sessions || [];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-black text-white">Session Management</h1>
        <p className="mt-1 text-sm text-gray-500">View and manage your active sessions across devices.</p>
      </div>

      <div className="mx-auto max-w-2xl">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2].map(i => <div key={i} className="h-20 rounded-lg bg-gray-800" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-lg border border-gray-800 p-6 text-center">
            <p className="text-sm text-gray-500">No active sessions found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s: any) => (
              <div key={s.id} className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{s.userAgent || "Unknown device"}</p>
                    <p className="mt-1 text-xs text-gray-500">IP: {s.ipAddress || "Unknown"}</p>
                    <div className="mt-2 flex gap-3 text-xs text-gray-600">
                      <span>Created: {new Date(s.createdAt).toLocaleDateString()}</span>
                      <span>Expires: {new Date(s.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.revokedAt ? (
                      <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-400">Revoked</span>
                    ) : (
                      <>
                        <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-bold text-green-400">Active</span>
                        <button onClick={() => revokeMutation.mutate(s.id)}
                          className="rounded-lg border border-red-800 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-900/30">
                          Revoke
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

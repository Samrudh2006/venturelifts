import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function Billing() {
  const { data, isLoading } = useQuery({ queryKey: ["billing-plans"], queryFn: () => api.billing.plans() });
  const plans = data?.plans || [];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-black text-white font-heading">Billing & Plans</h1>
        <p className="mt-1 text-sm text-gray-500">Choose the right plan for your venture journey.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-800" />)}
        </div>
      ) : (
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan: any) => (
            <div key={plan.id} className={`relative rounded-xl border p-6 transition hover:border-orange-500/50 ${
              plan.recommended ? "border-orange-500 bg-orange-500/5" : "border-gray-800 bg-gray-900/50"
            }`}>
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Recommended
                </div>
              )}
              <h2 className="mb-2 text-lg font-black text-white">{plan.name}</h2>
              <p className="mb-4 text-3xl font-black text-white">
                ${plan.price}<span className="text-sm font-normal text-gray-500">/mo</span>
              </p>
              <ul className="mb-6 space-y-2">
                {plan.features.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                    <span className="mt-0.5 text-orange-400">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button disabled={plan.price === 0}
                className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-red-600 p-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                {plan.price === 0 ? "Current Plan" : "Upgrade"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

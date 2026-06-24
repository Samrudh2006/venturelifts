import { Link } from "react-router-dom";
import Logo from "../components/Logo";

const features = [
  { title: "AI Validation", desc: "Score ideas against market size, customer pain, differentiation, timing, and execution risk before you spend months building." },
  { title: "Build Workspace", desc: "Turn validation into milestones, assumptions, experiments, and launch tasks your team can track from idea to revenue." },
  { title: "Mentor Network", desc: "Connect with the right operator, investor, or domain expert using sector, stage, and need-based matching." },
  { title: "Founder Intelligence", desc: "Create investor-ready summaries, PDF reports, and evidence-backed narratives from your venture data." },
];

const stats = [
  ["128", "validated ideas"],
  ["56", "active ventures"],
  ["235", "mentor sessions"],
  ["98%", "match quality"],
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-gray-950 text-gray-100 venturelift-platform-bg">
      <header className="relative z-20 border-b border-white/10 bg-gray-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Logo markClassName="h-12 w-12" wordmarkClassName="text-base" showTagline />
          <div className="flex items-center gap-3">
            <Link to="/login" className="rounded-lg border border-gray-700 px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-300 transition hover:border-orange-500 hover:text-orange-400">Login</Link>
            <Link to="/login?register=1" className="rounded-lg bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-orange-600/30 transition hover:shadow-xl">Get Started</Link>
          </div>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <div className="relative z-10 animate-slide-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">AI-powered venture intelligence</div>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.98] font-heading md:text-7xl">
            Empowering founders.<br />
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text text-transparent">Elevating ventures.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-gray-300">VentureLift brings idea validation, guided venture building, mentor connections, and growth insights into one focused platform so founders can make smarter decisions faster.</p>
          <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.26em] text-gray-300">
            {['Validate', 'Build', 'Connect', 'Grow'].map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2">{item}</span>)}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/login?register=1" className="rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-orange-600/30 transition hover:shadow-xl hover:shadow-orange-600/40 active:scale-[0.98]">Start Free</Link>
            <Link to="/login" className="rounded-xl border border-gray-700 bg-gray-950/40 px-8 py-4 text-sm font-bold text-gray-200 transition hover:border-orange-500 hover:text-orange-400">Explore Platform</Link>
          </div>
        </div>

        <div className="relative min-h-[560px] animate-fade-in">
          <div className="absolute inset-0 rounded-[2rem] border border-white/10 bg-gray-950/35 shadow-2xl shadow-orange-950/30 backdrop-blur-sm" />
          <div className="venturelift-hero-art absolute inset-0 rounded-[2rem]" />
          <div className="absolute left-6 right-6 top-8 rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-gray-300">Venture analytics</p>
            <div className="mt-5 h-28 rounded-xl border border-orange-500/20 bg-[linear-gradient(135deg,rgba(251,85,0,.14),rgba(15,23,42,.25))] p-4"><div className="h-full rounded-lg venturelift-chart" /></div>
            <div className="mt-5 grid grid-cols-4 gap-3">{stats.map(([value,label]) => <div key={label}><div className="text-2xl font-bold text-white">{value}</div><div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div></div>)}</div>
          </div>
          <div className="absolute bottom-8 left-6 right-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-md"><p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-300">AI insights</p><p className="mt-4 text-sm text-gray-300">Market opportunity <span className="font-bold text-orange-400">High</span></p><p className="mt-2 text-sm text-gray-300">Risk level <span className="font-bold text-orange-400">Medium</span></p></div>
            <div className="rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-md"><p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-300">Trending sectors</p>{['FinTech','HealthTech','EdTech'].map((x,i)=><div key={x} className="mt-3 flex items-center gap-3 text-sm text-gray-300"><span className="w-20">{x}</span><span className="h-2 flex-1 rounded-full bg-gray-800"><span className="block h-2 rounded-full bg-orange-500" style={{width:`${88-i*16}%`}} /></span></div>)}</div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-20">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <div key={feature.title} className="group rounded-2xl border border-white/10 bg-gray-900/55 p-6 shadow-xl shadow-black/20 backdrop-blur transition hover:-translate-y-1 hover:border-orange-500/50 hover:bg-gray-900/80">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-orange-400/20 bg-gradient-to-br from-orange-500 to-red-600 text-sm font-black text-white shadow-lg shadow-orange-700/20">0{i + 1}</div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-white">{feature.title}</h3>
              <p className="text-sm leading-7 text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>


      </footer>
    </div>
  );
}

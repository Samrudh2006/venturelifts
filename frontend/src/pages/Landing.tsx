import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 font-black text-white text-sm">
              VL
            </div>
            <span className="text-sm font-bold tracking-widest font-heading">VENTURELIFT</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"
              className="rounded-lg border border-gray-700 px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-300 transition hover:border-orange-500 hover:text-orange-500">
              Login
            </Link>
            <Link to="/login?register=1"
              className="rounded-lg bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-lg transition hover:shadow-xl">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-24 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold text-orange-400">
          Entrepreneurial Support Platform
        </div>
        <h1 className="mx-auto max-w-4xl text-5xl font-black leading-tight font-heading md:text-7xl">
          Validate Your Startup<br />
          <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Accelerate Your Growth</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500">
          VentureLift helps founders validate ideas, connect with mentors, generate AI-powered insights, and track progress from concept to launch.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link to="/login?register=1"
            className="rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-orange-600/30 transition hover:shadow-xl hover:shadow-orange-600/40 active:scale-[0.98]">
            Start Free
          </Link>
          <Link to="/login"
            className="rounded-xl border border-gray-700 px-8 py-4 text-sm font-bold text-gray-300 transition hover:border-orange-500 hover:text-orange-500">
            Sign In
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { title: "AI Validation", desc: "Get instant AI-powered feedback on your venture idea, problem statement, and market fit with detailed scoring and actionable insights." },
            { title: "Mentor Matching", desc: "Find experienced mentors by expertise, sector, or stage using fuzzy search and smart matching algorithms." },
            { title: "Progress Tracking", desc: "Track your venture through Idea → Prototype → MVP → Pilot → Revenue stages with validation reports at every step." },
            { title: "Comment Threads", desc: "Collaborate with mentors and peers through threaded comments on each venture profile with edit and reply support." },
            { title: "PDF Reports", desc: "Generate professional PDF validation reports and platform overviews to share with stakeholders and investors." },
            { title: "Admin Control", desc: "Full platform management with user administration, venture oversight, role management, and analytics dashboards." },
          ].map((feature, i) => (
            <div key={i} className="group rounded-xl border border-gray-800 bg-gray-900/50 p-6 transition hover:border-orange-500/50 hover:bg-gray-900/80">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-sm font-black text-white">
                {i + 1}
              </div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-800 py-8 text-center text-xs text-gray-600">
        VentureLift &copy; {new Date().getFullYear()} &mdash; Startup Validation Platform
      </footer>
    </div>
  );
}

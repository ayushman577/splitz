import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full bg-[#101317] text-[#F4F7FA] flex flex-col justify-between p-6 sm:p-10 md:p-14 selection:bg-[#3B82F6] selection:text-white overflow-hidden">

      {/* Subtle Electric Blue ambient spotlight */}
      <div className="absolute top-1/4 -right-16 w-[500px] h-[500px] bg-[#3B82F6]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full flex items-center justify-between max-w-6xl mx-auto">

        <Link
          href="/"
          className="group font-['Inter'] font-bold text-2xl tracking-tight text-[#F4F7FA] transition-transform duration-200 active:scale-95"
        >
          <span className="bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#A78BFA] bg-clip-text text-transparent transition-all duration-200 group-hover:opacity-90">
                            SplitZ.
                        </span>
        </Link>

        <nav className="flex items-center gap-3">

          {/* Log In */}
          <Link
            href="/login"
            className="font-['Inter'] font-medium text-sm px-4 py-2 rounded-xl text-[#AAB2BD] hover:text-[#F4F7FA] hover:bg-[#343A40]/30 active:scale-95 transition-all duration-200"
          >
            Log In
          </Link>

          {/* Sign Up */}
          <Link
            href="/register"
            className="font-['Inter'] font-medium text-sm px-5 py-2.5 rounded-xl bg-[#3B82F6] text-white hover:bg-[#2563EB] hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(59,130,246,0.45)] active:translate-y-0 active:scale-95 transition-all duration-200"
          >
            Sign Up
          </Link>

        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 my-12">

        <div className="max-w-3xl mx-auto flex flex-col items-center">

          {/* Headline */}
          <h1 className="font-['Inter'] font-bold text-4xl sm:text-6xl md:text-7xl leading-[1.1] tracking-tight text-[#F4F7FA]">
            Split expenses. <br />
            <span className="text-[#3B82F6]">Settle easily!</span>
          </h1>

          

          {/* Subtitle */}
          <p className="mt-5 font-['Inter'] text-base sm:text-lg max-w-md text-[#AAB2BD] leading-relaxed">
            Track shared group tabs, calculate balances automatically, and
            clear debts without the hassle.
          </p>

          {/* Hero Action Buttons */}
          <div className="mt-8 flex flex-row items-center gap-4">

            {/* Log In */}
            <Link
              href="/login"
              className="font-['Inter'] font-medium text-sm sm:text-base px-7 py-3 rounded-xl border border-[#343A40] bg-[#343A40]/30 text-[#F4F7FA] hover:bg-[#343A40]/70 hover:border-[#AAB2BD]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200"
            >
              Log In
            </Link>

            {/* Get Started */}
            <Link
              href="/register"
              className="group relative overflow-hidden font-['Inter'] font-medium text-sm sm:text-base px-7 py-3 rounded-xl bg-[#3B82F6] text-white hover:bg-[#2563EB] hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(59,130,246,0.45)] active:translate-y-0 active:scale-95 transition-all duration-200"
            >

              {/* Light beam sheen animation */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

              <span className="relative inline-flex items-center gap-1.5">
                Get Started
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                  →
                </span>
              </span>

            </Link>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-4 border-t border-[#343A40]/60 max-w-6xl mx-auto">
        <p className="font-['Inter'] text-xs text-[#AAB2BD]/70 tracking-wide">
          © 2026 Splitz. All rights reserved.
        </p>
      </footer>

    </main>
  );
}
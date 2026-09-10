export default function DashboardLoading() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#101317] font-['Inter'] text-[#F4F7FA]">
      {/* Soft ambient glow */}
      <div className="pointer-events-none fixed left-1/2 top-[-120px] h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[#3B82F6]/5 blur-[180px]" />

      {/* Header skeleton */}
      <header className="sticky top-0 z-40 border-b border-[#343A40]/50 bg-[#101317]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="h-7 w-24 rounded-lg bg-[#181C21] animate-pulse" />
          <div className="h-9 w-9 rounded-full bg-[#181C21] animate-pulse" />
        </div>
      </header>

      {/* Main skeleton canvas */}
      <main className="relative z-10 mx-auto max-w-6xl space-y-6 px-4 py-6 sm:space-y-8 sm:py-10 sm:px-6 lg:px-8 animate-pulse">
        {/* Banner skeleton */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <div className="h-5 w-24 rounded-full bg-[#181C21]" />
            <div className="h-8 w-60 rounded-xl bg-[#181C21]" />
            <div className="h-4 w-72 rounded-lg bg-[#181C21]/60" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <div className="h-11 w-full sm:w-32 rounded-xl bg-[#181C21]" />
            <div className="h-11 w-full sm:w-36 rounded-xl bg-[#181C21]" />
          </div>
        </div>

        {/* 3 Metric Cards skeleton */}
        <div className="grid gap-3.5 sm:grid-cols-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-2xl border border-[#343A40]/40 bg-[#14171C]/50 p-5"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 rounded bg-[#181C21]" />
                <div className="h-8 w-8 rounded-xl bg-[#181C21]" />
              </div>
              <div className="mt-5 h-8 w-32 rounded-lg bg-[#181C21]" />
              <div className="mt-5 h-3 w-40 rounded bg-[#181C21]/50" />
            </div>
          ))}
        </div>

        {/* Section skeleton */}
        <div className="h-80 rounded-2xl border border-[#343A40]/40 bg-[#14171C]/40" />
      </main>
    </div>
  );
}
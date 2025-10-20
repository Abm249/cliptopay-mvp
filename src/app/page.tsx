import Link from "next/link";

export default function Page(){
  return (
    <section className="grid items-center gap-8 md:grid-cols-2">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Connect creators and clippers. Pay for performance.</h1>
        <p className="mt-3 max-w-xl text-neutral-700">Creators post long-form content, clippers submit shorts, payouts are CPM-based with immutable ledger entries.</p>
        <div className="mt-6 flex gap-3">
          <Link className="rounded-xl bg-black px-4 py-2.5 text-white" href="/dashboard">Open App</Link>
          <Link className="rounded-xl ring-1 ring-neutral-300 px-4 py-2.5" href="/leaderboard">Leaderboard</Link>
        </div>
      </div>
      <div className="rounded-2xl bg-white ring-1 ring-neutral-200 p-6">
        <div className="text-sm">Demo seeded project:</div>
        <div className="mt-2 text-2xl font-semibold">Podcast #24: Habits that stick</div>
        <div className="text-sm text-neutral-600 mt-1">CPM: $12 · Max 3 clips · Tags: self-improvement, podcast, lifestyle</div>
      </div>
    </section>
  );
}

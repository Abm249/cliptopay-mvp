import { prisma } from "@/server/db";
import { auth } from "@/auth";

function jaccard(a: string[], b: string[]){
  const A = new Set(a); const B = new Set(b);
  const inter = [...A].filter(x=>B.has(x)).length;
  const uni = new Set([...A, ...B]).size || 1;
  return inter/uni;
}

export default async function Leaderboard(){
  const session = await auth();
  const [clips, users] = await Promise.all([
    prisma.clip.findMany({ include: { clipper: true } }),
    prisma.user.findMany()
  ]);

  // aggregate views/earnings per clipper
  const stat = new Map<string, { name: string|null, email:string|null, views:number, earnings:number, niches:string[], reputation:number }>();
  for(const c of clips){
    const u = c.clipper;
    if(!stat.has(u.id)) stat.set(u.id, { name:u.name, email:u.email, views:0, earnings:0, niches:u.niches, reputation:u.reputation });
    const s = stat.get(u.id)!;
    s.views += c.views;
    s.earnings += c.earnings;
  }
  const rows = [...stat.entries()].map(([id, s])=>({ id, ...s })).sort((a,b)=> b.views - a.views);

  // niche match if logged in
  let matches: { id:string, score:number }[] = [];
  if(session?.user?.niches?.length){
    matches = rows.map(r=>({ id:r.id, score: jaccard(session.user!.niches!, r.niches) })).sort((a,b)=>b.score-a.score).slice(0,5);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Leaderboard</h1>
        <p className="text-neutral-700">Top clippers ranked by total views (all time).</p>
      </div>
      <div className="rounded-2xl bg-white ring-1 ring-neutral-200 p-5">
        <div className="grid grid-cols-5 text-sm font-medium text-neutral-500">
          <div>Clipper</div><div>Views</div><div>Earnings</div><div>Reputation</div><div>Niches</div>
        </div>
        <div className="mt-2 divide-y">
          {rows.map((r,i)=>(
            <div key={r.id} className="grid grid-cols-5 gap-2 py-2 text-sm">
              <div className="font-medium">#{i+1} {r.name || r.email}</div>
              <div>{r.views.toLocaleString()}</div>
              <div>${r.earnings.toFixed(2)}</div>
              <div>{r.reputation}</div>
              <div className="truncate">{r.niches.join(", ")}</div>
            </div>
          ))}
        </div>
      </div>

      {session?.user?.niches?.length ? (
        <div className="rounded-2xl bg-white ring-1 ring-neutral-200 p-5">
          <div className="text-lg font-semibold">Best niche matches for you</div>
          <div className="mt-2 text-sm text-neutral-600">Based on Jaccard similarity of niches</div>
          <div className="mt-3 divide-y">
            {matches.map((m)=>{
              const r = rows.find(x=>x.id===m.id)!;
              return (
                <div key={m.id} className="py-2">
                  <div className="font-medium">{r.name || r.email}</div>
                  <div className="text-xs text-neutral-600">Match score: {(m.score*100).toFixed(0)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

import { auth } from "@/auth";
import { prisma } from "@/server/db";
import Link from "next/link";
import { revalidatePath } from "next/cache";

async function createProject(formData: FormData){
  "use server";
  const session = await auth();
  if(!session?.user?.id) return;
  const title = String(formData.get("title")||"Untitled");
  const brief = String(formData.get("brief")||"");
  const sourceUrl = String(formData.get("sourceUrl")||"");
  const cpmUSD = Number(formData.get("cpmUSD")||10);
  const maxClips = Number(formData.get("maxClips")||2);
  const tags = String(formData.get("tags")||"").split(",").map(s=>s.trim()).filter(Boolean);
  await prisma.project.create({ data: {
    creatorId: session.user.id,
    title, brief, sourceUrl, cpmUSD, maxClips, tags, status: "OPEN"
  }});
  revalidatePath("/dashboard");
}

async function submitClip(formData: FormData){
  "use server";
  const session = await auth();
  if(!session?.user?.id) return;
  const projectId = String(formData.get("projectId"));
  const url = String(formData.get("url"));
  const platform = String(formData.get("platform")||"Other");
  const views = Number(formData.get("views")||0);

  // compute earnings (gross - 12% fee)
  const project = await prisma.project.findUnique({ where: { id: projectId }});
  if(!project) return;
  const gross = (views/1000) * project.cpmUSD;
  const net = gross * 0.88;

  const clip = await prisma.clip.create({ data: {
    projectId, clipperId: session.user.id, url, platform, views, earnings: net
  }});

  // append ledger entry
  const prev = await prisma.payoutLedger.findFirst({ where: { clipId: clip.id }, orderBy: { createdAt: "desc" }});
  const prevHash = prev?.entryHash || null;
  const payload = JSON.stringify({ clipId: clip.id, views, gross, net, ts: Date.now() });
  const entryHash = require("crypto").createHash("sha256").update((prevHash||"") + payload).digest("hex");
  await prisma.payoutLedger.create({ data: {
    clipId: clip.id, amountUSD: net, event: "CALCULATED", prevHash, entryHash
  }});

  revalidatePath("/dashboard");
}

async function approveClip(formData: FormData){
  "use server";
  const session = await auth();
  const clipId = String(formData.get("clipId"));
  const clip = await prisma.clip.findUnique({ where: { id: clipId }, include: { project: true } });
  if(!clip || !session?.user?.id || clip.project.creatorId !== session.user.id) return;
  await prisma.clip.update({ where: { id: clipId }, data: { approved: true } });
  await prisma.approval.create({ data: { projectId: clip.projectId, clipId: clip.id, approverId: session.user.id, status: "APPROVED" }});
  revalidatePath("/dashboard");
}

async function raiseDispute(formData: FormData){
  "use server";
  const session = await auth();
  const clipId = String(formData.get("clipId"));
  const reason = String(formData.get("reason")||"");
  const clip = await prisma.clip.findUnique({ where: { id: clipId } });
  if(!clip || !session?.user?.id) return;
  await prisma.dispute.create({ data: { projectId: clip.projectId, clipId: clip.id, raisedById: session.user.id, reason } });
  revalidatePath("/dashboard");
}

export default async function Dashboard(){
  const session = await auth();
  if(!session?.user) return <div>Please <Link className="underline" href="/login">sign in</Link>.</div>;

  const [projects, myClips] = await Promise.all([
    prisma.project.findMany({ orderBy: { createdAt: "desc" }, include: { clips: true } }),
    prisma.clip.findMany({ where: { clipperId: session.user.id }, orderBy: { createdAt: "desc" }, include: { project: true } })
  ]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="space-y-4">
        <div className="rounded-2xl bg-white ring-1 ring-neutral-200 p-5">
          <div className="mb-3 text-lg font-semibold">Post a project (Creator)</div>
          <form action={createProject} className="grid gap-3">
            <input name="title" placeholder="Title" className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm" />
            <textarea name="brief" placeholder="Brief" className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm" rows={3} />
            <input name="sourceUrl" placeholder="Source URL" className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input name="cpmUSD" type="number" defaultValue={10} className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm" />
              <input name="maxClips" type="number" defaultValue={2} className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm" />
            </div>
            <input name="tags" placeholder="Tags (comma)" className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm" />
            <button className="rounded-xl bg-black px-4 py-2.5 text-white">Create</button>
          </form>
        </div>

        <div className="rounded-2xl bg-white ring-1 ring-neutral-200 p-5">
          <div className="mb-3 text-lg font-semibold">Open projects</div>
          <div className="space-y-3">
            {projects.map(p=> (
              <div key={p.id} className="rounded-xl border border-neutral-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{p.title}</div>
                  <span className="text-xs px-2 py-1 rounded-lg bg-neutral-100 ring-1 ring-neutral-200">{p.status}</span>
                </div>
                <div className="text-xs text-neutral-500 truncate">{p.sourceUrl}</div>
                <div className="grid grid-cols-3 gap-2 text-xs text-neutral-600 mt-2">
                  <div>CPM: ${p.cpmUSD}</div>
                  <div>Max clips: {p.maxClips}</div>
                  <div>Tags: {p.tags.join(", ")}</div>
                </div>
                <form action={submitClip} className="mt-3 grid grid-cols-4 gap-2">
                  <input type="hidden" name="projectId" value={p.id} />
                  <input name="url" placeholder="Clip URL" className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm col-span-2" />
                  <input name="platform" placeholder="TikTok / Shorts / Reels" className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm" />
                  <input name="views" type="number" placeholder="Views" className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm" />
                  <div className="col-span-4"><button className="rounded-xl ring-1 ring-neutral-300 px-4 py-2.5">Submit clip</button></div>
                </form>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl bg-white ring-1 ring-neutral-200 p-5">
          <div className="mb-3 text-lg font-semibold">My submitted clips</div>
          <div className="space-y-3">
            {myClips.length === 0 && <div className="text-sm text-neutral-600">No clips yet.</div>}
            {myClips.map(c=> (
              <div key={c.id} className="rounded-xl border border-neutral-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <a className="truncate hover:underline" href={c.url} target="_blank">{c.url}</a>
                  <span className="text-xs px-2 py-1 rounded-lg bg-neutral-100 ring-1 ring-neutral-200">{c.approved ? "approved" : "pending"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-neutral-600 mt-2">
                  <div>Views: {c.views}</div>
                  <div>CPM: ${c.project.cpmUSD}</div>
                  <div>Earnings: ${c.earnings.toFixed(2)}</div>
                </div>
                <form action={raiseDispute} className="mt-2 flex gap-2">
                  <input type="hidden" name="clipId" value={c.id} />
                  <input name="reason" placeholder="Dispute reason" className="flex-1 rounded-xl border border-neutral-300 px-3 py-2.5 text-sm" />
                  <button className="rounded-xl ring-1 ring-neutral-300 px-4 py-2.5">Raise dispute</button>
                </form>
              </div>
            ))}
          </div>
        </div>

        <AdminApprovals />
      </section>
    </div>
  );
}

async function AdminApprovals(){
  const session = await auth();
  if(!session?.user) return null;
  const projects = await prisma.project.findMany({ where: { creatorId: session.user.id }, include: { clips: true } });
  if(projects.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white ring-1 ring-neutral-200 p-5">
      <div className="mb-3 text-lg font-semibold">Approvals (as creator)</div>
      <div className="space-y-3">
        {projects.flatMap(p=>p.clips).filter(c=>!c.approved).length === 0 && <div className="text-sm text-neutral-600">No pending approvals.</div>}
        {projects.flatMap(p=>p.clips).filter(c=>!c.approved).map(c=> (
          <form key={c.id} action={approveClip} className="flex items-center justify-between rounded-xl border border-neutral-200 p-3">
            <div className="text-sm">
              <div className="font-medium">Clip pending approval</div>
              <div className="text-neutral-600 text-xs">{c.url}</div>
            </div>
            <input type="hidden" name="clipId" value={c.id} />
            <button className="rounded-xl bg-black px-4 py-2.5 text-white">Approve</button>
          </form>
        ))}
      </div>
    </div>
  );
}

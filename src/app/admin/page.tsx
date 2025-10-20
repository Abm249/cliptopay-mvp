import { auth } from "@/auth";
import { prisma } from "@/server/db";
import { revalidatePath } from "next/cache";

async function resolveDispute(formData: FormData){
  "use server";
  const session = await auth();
  if(session?.user?.role !== "ADMIN") return;
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  await prisma.dispute.update({ where: { id }, data: { status: status === "RESOLVED" ? "RESOLVED" : "REJECTED" } });
  revalidatePath("/admin");
}

export default async function AdminPage(){
  const session = await auth();
  if(!session?.user || session.user.role !== "ADMIN") return <div>Forbidden.</div>;

  const [disputes, ledger] = await Promise.all([
    prisma.dispute.findMany({ orderBy: { createdAt: "desc" }, include: { clip: true } }),
    prisma.payoutLedger.findMany({ orderBy: { createdAt: "desc" }, take: 20 })
  ]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-2xl bg-white ring-1 ring-neutral-200 p-5">
        <div className="text-lg font-semibold mb-3">Open Disputes</div>
        <div className="space-y-3">
          {disputes.length === 0 && <div className="text-sm text-neutral-600">No disputes.</div>}
          {disputes.map(d=>(
            <form key={d.id} action={resolveDispute} className="rounded-xl border border-neutral-200 p-3 text-sm">
              <div className="font-medium">Clip: {d.clip.url}</div>
              <div className="text-neutral-600 text-xs">Reason: {d.reason}</div>
              <div className="text-xs mt-1">Status: {d.status}</div>
              <input type="hidden" name="id" value={d.id} />
              <div className="mt-2 flex gap-2">
                <button name="status" value="RESOLVED" className="rounded-xl bg-black px-3 py-1.5 text-white text-xs">Resolve</button>
                <button name="status" value="REJECTED" className="rounded-xl ring-1 ring-neutral-300 px-3 py-1.5 text-xs">Reject</button>
              </div>
            </form>
          ))}
        </div>
      </section>
      <section className="rounded-2xl bg-white ring-1 ring-neutral-200 p-5">
        <div className="text-lg font-semibold mb-3">Latest Payout Ledger (immutable)</div>
        <div className="space-y-2 text-xs">
          {ledger.map(l=> (
            <div key={l.id} className="rounded-lg bg-neutral-50 p-2">
              <div><span className="font-medium">Event:</span> {l.event}</div>
              <div>Amount: ${l.amountUSD.toFixed(2)}</div>
              <div>prevHash: <code className="break-all">{l.prevHash || "null"}</code></div>
              <div>entryHash: <code className="break-all">{l.entryHash}</code></div>
              <div className="text-neutral-500">{new Date(l.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

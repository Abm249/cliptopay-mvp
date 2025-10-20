import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main(){
  const user = await prisma.user.upsert({
    where: { email: "demo@clippay.dev" },
    update: {},
    create: { email: "demo@clippay.dev", name: "Demo Creator", role: "ADMIN", niches: ["fitness","podcast"] }
  });
  const clipper = await prisma.user.upsert({
    where: { email: "clipper@clippay.dev" },
    update: {},
    create: { email: "clipper@clippay.dev", name: "Top Clipper", niches: ["fitness","gaming"] }
  });
  await prisma.project.create({
    data: {
      creatorId: user.id,
      title: "Podcast #24: Habits that stick",
      brief: "Cut 2–3 shorts with strong hooks and big captions.",
      sourceUrl: "https://youtu.be/dQw4w9WgXcQ",
      cpmUSD: 12,
      maxClips: 3,
      status: "OPEN",
      tags: ["self-improvement","podcast","lifestyle"]
    }
  });
}

main().finally(()=>prisma.$disconnect());

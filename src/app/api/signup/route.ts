import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request){
  const body = await req.json();
  const { email, name, password, niches } = body ?? {};
  if(!email || !password) return NextResponse.json({ ok:false, error: "Missing fields"}, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if(existing) return NextResponse.json({ ok:false, error: "Email already registered" }, { status: 400 });

  const user = await prisma.user.create({
    data: { email, name: name || null, niches: Array.isArray(niches) ? niches : [] }
  });

  const hashed = await bcrypt.hash(password, 10);
  await prisma.account.create({
    data: {
      userId: user.id,
      type: "credentials",
      provider: "credentials",
      providerAccountId: user.id,
      id_token: hashed
    }
  });

  return NextResponse.json({ ok:true });
}

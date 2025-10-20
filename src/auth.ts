import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/server/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

declare module "next-auth" {
  interface User {
    role?: "USER" | "ADMIN";
    niches?: string[];
    reputation?: number;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "USER" | "ADMIN";
      niches?: string[];
      reputation?: number;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "database" },
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Email + Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const schema = z.object({
          email: z.string().email(),
          password: z.string().min(6),
        });
        const parsed = schema.safeParse(creds);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const account = await prisma.account.findFirst({
          where: { userId: user.id, provider: "credentials" },
        });
        if (!account?.id_token) return null;

        const ok = await bcrypt.compare(password, account.id_token);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? null,
          role: user.role,
          niches: user.niches,
          reputation: user.reputation,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // @ts-ignore
        session.user.role = (user as any).role;
        // @ts-ignore
        session.user.niches = (user as any).niches;
        // @ts-ignore
        session.user.reputation = (user as any).reputation;
      }
      return session;
    },
  },
});
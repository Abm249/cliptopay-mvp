import "./../styles/globals.css";
import React from "react";
import { auth, signOut } from "@/auth";
import Link from "next/link";

export const metadata = { title: "CliptoPay MVP", description: "Clip-to-earn platform" };

export default async function RootLayout({ children }: { children: React.ReactNode }){
  const session = await auth();
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-black" />
              <span className="font-semibold">CliptoPay</span>
            </div>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/">Home</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/leaderboard">Leaderboard</Link>
              <Link href="/admin">Admin</Link>
            </nav>
            <div>
              {session?.user ? (
                <form action={async ()=>{ 'use server'; await signOut(); }}>
                  <button className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-neutral-300">Sign out</button>
                </form>
              ) : (
                <Link href="/login" className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-neutral-300">Sign in</Link>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4">{children}</main>
        <footer className="mt-12 border-t border-neutral-200 p-4 text-center text-sm text-neutral-500">© {new Date().getFullYear()} CliptoPay</footer>
      </body>
    </html>
  );
}

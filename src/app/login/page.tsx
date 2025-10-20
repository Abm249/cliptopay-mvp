"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage(){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <button onClick={()=>signIn("tiktok")} className="w-full rounded-xl bg-black px-4 py-2.5 text-white">Continue with TikTok</button>
      <div className="text-center text-sm text-neutral-500">or</div>
      <form onSubmit={(e)=>{ e.preventDefault(); signIn("credentials", { email, password, callbackUrl: "/dashboard" }); }} className="space-y-3">
        <input className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button className="w-full rounded-xl ring-1 ring-neutral-300 px-4 py-2.5" type="submit">Sign in with email</button>
      </form>
      <div className="text-sm text-neutral-700">New here? <a className="underline" href="/signup">Create an account</a></div>
    </div>
  );
}

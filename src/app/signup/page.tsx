"use client";
import { useState } from "react";

export default function SignupPage(){
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [niches, setNiches] = useState("fitness,podcast");

  async function submit(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password, niches: niches.split(',').map(s=>s.trim()).filter(Boolean) })
    });
    if(res.ok) window.location.href = "/login";
    else alert("Signup failed");
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
        <input className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <input className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm" placeholder="Niches (comma separated)" value={niches} onChange={(e)=>setNiches(e.target.value)} />
        <button className="w-full rounded-xl bg-black px-4 py-2.5 text-white">Sign up</button>
      </form>
    </div>
  );
}

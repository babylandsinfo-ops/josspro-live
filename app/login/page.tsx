"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 🔥 স্মার্ট ক্রেডেনশিয়ালস
  const CREDENTIALS = {
    ADMIN: {
      user: "admin",
      pass: "Joss@Admin2026!Pro" 
    },
    STAFF: {
      user: "operator",        // "staff" এর বদলে স্মার্ট নাম "operator"
      pass: "Ops@Fast24#Work"  // নতুন পাসওয়ার্ড
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // ১. এডমিন চেক
    if (username === CREDENTIALS.ADMIN.user && password === CREDENTIALS.ADMIN.pass) {
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("isLoggedIn", "true");
      router.push("/");
    } 
    // ২. অপারেটর (স্টাফ) চেক
    else if (username === CREDENTIALS.STAFF.user && password === CREDENTIALS.STAFF.pass) {
      localStorage.setItem("userRole", "staff"); // রোল 'staff' ই থাকবে (কোডের লজিক ঠিক রাখার জন্য)
      localStorage.setItem("isLoggedIn", "true");
      router.push("/");
    } 
    else {
      setError("❌ ভুল ইউজারনেম বা পাসওয়ার্ড!");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 animate-in fade-in zoom-in duration-500">
      <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 w-full max-w-md shadow-2xl relative overflow-hidden">
        
        {/* ব্যাকগ্রাউন্ড ইফেক্ট */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-white border-2 border-zinc-700 shadow-lg">
            <ShieldCheck size={40} className="text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">JOSS <span className="text-red-600">PRO</span></h1>
          <p className="text-zinc-500 text-sm mt-2">Secure Management Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          
          <div>
            <label className="text-xs text-zinc-400 font-bold mb-2 block uppercase tracking-wider">Username</label>
            <div className="flex items-center bg-black border border-zinc-800 rounded-xl p-4 focus-within:border-red-600 transition-colors">
              <User className="text-zinc-500 mr-3" size={20} />
              <input 
                type="text" 
                placeholder="Enter Username" 
                className="bg-transparent text-white w-full outline-none font-medium placeholder:text-zinc-700"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 font-bold mb-2 block uppercase tracking-wider">Password</label>
            <div className="flex items-center bg-black border border-zinc-800 rounded-xl p-4 focus-within:border-red-600 transition-colors relative">
              <Lock className="text-zinc-500 mr-3" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="bg-transparent text-white w-full outline-none font-medium placeholder:text-zinc-700 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-zinc-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-center animate-pulse">
                <p className="text-red-500 text-sm font-bold">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-900/20 transform hover:scale-[1.02]"
          >
            Access Dashboard
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-zinc-600 text-xs">Protected by Joss Pro Security System</p>
        </div>
      </div>
    </div>
  );
}
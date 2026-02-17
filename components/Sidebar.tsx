"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, ShoppingCart, FileText, Package, 
  BarChart3, Upload, Wallet, Menu, X, LogOut 
} from "lucide-react"; 

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  // ১. রোল চেক করা
  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (!isLoggedIn) {
      // যদি লগইন পেজে না থাকি, তবেই রিডাইরেক্ট করবে
      if (pathname !== "/login") {
         router.push("/login");
      }
    } else {
      setRole(userRole);
    }
  }, [router, pathname]);

  // ২. লগআউট
  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  // ৩. মেনু কনফিগারেশন (Dashboard এখন সবার জন্য "all")
  const allMenuItems = [
    { name: "Dashboard", href: "/", icon: <LayoutDashboard size={20} />, role: "all" }, // 🔥 পরিবর্তন: admin -> all
    { name: "New Order", href: "/orders/new", icon: <ShoppingCart size={20} />, role: "all" },
    { name: "All Orders", href: "/orders", icon: <FileText size={20} />, role: "all" },
    { name: "Bulk Entry", href: "/orders/bulk", icon: <Upload size={20} />, role: "all" },
    { name: "Inventory", href: "/inventory", icon: <Package size={20} />, role: "all" },
    { name: "Reports", href: "/reports", icon: <BarChart3 size={20} />, role: "admin" }, // শুধু এডমিন
    { name: "Accounts", href: "/accounts", icon: <Wallet size={20} />, role: "admin" }, // শুধু এডমিন
  ];

  // রোল অনুযায়ী ফিল্টার
  const visibleMenuItems = allMenuItems.filter(item => 
    role === "admin" ? true : item.role === "all"
  );

  if (pathname === "/login") return null;

  return (
    <>
      {/* Mobile Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="md:hidden fixed top-4 right-4 z-[100] p-3 bg-red-600 text-white rounded-full shadow-lg border-2 border-white"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/60 z-[40] md:hidden backdrop-blur-sm"/>}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-screen w-64 bg-zinc-950 border-r border-zinc-800 text-white flex flex-col 
        z-[50] transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}>
        
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-2xl font-bold text-red-600 flex items-center gap-2">
            JOSS <span className="text-white text-sm bg-zinc-800 px-2 py-1 rounded">PRO</span>
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {visibleMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive
                    ? "bg-red-600 text-white shadow-lg shadow-red-900/50"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 mb-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${role === 'admin' ? 'bg-red-600' : 'bg-blue-600'}`}>
              {role === 'admin' ? 'A' : 'S'}
            </div>
            <div>
              <p className="text-sm font-bold capitalize">{role === 'admin' ? 'Admin User' : 'Staff User'}</p>
              <p className="text-xs text-zinc-500 capitalize">{role}</p>
            </div>
          </div>
          
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-zinc-400 hover:text-red-500 p-2 text-sm transition-colors">
            <LogOut size={16}/> Logout
          </button>
        </div>
      </div>
    </>
  );
}
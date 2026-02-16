"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, ShoppingCart, FileText, Package, 
  BarChart3, Upload, Wallet, Menu, X 
} from "lucide-react"; 

const menuItems = [
  { name: "Dashboard", href: "/", icon: <LayoutDashboard size={20} /> },
  { name: "New Order", href: "/orders/new", icon: <ShoppingCart size={20} /> },
  { name: "All Orders", href: "/orders", icon: <FileText size={20} /> },
  { name: "Bulk Entry", href: "/orders/bulk", icon: <Upload size={20} /> },
  { name: "Inventory", href: "/inventory", icon: <Package size={20} /> },
  { name: "Reports", href: "/reports", icon: <BarChart3 size={20} /> },
  { name: "Accounts", href: "/accounts", icon: <Wallet size={20} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false); // মোবাইলের জন্য মেনু অন/অফ স্টেট

  return (
    <>
      {/* --- ১. মোবাইল মেনু বাটন (শুধুমাত্র মোবাইলে দেখাবে) --- */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="md:hidden fixed top-4 right-4 z-[100] p-3 bg-red-600 text-white rounded-full shadow-lg border-2 border-white"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* --- ২. কালো আস্তরণ (Overlay) - মেনু খোলা থাকলে পেছনে ক্লিক করলে বন্ধ হবে --- */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 z-[40] md:hidden backdrop-blur-sm"
        />
      )}

      {/* --- ৩. সাইডবার (মেইন) --- */}
      <div className={`
        fixed left-0 top-0 h-screen w-64 bg-zinc-950 border-r border-zinc-800 text-white flex flex-col 
        z-[50] transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}>
        
        {/* Logo Area */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-red-600 flex items-center gap-2">
            JOSS <span className="text-white text-sm bg-zinc-800 px-2 py-1 rounded">PRO</span>
          </h1>
          {/* মোবাইলে মেনু বন্ধ করার বাটন (ভিতরে) */}
          <button onClick={() => setIsOpen(false)} className="md:hidden text-zinc-400 hover:text-white">
            <X size={24}/>
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)} // লিংকে ক্লিক করলে মেনু বন্ধ হবে
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

        {/* User Info (Footer) */}
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-white">
              A
            </div>
            <div>
              <p className="text-sm font-bold">Admin User</p>
              <p className="text-xs text-zinc-500">Owner</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
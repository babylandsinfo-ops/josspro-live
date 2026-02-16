"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, FileText, Package, BarChart3, Upload, Wallet } from "lucide-react"; // Wallet আইকন যুক্ত করা হয়েছে

const menuItems = [
  { name: "Dashboard", href: "/", icon: <LayoutDashboard size={20} /> },
  { name: "New Order", href: "/orders/new", icon: <ShoppingCart size={20} /> },
  { name: "All Orders", href: "/orders", icon: <FileText size={20} /> },
  { name: "Bulk Entry", href: "/orders/bulk", icon: <Upload size={20} /> },
  { name: "Inventory", href: "/inventory", icon: <Package size={20} /> },
  { name: "Reports", href: "/reports", icon: <BarChart3 size={20} /> },
  { name: "Accounts", href: "/accounts", icon: <Wallet size={20} /> }, // 🔥 নতুন বাটন
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen bg-zinc-950 border-r border-zinc-800 text-white flex flex-col fixed left-0 top-0 overflow-y-auto">
      {/* Logo Area */}
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-2xl font-bold text-red-600 flex items-center gap-2">
          JOSS <span className="text-white text-sm bg-zinc-800 px-2 py-1 rounded">PRO</span>
        </h1>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold">
            A
          </div>
          <div>
            <p className="text-sm font-bold">Admin User</p>
            <p className="text-xs text-zinc-500">Owner</p>
          </div>
        </div>
      </div>
    </div>
  );
}
// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  FileText, 
  PieChart,
  Layers // বাল্ক অর্ডারের জন্য আইকন
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "New Order", href: "/orders/new", icon: ShoppingCart },
  { name: "All Orders", href: "/orders", icon: FileText },
  { name: "Bulk Entry", href: "/orders/bulk", icon: Layers }, // 🔥 এই নতুন বাটনটি যোগ করা হলো
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Reports", href: "/reports", icon: PieChart },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="h-screen w-64 bg-zinc-900 text-white fixed left-0 top-0 p-4 flex flex-col">
      {/* Logo Area */}
      <div className="mb-8 px-2 flex items-center gap-2">
        <div className="h-8 w-8 bg-red-600 rounded-lg flex items-center justify-center font-bold text-xl">J</div>
        <span className="text-xl font-bold tracking-tight">JOSS<span className="text-red-500 text-xs bg-white px-1 rounded ml-1">PRO</span></span>
      </div>

      {/* Menu Items */}
      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                isActive 
                  ? "bg-red-600 text-white shadow-lg shadow-red-900/20" 
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Info (Bottom) */}
      <div className="mt-auto pt-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-2">
           <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs">AD</div>
           <div>
              <p className="text-sm font-bold">Admin User</p>
              <p className="text-xs text-zinc-500">Owner</p>
           </div>
        </div>
      </div>
    </div>
  );
}
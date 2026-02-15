// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, ShoppingBag, Package, Users, ArrowRight, FileText, Loader2, RefreshCw } from "lucide-react";
import { db } from "@/lib/firebase"; 
import { collection, getDocs } from "firebase/firestore";

export default function Home() {
  const [stats, setStats] = useState({
    totalNetProfit: 0, // খরচ বাদ দিয়ে আসল লাভ
    totalOrders: 0,
    pendingOrders: 0,
    inventoryValue: 0,
    activeCustomers: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ১. অর্ডার ডাটা আনা
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      let grossProfit = 0; // খরচ বাদে শুধু প্রোডাক্ট লাভ
      let pending = 0;
      const customers = new Set();

      ordersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        grossProfit += Number(data.netProfit) || 0;
        if (data.status === "Pending") pending++;
        if (data.phone) customers.add(data.phone);
      });

      // ২. ইনভেন্টরি ডাটা আনা
      const inventorySnapshot = await getDocs(collection(db, "inventory"));
      let stockValue = 0;
      inventorySnapshot.docs.forEach((doc) => {
        const item = doc.data();
        stockValue += (Number(item.buyPrice) || 0) * (Number(item.stock) || 0);
      });

      // ৩. খরচ (Expenses) আনা এবং বিয়োগ করা [নতুন অংশ]
      const expensesSnapshot = await getDocs(collection(db, "expenses"));
      let totalExpenses = 0;
      expensesSnapshot.docs.forEach((doc) => {
        totalExpenses += Number(doc.data().amount) || 0;
      });

      // ফাইনাল লাভ (অর্ডার লাভ - মোট খরচ)
      const finalNetProfit = grossProfit - totalExpenses;

      setStats({
        totalNetProfit: finalNetProfit,
        totalOrders: ordersSnapshot.size,
        pendingOrders: pending,
        inventoryValue: stockValue,
        activeCustomers: customers.size,
      });
      
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-2">
        <Loader2 className="animate-spin text-red-600" size={40} />
        <p className="text-zinc-500 text-sm">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-600">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            Dashboard Overview <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full animate-pulse">● Live</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Real-time business updates.</p>
        </div>
        <button onClick={fetchData} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition" title="Refresh Data">
            <RefreshCw size={20} className="text-gray-600"/>
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Net Profit (Updated) */}
        <StatCard 
          title="Total Net Profit" 
          value={`৳ ${stats.totalNetProfit.toLocaleString()}`} 
          // লস হলে লাল, লাভ হলে সবুজ আইকন
          icon={<TrendingUp size={24} className="text-white"/>} 
          bg={stats.totalNetProfit >= 0 ? "bg-emerald-500" : "bg-red-500"} 
        />
        
        <StatCard title="Total Orders" value={stats.totalOrders} icon={<ShoppingBag size={24} className="text-white"/>} bg="bg-red-600" />
        <StatCard title="Inventory Value" value={`৳ ${stats.inventoryValue.toLocaleString()}`} icon={<Package size={24} className="text-white"/>} bg="bg-zinc-900" />
        <StatCard title="Customers" value={stats.activeCustomers} icon={<Users size={24} className="text-white"/>} bg="bg-purple-500" />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard title="Create New Order" desc="New shipment" href="/orders/new" color="bg-red-600 hover:bg-red-700" icon={<ShoppingBag size={20} />} />
          <ActionCard title="Manage Inventory" desc="Update stock" href="/inventory" color="bg-zinc-900 hover:bg-black" icon={<Package size={20} />} />
          <ActionCard title="View All Orders" desc="Order history" href="/orders" color="bg-zinc-700 hover:bg-zinc-800" icon={<FileText size={20} />} />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bg }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
      <div><p className="text-sm text-zinc-500">{title}</p><h3 className="text-2xl font-bold mt-1">{value}</h3></div>
      <div className={`p-3 rounded-lg ${bg}`}>{icon}</div>
    </div>
  );
}

function ActionCard({ title, desc, href, color, icon }: any) {
  return (
    <Link href={href} className={`group relative p-6 rounded-xl shadow-sm ${color}`}>
      <div className="relative z-10 text-white">
        <div className="mb-4 bg-white/20 w-fit p-3 rounded-lg">{icon}</div>
        <h3 className="font-bold">{title}</h3>
        <p className="text-sm opacity-80">{desc}</p>
      </div>
      <ArrowRight className="absolute bottom-6 right-6 text-white opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-x-2" />
    </Link>
  );
}
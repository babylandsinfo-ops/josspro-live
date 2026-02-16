"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  TrendingUp, ShoppingBag, Package, Users, ArrowRight, 
  FileText, Loader2, RefreshCw, Wallet, Truck, DollarSign, Activity 
} from "lucide-react";
import { db } from "@/lib/firebase"; 
import { collection, getDocs } from "firebase/firestore";

export default function Home() {
  const [stats, setStats] = useState({
    totalNetProfit: 0,
    totalOrders: 0,
    pendingOrders: 0,
    inventoryValue: 0,
    activeCustomers: 0,
    courierPending: 0, 
    totalSales: 0      
  });
  
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ১. অর্ডার ডাটা আনা
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      
      let grossProfit = 0; 
      let pendingCount = 0;
      let courierDue = 0; 
      let sales = 0;      
      const customers = new Set();

      ordersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const price = Number(data.salePrice) || 0;
        
        grossProfit += Number(data.netProfit) || 0; 
        if (data.status === "Pending") pendingCount++;
        if (data.phone) customers.add(data.phone);

        // কুরিয়ার পেন্ডিং (Pending, In Transit, Delivered) - সব টাকাই মার্কেটে আছে ধরা হলো
        if (["Pending", "In Transit", "Delivered"].includes(data.status)) {
            courierDue += Number(data.totalAmount) || 0; // COD Amount
        }
      });

      // ২. ইনভেন্টরি ডাটা আনা (FIXED: Collection Name 'inventory')
      const inventorySnapshot = await getDocs(collection(db, "inventory")); 
      let stockVal = 0;
      inventorySnapshot.docs.forEach((doc) => {
        const item = doc.data();
        // কেনা দাম (buyPrice বা purchasePrice)
        const cost = Number(item.buyPrice) || Number(item.purchasePrice) || 0;
        const qty = Number(item.stock) || 0;
        stockVal += (cost * qty);
      });

      // ৩. খরচ (Expenses) আনা
      const expensesSnapshot = await getDocs(collection(db, "expenses"));
      let totalExpenses = 0;
      expensesSnapshot.docs.forEach((doc) => {
        totalExpenses += Number(doc.data().amount) || 0;
      });

      // ফাইনাল লাভ (মোট অর্ডার লাভ - অফিস খরচ)
      const finalNetProfit = grossProfit - totalExpenses;

      setStats({
        totalNetProfit: finalNetProfit,
        totalOrders: ordersSnapshot.size,
        pendingOrders: pendingCount,
        inventoryValue: stockVal,
        activeCustomers: customers.size,
        courierPending: courierDue,
        totalSales: sales
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
      <div className="flex h-screen items-center justify-center flex-col gap-2 bg-black text-white">
        <Loader2 className="animate-spin text-red-600" size={40} />
        <p className="text-zinc-500 text-sm">Analyzing Business Data...</p>
      </div>
    );
  }

  // কোম্পানি ভ্যালু (স্টক + মার্কেট ডিউ + ক্যাশ)
  // এখানে ক্যাশ হিসেবে আমরা লাভকে ধরছি (অথবা আপনি Accounts পেজের ব্যালেন্স আনতে পারেন)
  const totalCompanyValue = stats.inventoryValue + stats.courierPending + stats.totalNetProfit;

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 min-h-screen text-white">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-lg">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Dashboard <span className="text-xs bg-red-600/20 text-red-500 px-3 py-1 rounded-full border border-red-600/30 flex items-center gap-1"><Activity size={12}/> Live</span>
          </h1>
          <p className="text-zinc-400 mt-1">Business Overview & Asset Valuation</p>
        </div>
        <button 
            onClick={fetchData} 
            className="mt-4 md:mt-0 p-3 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-all border border-zinc-700 group"
            title="Refresh Data"
        >
            <RefreshCw size={20} className="text-zinc-400 group-hover:text-white group-hover:rotate-180 transition-transform duration-500"/>
        </button>
      </div>

      {/* --- Section 1: Business Performance --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Net Profit (Loss)" 
          value={`৳ ${stats.totalNetProfit.toLocaleString()}`} 
          icon={<TrendingUp size={24} />} 
          color={stats.totalNetProfit >= 0 ? "text-emerald-500" : "text-red-500"}
          bg={stats.totalNetProfit >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}
        />
        <StatCard title="Total Orders" value={stats.totalOrders} icon={<ShoppingBag size={24} />} color="text-blue-500" bg="bg-blue-500/10 border-blue-500/20" />
        <StatCard title="Active Customers" value={stats.activeCustomers} icon={<Users size={24} />} color="text-purple-500" bg="bg-purple-500/10 border-purple-500/20" />
        <StatCard title="Pending Orders" value={stats.pendingOrders} icon={<Loader2 size={24} />} color="text-orange-500" bg="bg-orange-500/10 border-orange-500/20" />
      </div>

      <hr className="border-zinc-800" />

      {/* --- Section 2: Company Assets --- */}
      <div>
        <h2 className="text-xl font-bold text-zinc-400 mb-4 flex items-center gap-2">
            <Wallet size={20}/> Company Assets Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Inventory Asset */}
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-zinc-600 transition-colors">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-zinc-800 rounded-lg text-white"><Package size={24} /></div>
                    <p className="text-zinc-400 text-sm font-medium">Inventory Value</p>
                </div>
                <h3 className="text-2xl font-bold ml-1">৳ {stats.inventoryValue.toLocaleString()}</h3>
                <p className="text-xs text-zinc-500 ml-1 mt-1">Stock Purchase Cost</p>
            </div>

            {/* Courier Asset */}
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-zinc-600 transition-colors">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-zinc-800 rounded-lg text-white"><Truck size={24} /></div>
                    <p className="text-zinc-400 text-sm font-medium">Courier / Market Due</p>
                </div>
                <h3 className="text-2xl font-bold ml-1">৳ {stats.courierPending.toLocaleString()}</h3>
                <p className="text-xs text-zinc-500 ml-1 mt-1">Pending COD Payments</p>
            </div>

            {/* Total Value */}
            <div className="relative bg-gradient-to-br from-zinc-800 to-black p-6 rounded-2xl border border-zinc-700 overflow-hidden group">
                <div className="absolute right-0 top-0 p-16 bg-red-600/10 blur-3xl rounded-full group-hover:bg-red-600/20 transition-all"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-red-600 rounded-lg text-white shadow-lg shadow-red-900/50"><DollarSign size={24} /></div>
                        <p className="text-red-400 text-sm font-bold tracking-wider">TOTAL COMPANY VALUE</p>
                    </div>
                    <h3 className="text-3xl font-bold text-white ml-1">৳ {totalCompanyValue.toLocaleString()}</h3>
                    <p className="text-xs text-zinc-400 ml-1 mt-1">Net Worth (Assets + Market Due + Profit)</p>
                </div>
            </div>

        </div>
      </div>

      {/* --- Section 3: Quick Actions --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard title="Create New Order" desc="Send to Steadfast" href="/orders/new" color="bg-red-600 hover:bg-red-700" icon={<ShoppingBag size={20} />} />
          <ActionCard title="Manage Inventory" desc="Update Stock" href="/inventory" color="bg-zinc-800 hover:bg-zinc-700" icon={<Package size={20} />} />
          <ActionCard title="View All Orders" desc="Check Status" href="/orders" color="bg-zinc-800 hover:bg-zinc-700" icon={<FileText size={20} />} />
      </div>
    </div>
  );
}

// Components
function StatCard({ title, value, icon, bg, color }: any) {
  return (
    <div className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] ${bg}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-zinc-400 font-medium">{title}</p>
          <h3 className={`text-2xl font-bold mt-2 ${color}`}>{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-black/20 ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

function ActionCard({ title, desc, href, color, icon }: any) {
  return (
    <Link href={href} className={`group relative p-6 rounded-2xl transition-all shadow-lg ${color}`}>
      <div className="relative z-10 text-white flex items-center justify-between">
        <div>
            <div className="mb-4 bg-white/10 w-fit p-3 rounded-xl backdrop-blur-sm">{icon}</div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-sm opacity-70">{desc}</p>
        </div>
        <ArrowRight className="text-white opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
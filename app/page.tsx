"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, ShoppingBag, Package, Users, ArrowRight, 
  FileText, Loader2, RefreshCw, Wallet, Truck, DollarSign, Activity,
  ClipboardList, CheckCircle, Clock
} from "lucide-react";
import { db } from "@/lib/firebase"; 
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

// ১. সংখ্যা ক্লিন করার ফাংশন
const parseNumber = (value: any) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, ""); 
    return parseFloat(cleaned) || 0;
  }
  return 0;
};

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin Stats
  const [adminStats, setAdminStats] = useState({
    totalNetProfit: 0,
    totalOrders: 0,
    pendingOrders: 0,
    inventoryValue: 0,
    activeCustomers: 0,
    courierPending: 0, 
    totalSales: 0      
  });

  // Staff Stats
  const [staffStats, setStaffStats] = useState({
    todaysOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalOrders: 0
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // ১. রোল চেক করা (রিডাইরেক্ট সরানো হয়েছে)
  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setRole(userRole);
    
    // রোল অনুযায়ী ডাটা ফেচ করা
    if (userRole === "admin") {
      fetchAdminData();
    } else {
      fetchStaffData();
    }
  }, [router]);

  // --- ADMIN DATA FETCHING ---
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      let grossProfit = 0; 
      let pendingCount = 0;
      let courierDue = 0; 
      let sales = 0;      
      const customers = new Set();

      ordersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const price = parseNumber(data.salePrice);
        const totalAmount = parseNumber(data.totalAmount);
        const profit = parseNumber(data.netProfit);
        
        grossProfit += profit;
        if (data.status === "Pending") pendingCount++;
        if (data.phone) customers.add(data.phone);

        if (["Pending", "In Transit", "Delivered"].includes(data.status)) {
            courierDue += totalAmount; 
        }
        if (data.status === "Delivered") {
            sales += price;
        }
      });

      const inventorySnapshot = await getDocs(collection(db, "inventory")); 
      let stockVal = 0;
      inventorySnapshot.docs.forEach((doc) => {
        const item = doc.data();
        const cost = parseNumber(item.buyPrice) || parseNumber(item.purchasePrice) || 0;
        const qty = parseNumber(item.stock) || parseNumber(item.quantity) || 0;
        stockVal += (cost * qty);
      });

      const expensesSnapshot = await getDocs(collection(db, "expenses"));
      let totalExpenses = 0;
      expensesSnapshot.docs.forEach((doc) => {
        totalExpenses += parseNumber(doc.data().amount);
      });

      setAdminStats({
        totalNetProfit: grossProfit - totalExpenses,
        totalOrders: ordersSnapshot.size,
        pendingOrders: pendingCount,
        inventoryValue: stockVal,
        activeCustomers: customers.size,
        courierPending: courierDue,
        totalSales: sales
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- STAFF DATA FETCHING ---
  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const ordersSnapshot = await getDocs(q);
      
      let todayCount = 0;
      let pendingCount = 0;
      let deliveredCount = 0;
      
      const todayStr = new Date().toISOString().split('T')[0];
      const recentList: any[] = [];

      ordersSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        
        let orderDate = "";
        // সেইফলি ডেট কনভার্ট করা
        if(data.createdAt?.toDate) {
            orderDate = data.createdAt.toDate().toISOString().split('T')[0];
        } else if (data.createdAt instanceof Date) {
            orderDate = data.createdAt.toISOString().split('T')[0];
        }

        if (orderDate === todayStr) todayCount++;
        if (data.status === "Pending") pendingCount++;
        if (data.status === "Delivered") deliveredCount++;

        if (index < 5) {
            recentList.push({ id: doc.id, ...data });
        }
      });

      setStaffStats({
        todaysOrders: todayCount,
        pendingOrders: pendingCount,
        deliveredOrders: deliveredCount,
        totalOrders: ordersSnapshot.size
      });
      setRecentOrders(recentList);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (role === "admin") fetchAdminData();
    else fetchStaffData();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-2 bg-black text-white">
        <Loader2 className="animate-spin text-red-600" size={40} />
        <p className="text-zinc-500 text-sm">Loading Dashboard...</p>
      </div>
    );
  }

  // 🔥🔥🔥 STAFF DASHBOARD VIEW 🔥🔥🔥
  if (role === "staff") {
    return (
      <div className="p-6 space-y-8 animate-in fade-in duration-500 min-h-screen text-white">
        {/* Staff Header */}
        <div className="flex justify-between items-center bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                   👋 Hello, Staff Member
                </h1>
                <p className="text-zinc-400 text-sm mt-1">Today's Work Overview</p>
            </div>
            <button onClick={handleRefresh} className="p-3 bg-zinc-800 rounded-full hover:bg-zinc-700 border border-zinc-700">
                <RefreshCw size={20} className="text-zinc-400"/>
            </button>
        </div>

        {/* Staff Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-600/10 border border-blue-600/20 p-6 rounded-2xl flex items-center justify-between">
                <div>
                    <p className="text-blue-400 font-bold text-sm uppercase">Orders Today</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{staffStats.todaysOrders}</h3>
                </div>
                <div className="p-3 bg-blue-600/20 rounded-xl text-blue-500"><ClipboardList size={24}/></div>
            </div>

            <div className="bg-orange-600/10 border border-orange-600/20 p-6 rounded-2xl flex items-center justify-between">
                <div>
                    <p className="text-orange-400 font-bold text-sm uppercase">Pending Tasks</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{staffStats.pendingOrders}</h3>
                </div>
                <div className="p-3 bg-orange-600/20 rounded-xl text-orange-500"><Clock size={24}/></div>
            </div>

            <div className="bg-green-600/10 border border-green-600/20 p-6 rounded-2xl flex items-center justify-between">
                <div>
                    <p className="text-green-400 font-bold text-sm uppercase">Completed</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{staffStats.deliveredOrders}</h3>
                </div>
                <div className="p-3 bg-green-600/20 rounded-xl text-green-500"><CheckCircle size={24}/></div>
            </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/orders/new" className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-red-600 transition-all group">
                <ShoppingBag size={32} className="text-red-500 mb-4 group-hover:scale-110 transition-transform"/>
                <h3 className="text-xl font-bold">Create New Order</h3>
                <p className="text-zinc-500 text-sm mt-2">Entry new order from WhatsApp/Call</p>
            </Link>
            <Link href="/orders" className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-blue-600 transition-all group">
                <FileText size={32} className="text-blue-500 mb-4 group-hover:scale-110 transition-transform"/>
                <h3 className="text-xl font-bold">Manage Orders</h3>
                <p className="text-zinc-500 text-sm mt-2">Update status or edit order details</p>
            </Link>
        </div>

        {/* Recent Orders List (Simple) */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
            <h3 className="text-lg font-bold mb-4 text-zinc-300">Recent Orders</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="bg-zinc-800 text-zinc-200">
                        <tr>
                            <th className="p-3 rounded-l-lg">Customer</th>
                            <th className="p-3">Product</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3 rounded-r-lg">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {recentOrders.map((order) => (
                            <tr key={order.id}>
                                <td className="p-3 font-bold text-white">{order.customerName}</td>
                                <td className="p-3">{order.productName}</td>
                                <td className="p-3">৳ {order.totalAmount}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        order.status === 'Delivered' ? 'bg-green-600 text-white' : 
                                        order.status === 'Pending' ? 'bg-yellow-600 text-black' : 'bg-zinc-700'
                                    }`}>
                                        {order.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    );
  }

  // 🔥🔥🔥 ADMIN DASHBOARD VIEW 🔥🔥🔥
  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 min-h-screen text-white">
      
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-lg">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Dashboard <span className="text-xs bg-red-600/20 text-red-500 px-3 py-1 rounded-full border border-red-600/30 flex items-center gap-1"><Activity size={12}/> Live</span>
          </h1>
          <p className="text-zinc-400 mt-1">Business Overview & Asset Valuation</p>
        </div>
        <button onClick={handleRefresh} className="mt-4 md:mt-0 p-3 bg-zinc-800 rounded-full hover:bg-zinc-700 border border-zinc-700 group">
            <RefreshCw size={20} className="text-zinc-400 group-hover:text-white group-hover:rotate-180 transition-transform duration-500"/>
        </button>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Net Profit (Loss)" value={`৳ ${adminStats.totalNetProfit.toLocaleString()}`} icon={<TrendingUp size={24} />} 
          color={adminStats.totalNetProfit >= 0 ? "text-emerald-500" : "text-red-500"}
          bg={adminStats.totalNetProfit >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}
        />
        <StatCard title="Total Orders" value={adminStats.totalOrders} icon={<ShoppingBag size={24} />} color="text-blue-500" bg="bg-blue-500/10 border-blue-500/20" />
        <StatCard title="Inventory Value" value={`৳ ${adminStats.inventoryValue.toLocaleString()}`} icon={<Package size={24} />} color="text-white" bg="bg-zinc-800 border-zinc-700" />
        <StatCard title="Active Customers" value={adminStats.activeCustomers} icon={<Users size={24} />} color="text-purple-500" bg="bg-purple-500/10 border-purple-500/20" />
      </div>

      <hr className="border-zinc-800" />

      {/* Admin Assets Breakdown */}
      <div>
        <h2 className="text-xl font-bold text-zinc-400 mb-4 flex items-center gap-2"><Wallet size={20}/> Company Assets Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-zinc-800 rounded-lg text-white"><Package size={24} /></div>
                    <p className="text-zinc-400 text-sm font-medium">Inventory Value</p>
                </div>
                <h3 className="text-2xl font-bold ml-1">৳ {adminStats.inventoryValue.toLocaleString()}</h3>
                <p className="text-xs text-zinc-500 ml-1 mt-1">Stock Purchase Cost</p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-zinc-800 rounded-lg text-white"><Truck size={24} /></div>
                    <p className="text-zinc-400 text-sm font-medium">Courier / Market Due</p>
                </div>
                <h3 className="text-2xl font-bold ml-1">৳ {adminStats.courierPending.toLocaleString()}</h3>
                <p className="text-xs text-zinc-500 ml-1 mt-1">Pending COD Payments</p>
            </div>

            <div className="relative bg-gradient-to-br from-zinc-800 to-black p-6 rounded-2xl border border-zinc-700 overflow-hidden group">
                <div className="absolute right-0 top-0 p-16 bg-red-600/10 blur-3xl rounded-full"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-red-600 rounded-lg text-white"><DollarSign size={24} /></div>
                        <p className="text-red-400 text-sm font-bold tracking-wider">TOTAL COMPANY VALUE</p>
                    </div>
                    <h3 className="text-3xl font-bold text-white ml-1">৳ {(adminStats.inventoryValue + adminStats.courierPending + (adminStats.totalNetProfit > 0 ? adminStats.totalNetProfit : 0)).toLocaleString()}</h3>
                    <p className="text-xs text-zinc-400 ml-1 mt-1">Net Worth (Assets + Due + Profit)</p>
                </div>
            </div>
        </div>
      </div>

      {/* Admin Actions */}
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
        <div><p className="text-sm text-zinc-400 font-medium">{title}</p><h3 className={`text-2xl font-bold mt-2 ${color}`}>{value}</h3></div>
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
// app/reports/page.tsx - শুধুমাত্র Expenses Form অংশটি আপডেট হবে, তবে আমি পুরোটা দিচ্ছি যাতে ভুল না হয়।
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query, Timestamp } from "firebase/firestore";
import { BarChart3, Calendar, TrendingUp, DollarSign, Plus, Trash2, PieChart } from "lucide-react";

export default function ReportsPage() {
  const [stats, setStats] = useState({
    today: { sales: 0, cost: 0, profit: 0, orders: 0 },
    weekly: { sales: 0, cost: 0, profit: 0, orders: 0 },
    monthly: { sales: 0, cost: 0, profit: 0, orders: 0 },
    totalExpenses: 0,
    netCash: 0,
  });

  const [expenses, setExpenses] = useState<any[]>([]);
  const [newExpense, setNewExpense] = useState({ title: "", amount: "", type: "General", date: "" });

  const fetchData = async () => {
    try {
      const orderSnap = await getDocs(collection(db, "orders"));
      
      const now = new Date();
      const startOfDay = new Date(now.setHours(0,0,0,0));
      const startOfWeek = new Date(now.setDate(now.getDate() - 7));
      // এই মাসের শুরু (February 1)
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      let d = { sales: 0, cost: 0, profit: 0, orders: 0 };
      let w = { sales: 0, cost: 0, profit: 0, orders: 0 };
      let m = { sales: 0, cost: 0, profit: 0, orders: 0 };

      orderSnap.docs.forEach(doc => {
        const data = doc.data();
        const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        
        const sale = Number(data.salePrice) || 0;
        const prodCost = (Number(data.costPrice) || 0) + (Number(data.courierCharge) || 0) + (Number(data.packagingCost) || 0);
        const gross = sale - prodCost;

        if (date >= startOfDay) { d.sales += sale; d.cost += prodCost; d.profit += gross; d.orders++; }
        if (date >= startOfWeek) { w.sales += sale; w.cost += prodCost; w.profit += gross; w.orders++; }
        // গত মাসের ডাটা দেখার জন্য আমরা আপাতত সব ডাটা monthly তে দেখাচ্ছি (Testing Purpose)
        // রিয়েল টাইমে এটি শুধু এই মাসের ডাটা দেখাবে
        m.sales += sale; m.cost += prodCost; m.profit += gross; m.orders++;
      });

      const expQuery = query(collection(db, "expenses"), orderBy("createdAt", "desc"));
      const expSnap = await getDocs(expQuery);
      
      let totalExp = 0;
      const expenseList = expSnap.docs.map(doc => {
        const data = doc.data();
        totalExp += Number(data.amount);
        return { id: doc.id, ...data };
      });

      setStats({
        today: d, weekly: w, monthly: m,
        totalExpenses: totalExp,
        netCash: m.profit - totalExp 
      });

      setExpenses(expenseList);

    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddExpense = async () => {
    if (!newExpense.title || !newExpense.amount) return;
    
    // কাস্টম ডেট অথবা আজকের ডেট
    const expDate = newExpense.date ? new Date(newExpense.date) : new Date();

    await addDoc(collection(db, "expenses"), {
      title: newExpense.title,
      amount: Number(newExpense.amount),
      type: newExpense.type,
      createdAt: Timestamp.fromDate(expDate)
    });
    setNewExpense({ title: "", amount: "", type: "General", date: "" });
    fetchData();
  };

  const handleDeleteExpense = async (id: string) => {
    if(confirm("Delete expense?")) { await deleteDoc(doc(db, "expenses", id)); fetchData(); }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
       <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-800 border-l-4 border-indigo-600 pl-3">Business Analytics</h1>
          <div className="text-right">
             <p className="text-xs text-zinc-400">Total Net Cash (All Time)</p>
             <h2 className={`text-2xl font-bold ${stats.netCash >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>৳ {stats.netCash.toLocaleString()}</h2>
          </div>
       </div>

       {/* Cards Section (Daily, Weekly, Monthly) - Same as before... */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden md:col-span-3">
             <div className="flex justify-between items-center mb-4">
                <span className="bg-emerald-500 text-white px-2 py-1 rounded text-xs font-bold">Total Business Overview</span>
                <Calendar size={18} className="text-emerald-400"/>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div><p className="text-zinc-400 text-sm">Total Sales</p><span className="text-white font-bold text-xl">৳ {stats.monthly.sales.toLocaleString()}</span></div>
                <div><p className="text-zinc-400 text-sm">Product Cost</p><span className="text-red-400 font-bold text-xl">- ৳ {stats.monthly.cost.toLocaleString()}</span></div>
                <div><p className="text-zinc-400 text-sm">Operational Exp.</p><span className="text-red-400 font-bold text-xl">- ৳ {stats.totalExpenses.toLocaleString()}</span></div>
                <div><p className="text-zinc-400 text-sm">Net Profit</p><span className={`font-bold text-xl ${stats.netCash >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>৳ {stats.netCash.toLocaleString()}</span></div>
             </div>
          </div>
       </div>

       {/* Expense Form */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6"><div className="p-2 bg-red-100 rounded-lg text-red-600"><DollarSign size={20}/></div><h3 className="font-bold text-zinc-800">Add Expenses</h3></div>
          
          <div className="flex flex-col md:flex-row gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
             {/* DATE PICKER ADDED */}
             <input type="date" className="p-3 rounded border outline-none text-sm bg-white" onChange={(e) => setNewExpense({...newExpense, date: e.target.value})} />
             
             <select className="p-3 rounded border outline-none text-sm bg-white" onChange={(e) => setNewExpense({...newExpense, type: e.target.value})}>
                <option value="General">General</option>
                <option value="Influencer">Influencer Cost</option>
                <option value="Marketing">Ads/Marketing</option>
                <option value="Salary">Salary</option>
                <option value="Rent">Office Rent</option>
             </select>
             <input type="text" placeholder="Description" className="p-3 rounded border outline-none w-full text-sm" value={newExpense.title} onChange={(e) => setNewExpense({...newExpense, title: e.target.value})} />
             <input type="number" placeholder="Amount" className="p-3 rounded border outline-none w-32 text-sm" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} />
             <button onClick={handleAddExpense} className="bg-red-600 text-white px-6 py-2 rounded font-bold hover:bg-red-700 transition flex items-center gap-2"><Plus size={18}/> Add</button>
          </div>

          {/* List */}
          <div className="space-y-3">
             {expenses.map((exp) => (
               <div key={exp.id} className="flex justify-between items-center bg-white p-3 rounded border border-gray-100">
                  <div className="flex items-center gap-3">
                     <span className="text-xs text-gray-400 font-mono">{new Date(exp.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                     <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{exp.type}</span>
                     <span className="font-medium text-sm">{exp.title}</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="font-bold text-red-500">- ৳ {exp.amount}</span>
                     <button onClick={() => handleDeleteExpense(exp.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
               </div>
             ))}
          </div>
       </div>
    </div>
  );
}
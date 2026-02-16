"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { TrendingUp, TrendingDown, Wallet, Plus, Trash2, AlertCircle } from "lucide-react";

export default function AccountsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ফর্ম ডাটা
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Cash In"); // Cash In vs Cash Out
  const [category, setCategory] = useState("Steadfast Payment"); // Source/Reason
  const [method, setMethod] = useState("Bank"); 
  const [note, setNote] = useState("");

  // ১. ট্রানজেকশন লোড করা
  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ২. স্মার্ট সেভ ফাংশন (একসাথে দুই কাজ করবে)
  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    const numAmount = Number(amount);
    const dateToday = new Date().toISOString().split('T')[0];

    try {
      const batch = writeBatch(db);

      // ক. ট্রানজেকশন হিস্টোরিতে সেভ করা (ক্যাশ ম্যানেজমেন্টের জন্য)
      const transRef = doc(collection(db, "transactions"));
      batch.set(transRef, {
        amount: numAmount,
        type,      
        category, // কিসের টাকা?
        method,   
        note,
        date: dateToday,
        createdAt: new Date() // সরাসরি Date অবজেক্ট ব্যবহার করছি ব্যাচের জন্য
      });

      // খ. যদি এটা ব্যবসার খরচ হয়, তবে 'expenses' এও সেভ হবে (প্রফিট কমানোর জন্য)
      // লজিক: টাকা বের হচ্ছে (Cash Out) এবং এটা মালিক নিচ্ছে না (Not Withdrawal)
      if (type === "Cash Out" && category !== "Owner Withdrawal") {
        const expenseRef = doc(collection(db, "expenses"));
        batch.set(expenseRef, {
           amount: numAmount,
           description: `${category} - ${note}`, // খরচটা কীসের তা বোঝা যাবে
           date: dateToday,
           type: category, // Marketing, Operational etc.
           source: "Accounts Page" // বোঝার সুবিধার্থে
        });
        alert("Saved as Transaction & Added to Expense Report! ✅");
      } else {
        alert("Transaction Saved! ✅");
      }

      await batch.commit();
      
      // রিসেট
      setAmount("");
      setNote("");
      
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong!");
    }
  };

  // ৩. ডিলিট করা
  const handleDelete = async (id: string) => {
    if(confirm('Delete this record?')) {
        await deleteDoc(doc(db, 'transactions', id));
    }
  };

  const totalIn = transactions.filter(t => t.type === 'Cash In').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOut = transactions.filter(t => t.type === 'Cash Out').reduce((acc, curr) => acc + curr.amount, 0);
  const currentBalance = totalIn - totalOut;

  return (
    <div className="p-6 max-w-6xl mx-auto text-white min-h-screen animate-in fade-in">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="text-red-500"/> Finance Manager
          </h1>
          <p className="text-zinc-400">Manage cash flow & expenses from one place.</p>
        </div>
      </div>

      {/* --- Top Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex items-center gap-4">
            <div className="p-4 bg-blue-600/20 text-blue-500 rounded-xl"><Wallet size={32}/></div>
            <div>
                <p className="text-zinc-400 text-sm">Wallet Balance</p>
                <h3 className="text-3xl font-bold">৳ {currentBalance.toLocaleString()}</h3>
            </div>
        </div>
        {/* বাকি কার্ডগুলো আগের মতোই থাকবে, স্পেস বাঁচাতে সরালাম */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- বাম পাশ: স্মার্ট এন্ট্রি ফর্ম --- */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 h-fit border-l-4 border-l-red-600">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Plus size={20}/> New Entry
          </h2>
          
          <form onSubmit={handleTransaction} className="space-y-4">
            
            {/* Type Selector */}
            <div className="flex gap-2 p-1 bg-black rounded-lg">
                <button type="button" onClick={() => setType("Cash In")} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${type === 'Cash In' ? 'bg-green-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
                    Income / Deposit (+)
                </button>
                <button type="button" onClick={() => setType("Cash Out")} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${type === 'Cash Out' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
                    Expense / Withdraw (-)
                </button>
            </div>

            {/* Category Selector (Smart Logic) */}
            <div>
                <label className="text-sm text-zinc-400">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg p-3 mt-1 outline-none">
                    {type === 'Cash In' ? (
                        <>
                            <option value="Steadfast Payment">Steadfast Payment</option>
                            <option value="Direct Sales">Shop/Cash Sales</option>
                            <option value="Investment">Owner Investment</option>
                        </>
                    ) : (
                        <>
                            <option value="Marketing Ad Cost">Marketing / Facebook Ads (Expense)</option>
                            <option value="Product Purchase">Product Purchase (Expense)</option>
                            <option value="Operational Cost">Operational / Salary (Expense)</option>
                            <option value="Packaging Cost">Packaging Material (Expense)</option>
                            <option value="Owner Withdrawal">Owner Withdrawal (Not Expense)</option>
                        </>
                    )}
                </select>
                
                {/* হেল্প টেক্সট */}
                {type === 'Cash Out' && category !== 'Owner Withdrawal' && (
                    <p className="text-xs text-orange-400 mt-2 flex items-center gap-1">
                        <AlertCircle size={12}/> This will also reduce Net Profit in Reports.
                    </p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm text-zinc-400">Method</label>
                    <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg p-3 mt-1 outline-none">
                        <option value="Bank">Bank</option>
                        <option value="Cash">Cash</option>
                        <option value="Bkash">Bkash/Nagad</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm text-zinc-400">Amount</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="w-full bg-black border border-zinc-700 rounded-lg p-3 mt-1 outline-none focus:border-red-500 font-bold"/>
                </div>
            </div>

            <div>
                <label className="text-sm text-zinc-400">Note</label>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Short note..." className="w-full bg-black border border-zinc-700 rounded-lg p-3 mt-1 outline-none"/>
            </div>

            <button type="submit" className={`w-full py-4 rounded-xl font-bold shadow-lg mt-2 ${type === 'Cash In' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {type === 'Cash In' ? 'Add Money' : 'Add Expense / Out'}
            </button>
          </form>
        </div>

        {/* --- ডান পাশ: হিস্টোরি --- */}
        <div className="lg:col-span-2 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
             {/* টেবিল আগের মতোই থাকবে */}
             <div className="p-4 border-b border-zinc-800">
                <h2 className="font-bold">Recent Transactions</h2>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                    <thead className="bg-black text-xs uppercase">
                        <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {transactions.map((t) => (
                            <tr key={t.id} className="hover:bg-zinc-800/50">
                                <td className="p-3 text-zinc-500">{t.date}</td>
                                <td className="p-3">
                                    <span className="font-bold block text-white">{t.category}</span>
                                    <span className="text-xs text-zinc-500">{t.method} - {t.note}</span>
                                </td>
                                <td className={`p-3 font-bold ${t.type === 'Cash In' ? 'text-green-500' : 'text-red-500'}`}>
                                    {t.type === 'Cash In' ? '+' : '-'} {t.amount}
                                </td>
                                <td className="p-3 text-right">
                                    <button onClick={() => handleDelete(t.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>

      </div>
    </div>
  );
}
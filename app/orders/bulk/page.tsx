"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase"; 
import { collection, getDocs, addDoc, serverTimestamp, writeBatch, doc, increment } from "firebase/firestore";
import { Plus, Trash2, Save, Calendar, Loader2, ShoppingBag } from "lucide-react";

export default function BulkOrderPage() {
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]); // ডিফল্ট আজকের তারিখ

  // প্রাথমিক ১টি রো
  const [rows, setRows] = useState([
    { customerName: "", phone: "", address: "", productId: "", salePrice: 0, deliveryCharge: 60, purchasePrice: 0 }
  ]);

  // ১. ইনভেন্টরি লোড করা
  useEffect(() => {
    const fetchInventory = async () => {
      const snapshot = await getDocs(collection(db, "inventory")); // আপনার কালেকশন নাম 'inventory'
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        name: doc.data().name || doc.data().productName, // নাম ঠিক করা
        price: doc.data().salePrice || doc.data().sellingPrice || 0,
        cost: doc.data().buyPrice || doc.data().purchasePrice || 0
      }));
      setInventory(items);
    };
    fetchInventory();
  }, []);

  // ২. নতুন রো যোগ করা
  const addRow = () => {
    setRows([...rows, { customerName: "", phone: "", address: "", productId: "", salePrice: 0, deliveryCharge: 60, purchasePrice: 0 }]);
  };

  // ৩. রো ডিলিট করা
  const removeRow = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
  };

  // ৪. ইনপুট হ্যান্ডেল করা
  const handleChange = (index: number, field: string, value: any) => {
    const newRows = [...rows];
    // @ts-ignore
    newRows[index][field] = value;
    setRows(newRows);
  };

  // ৫. প্রোডাক্ট সিলেক্ট করলে দাম অটো বসবে
  const handleProductChange = (index: number, productId: string) => {
    const product = inventory.find(p => p.id === productId);
    if (product) {
      const newRows = [...rows];
      newRows[index].productId = productId;
      newRows[index].salePrice = Number(product.price);
      newRows[index].purchasePrice = Number(product.cost); // লাভের হিসাবের জন্য কেনা দাম রাখা হলো
      setRows(newRows);
    }
  };

  // ৬. সব অর্ডার সেভ করা
  const handleSaveAll = async () => {
    if (!confirm(`Are you sure you want to save ${rows.length} orders for date ${orderDate}?`)) return;
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      let saveCount = 0;

      // লুপ চালিয়ে সব অর্ডার প্রসেস করা
      for (const row of rows) {
        if (row.customerName && row.phone && row.productId) {
          
          // অর্ডার ডাটা রেডি করা
          const orderRef = doc(collection(db, "orders")); // নতুন আইডি জেনারেট
          
          // লাভ ক্যালকুলেশন
          const totalBill = Number(row.salePrice) + Number(row.deliveryCharge);
          const netProfit = Number(row.salePrice) - Number(row.purchasePrice) - 10; // 10 টাকা প্যাকেজিং

          // যেই তারিখ সিলেক্ট করেছেন, সেই তারিখের টাইমস্ট্যাম্প বানানো
          const selectedDateObj = new Date(orderDate);
          
          batch.set(orderRef, {
            customerName: row.customerName,
            phone: row.phone,
            address: row.address,
            productId: row.productId,
            productName: inventory.find(p => p.id === row.productId)?.name || "Unknown",
            
            salePrice: Number(row.salePrice),
            deliveryCharge: Number(row.deliveryCharge),
            purchasePrice: Number(row.purchasePrice),
            packagingCost: 10,
            netProfit: netProfit,
            totalAmount: totalBill,

            status: "Delivered", // যেহেতু আগের অর্ডার, তাই স্ট্যাটাস ডেলিভারড রাখলাম (চাইলে Pending দিতে পারেন)
            courier: "Manual History",
            createdAt: selectedDateObj, // সিলেক্ট করা তারিখ
            source: "Bulk Entry"
          });

          // স্টক কমানোর জন্য (অপশনাল)
           const prodRef = doc(db, "inventory", row.productId);
           batch.update(prodRef, { stock: increment(-1) });

          saveCount++;
        }
      }

      await batch.commit();
      alert(`Success! ${saveCount} orders saved for ${orderDate}`);
      
      // ফর্ম রিসেট
      setRows([{ customerName: "", phone: "", address: "", productId: "", salePrice: 0, deliveryCharge: 60, purchasePrice: 0 }]);

    } catch (error) {
      console.error("Error saving bulk orders:", error);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto text-white">
      
      {/* Header & Date Picker */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-red-500">
            <ShoppingBag /> Bulk Order Entry (Fast Mode)
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Quickly enter past orders manually.</p>
        </div>
        
        {/* তারিখ সিলেক্টর */}
        <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-700 flex items-center gap-2">
            <Calendar className="text-zinc-400" size={20}/>
            <span className="text-sm text-zinc-400">Select Date:</span>
            <input 
                type="date" 
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="bg-black text-white p-2 rounded border border-zinc-600 focus:border-red-500 outline-none"
            />
        </div>
      </div>

      {/* Input Table */}
      <div className="space-y-4">
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 items-center animate-in fade-in slide-in-from-left-4">
            
            {/* সিরিয়াল নাম্বার */}
            <div className="md:col-span-1 text-center font-bold text-zinc-600">
                #{index + 1}
            </div>

            {/* নাম */}
            <div className="md:col-span-2">
                <input 
                    placeholder="Customer Name" 
                    value={row.customerName}
                    onChange={(e) => handleChange(index, "customerName", e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-sm focus:border-red-500 outline-none"
                />
            </div>

            {/* ফোন */}
            <div className="md:col-span-2">
                <input 
                    placeholder="Phone (017...)" 
                    value={row.phone}
                    onChange={(e) => handleChange(index, "phone", e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-sm focus:border-red-500 outline-none"
                />
            </div>

            {/* ঠিকানা */}
            <div className="md:col-span-3">
                <input 
                    placeholder="Full Address" 
                    value={row.address}
                    onChange={(e) => handleChange(index, "address", e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-sm focus:border-red-500 outline-none"
                />
            </div>

            {/* প্রোডাক্ট সিলেক্ট */}
            <div className="md:col-span-2">
                <select 
                    value={row.productId}
                    onChange={(e) => handleProductChange(index, e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-sm focus:border-red-500 outline-none"
                >
                    <option value="">- Product -</option>
                    {inventory.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {/* দাম (অটো আসবে, চাইলে বদলানো যাবে) */}
            <div className="md:col-span-1">
                <input 
                    type="number"
                    value={row.salePrice}
                    onChange={(e) => handleChange(index, "salePrice", e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-sm font-bold text-center focus:border-red-500 outline-none"
                />
            </div>

            {/* অ্যাকশন (Delete) */}
            <div className="md:col-span-1 text-center">
                <button onClick={() => removeRow(index)} className="text-zinc-600 hover:text-red-500 transition-colors">
                    <Trash2 size={20} />
                </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        
        <button 
            onClick={addRow}
            className="flex items-center gap-2 text-zinc-400 hover:text-white px-4 py-2 rounded-lg hover:bg-zinc-800 transition-all border border-dashed border-zinc-700 w-full md:w-auto justify-center"
        >
            <Plus size={20} /> Add Another Row
        </button>

        <button 
            onClick={handleSaveAll}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 shadow-lg w-full md:w-auto justify-center"
        >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            Save All Orders
        </button>
      </div>

    </div>
  );
}
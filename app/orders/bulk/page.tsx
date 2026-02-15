// app/orders/bulk/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus, Save, CheckCircle, Calendar } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp, getDocs, doc, updateDoc, increment } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function BulkOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [orderDate, setOrderDate] = useState("");

  // ডিফল্ট ৩টি রো নিয়ে শুরু
  const [rows, setRows] = useState([
    { customerName: "", phone: "", address: "", productId: "", salePrice: 0, costPrice: 0 },
    { customerName: "", phone: "", address: "", productId: "", salePrice: 0, costPrice: 0 },
    { customerName: "", phone: "", address: "", productId: "", salePrice: 0, costPrice: 0 },
  ]);

  useEffect(() => {
    const loadInventory = async () => {
      const snap = await getDocs(collection(db, "inventory"));
      setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    loadInventory();
  }, []);

  const handleRowChange = (index: number, field: string, value: any) => {
    const updatedRows = [...rows];
    
    // যদি প্রোডাক্ট সিলেক্ট করে, অটোমেটিক দাম বসবে
    if (field === "productId") {
       const product = inventory.find(i => i.id === value);
       updatedRows[index].productId = value;
       updatedRows[index].costPrice = product?.buyPrice || 0;
       updatedRows[index].salePrice = product?.sellPrice || 0;
    } else {
       // @ts-ignore
       updatedRows[index][field] = value;
    }
    setRows(updatedRows);
  };

  const addRow = () => {
    setRows([...rows, { customerName: "", phone: "", address: "", productId: "", salePrice: 0, costPrice: 0 }]);
  };

  const removeRow = (index: number) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    setRows(updatedRows);
  };

  const handleSaveAll = async () => {
    if (!orderDate) return alert("Please select a Date first!");
    
    // খালি রো বাদ দেওয়া
    const validOrders = rows.filter(r => r.customerName && r.phone && r.productId);
    
    if (validOrders.length === 0) return alert("Fill at least one order!");

    setLoading(true);
    try {
      const dateObj = new Date(orderDate);
      
      for (const order of validOrders) {
         // ১. অর্ডার সেভ
         const netProfit = Number(order.salePrice) - (Number(order.costPrice) + 120 + 10); // Courier 120, Pack 10 Fixed
         
         await addDoc(collection(db, "orders"), {
            ...order,
            courierCharge: 120,
            packagingCost: 10,
            netProfit: netProfit,
            status: "Pending",
            createdAt: Timestamp.fromDate(dateObj),
            invoice: "BLK-" + Math.floor(1000 + Math.random() * 9000),
         });

         // ২. স্টক কমানো
         const prodRef = doc(db, "inventory", order.productId);
         await updateDoc(prodRef, { stock: increment(-1) });
      }

      alert(`✅ Successfully Saved ${validOrders.length} Orders!`);
      router.push("/orders");

    } catch (e) {
      console.error(e);
      alert("Error saving orders");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-800 border-l-4 border-blue-600 pl-3">
          Bulk Order Entry
        </h1>
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border">
           <Calendar size={18} className="text-gray-500"/>
           <input type="date" className="outline-none text-sm" onChange={(e) => setOrderDate(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-4">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="p-3">Customer Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Address</th>
              <th className="p-3">Product</th>
              <th className="p-3 w-24">Sale Price</th>
              <th className="p-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row, index) => (
              <tr key={index}>
                <td className="p-2"><input placeholder="Name" className="w-full p-2 border rounded" value={row.customerName} onChange={e => handleRowChange(index, "customerName", e.target.value)} /></td>
                <td className="p-2"><input placeholder="017..." className="w-full p-2 border rounded" value={row.phone} onChange={e => handleRowChange(index, "phone", e.target.value)} /></td>
                <td className="p-2"><input placeholder="Address" className="w-full p-2 border rounded" value={row.address} onChange={e => handleRowChange(index, "address", e.target.value)} /></td>
                <td className="p-2">
                  <select className="w-full p-2 border rounded bg-white" value={row.productId} onChange={e => handleRowChange(index, "productId", e.target.value)}>
                    <option value="">Select Product</option>
                    {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </td>
                <td className="p-2"><input type="number" className="w-full p-2 border rounded font-bold" value={row.salePrice} onChange={e => handleRowChange(index, "salePrice", e.target.value)} /></td>
                <td className="p-2"><button onClick={() => removeRow(index)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-4 flex gap-4">
          <button onClick={addRow} className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition">
             <Plus size={18}/> Add More Rows
          </button>
          
          <button 
             onClick={handleSaveAll} disabled={loading}
             className="ml-auto bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg"
          >
             {loading ? "Saving..." : <><CheckCircle size={20}/> Save All Orders</>}
          </button>
        </div>
      </div>
    </div>
  );
}
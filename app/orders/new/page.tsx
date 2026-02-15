// app/orders/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Calculator, AlertCircle, Calendar, Package } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp, getDocs, doc, updateDoc, increment } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]); // ইনভেন্টরি লিস্ট

  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    address: "",
    productName: "",
    productId: "", // স্টক কমানোর জন্য প্রোডাক্ট আইডি লাগবে
    salePrice: "",
    costPrice: "",
    courierCharge: 120, 
    packagingCost: 10,
    note: "",
    customDate: "",
  });

  const [netProfit, setNetProfit] = useState(0);

  // ১. ইনভেন্টরি থেকে প্রোডাক্ট লোড করা
  useEffect(() => {
    const fetchInventory = async () => {
      const snap = await getDocs(collection(db, "inventory"));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setInventoryItems(items);
    };
    fetchInventory();
  }, []);

  // ২. প্রফিট ক্যালকুলেশন
  useEffect(() => {
    const sale = Number(formData.salePrice) || 0;
    const cost = Number(formData.costPrice) || 0;
    const courier = Number(formData.courierCharge) || 0;
    const pack = Number(formData.packagingCost) || 0;
    setNetProfit(sale - (cost + courier + pack));
  }, [formData]);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ৩. প্রোডাক্ট সিলেক্ট করলে অটোমেটিক Buying Price সেট হবে
  const handleProductSelect = (e: any) => {
    const selectedId = e.target.value;
    const selectedItem = inventoryItems.find(item => item.id === selectedId);

    if (selectedItem) {
      setFormData({
        ...formData,
        productName: selectedItem.name,
        productId: selectedItem.id,
        costPrice: selectedItem.buyPrice, // অটোমেটিক কেনা দাম বসবে
        salePrice: selectedItem.sellPrice || "", // যদি সেলিং প্রাইস সেট করা থাকে
      });
    } else {
       // যদি "Custom Product" সিলেক্ট করে
       setFormData({ ...formData, productName: "", productId: "", costPrice: "", salePrice: "" });
    }
  };

  // ৪. অর্ডার সেভ এবং স্টক আপডেট (Sync)
  const handleSaveOrder = async () => {
    if (!formData.customerName || !formData.salePrice) {
      alert("Please fill in Customer Name and Sale Price!");
      return;
    }

    setLoading(true);

    try {
      const orderDate = formData.customDate ? new Date(formData.customDate) : new Date();

      // ১. অর্ডার সেভ করা
      await addDoc(collection(db, "orders"), {
        ...formData,
        salePrice: Number(formData.salePrice),
        costPrice: Number(formData.costPrice),
        courierCharge: Number(formData.courierCharge),
        packagingCost: Number(formData.packagingCost),
        netProfit: netProfit,
        status: "Pending",
        createdAt: Timestamp.fromDate(orderDate),
        invoice: "INV-" + Math.floor(10000 + Math.random() * 90000),
      });

      // ২. ইনভেন্টরি স্টক কমানো (যদি ইনভেন্টরি থেকে সিলেক্ট করা হয়)
      if (formData.productId) {
        const productRef = doc(db, "inventory", formData.productId);
        await updateDoc(productRef, {
           stock: increment(-1) // স্টক ১ কমে যাবে
        });
      }

      alert("✅ Order Placed & Stock Updated!");
      router.push("/orders");

    } catch (error) {
      console.error("Error:", error);
      alert("❌ Failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <h1 className="text-2xl font-bold text-zinc-800 flex items-center gap-2 border-l-4 border-red-600 pl-3">
        Create New Order (Sync Mode)
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* বাম পাশ: ফর্ম */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4 text-zinc-700 flex items-center gap-2"><Calendar size={18}/> Date</h3>
            <input type="date" name="customDate" className="w-full p-3 border rounded-lg bg-gray-50" onChange={handleChange} />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
            <h3 className="font-bold text-lg mb-4 text-zinc-700">Customer & Product</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input type="text" name="customerName" placeholder="Customer Name *" className="w-full p-3 border rounded-lg" onChange={handleChange} />
              <input type="text" name="phone" placeholder="Phone Number" className="w-full p-3 border rounded-lg" onChange={handleChange} />
            </div>

            {/* PRODUCT DROPDOWN (NEW) */}
            <div className="mb-4">
              <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Select Product (From Inventory)</label>
              <div className="relative">
                <select 
                  onChange={handleProductSelect}
                  className="w-full p-3 border rounded-lg appearance-none bg-zinc-50 outline-none focus:border-red-500"
                >
                  <option value="">-- Select a Product --</option>
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Stock: {item.stock})
                    </option>
                  ))}
                  <option value="">Other / Custom Product</option>
                </select>
                <Package className="absolute right-4 top-3.5 text-zinc-400" size={20}/>
              </div>
            </div>

            {/* যদি কাস্টম প্রোডাক্ট হয় তবে নাম লেখার অপশন */}
            {!formData.productId && (
               <input type="text" name="productName" placeholder="Or Type Product Name Manually..." className="w-full p-3 border rounded-lg bg-yellow-50" onChange={handleChange} />
            )}

            <textarea name="address" placeholder="Address" rows={2} className="w-full p-3 border rounded-lg mt-4" onChange={handleChange} />
          </div>
        </div>

        {/* ডান পাশ: ক্যালকুলেটর */}
        <div className="space-y-6">
          <div className="bg-zinc-900 text-white p-6 rounded-xl shadow-xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-zinc-100"><Calculator size={20} /> Profit Calculator</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 uppercase font-bold">Sale Price (TK) *</label>
                <input type="number" name="salePrice" value={formData.salePrice} className="w-full p-3 rounded bg-zinc-800 border border-zinc-700 text-white font-bold text-lg" onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">Buying Cost</label>
                  <input type="number" name="costPrice" value={formData.costPrice} className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white" onChange={handleChange} />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Packaging</label>
                  <input type="number" name="packagingCost" defaultValue={10} className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white" onChange={handleChange} />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400">Courier Charge</label>
                <input type="number" name="courierCharge" defaultValue={120} className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white" onChange={handleChange} />
              </div>
              <div className="border-t border-zinc-700 pt-4 mt-4 flex justify-between items-center">
                  <span className="text-zinc-400 font-medium">Net Profit</span>
                  <span className={`text-3xl font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>৳ {netProfit}</span>
              </div>
            </div>
          </div>
          <button onClick={handleSaveOrder} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
            {loading ? "Processing..." : <><CheckCircle size={20} /> Confirm Order</>}
          </button>
           <p className="text-xs text-gray-500 text-center">Stock will decrease automatically.</p>
        </div>
      </div>
    </div>
  );
}
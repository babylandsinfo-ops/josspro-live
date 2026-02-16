"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, doc, updateDoc, increment } from "firebase/firestore"; // increment ইম্পোর্ট করা হয়েছে স্টক কমানোর জন্য
import { useRouter } from "next/navigation";
import { Save, User, MapPin, Phone, ShoppingBag, Calculator, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    address: "",
    productId: "",
    productName: "",
    salePrice: 0,
    deliveryCharge: 60, 
    packagingCost: 10,
    note: ""
  });

  const [selectedProductData, setSelectedProductData] = useState<any>(null);

  // ১. ইনভেন্টরি থেকে প্রোডাক্ট লোড করা (নাম ঠিক করা হয়েছে)
  useEffect(() => {
    const fetchProducts = async () => {
      // ⚠️ আগে এখানে "products" ছিল, এখন "inventory" করা হয়েছে
      const snapshot = await getDocs(collection(db, "inventory")); 
      
      const productList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
           id: doc.id,
           ...data,
           // ফিল্ডের নাম ঠিক করা (যদি ডাটাবেসে নাম ভিন্ন থাকে)
           name: data.name || data.productName || "No Name", 
           stock: data.stock || 0,
           // আপনার ইনভেন্টরিতে 'buyPrice' বা 'purchasePrice' যেটা আছে সেটাই নিবে
           purchasePrice: data.buyPrice || data.purchasePrice || 0,
           salePrice: data.salePrice || data.sellingPrice || 0
        };
      });
      setProducts(productList);
    };
    fetchProducts();
  }, []);

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    const product = products.find(p => p.id === pId);
    
    if (product) {
      setSelectedProductData(product);
      setFormData({
        ...formData,
        productId: pId,
        productName: product.name,
        // ইনভেন্টরির সেলিং প্রাইস থাকলে সেটা বসবে, না থাকলে ০
        salePrice: Number(product.salePrice) || 0 
      });
    } else {
      setSelectedProductData(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // লাভ ক্যালকুলেশন
  const buyingPrice = Number(selectedProductData?.purchasePrice) || 0;
  const totalSale = Number(formData.salePrice);
  const delivery = Number(formData.deliveryCharge);
  const packaging = Number(formData.packagingCost);
  const totalBill = totalSale + delivery;
  const netProfit = totalSale - buyingPrice - packaging;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId) {
        alert("Please select a product first!");
        return;
    }
    setLoading(true);

    try {
      // ১. অর্ডার সেভ করা
      await addDoc(collection(db, "orders"), {
        customerName: formData.customerName,
        phone: formData.phone,
        address: formData.address,
        productName: formData.productName,
        productId: formData.productId,
        
        salePrice: totalSale,
        deliveryCharge: delivery,
        totalAmount: totalBill,
        
        purchasePrice: buyingPrice,
        packagingCost: packaging,
        netProfit: netProfit,

        status: "Pending",
        courier: "Manual",
        createdAt: serverTimestamp(),
        source: "Manual Entry"
      });

      // ২. ইনভেন্টরি থেকে ১ পিস স্টক কমানো (Auto Stock Decrease)
      const productRef = doc(db, "inventory", formData.productId);
      await updateDoc(productRef, {
        stock: increment(-1)
      });

      alert("Order Saved & Stock Updated!");
      router.push("/orders"); 
    } catch (error) {
      console.error("Error:", error);
      alert("Error saving order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 text-white">
      <Link href="/orders" className="flex items-center text-zinc-400 hover:text-white mb-6">
        <ArrowLeft size={20} className="mr-2" /> Back to Orders
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ShoppingBag className="text-red-500"/> New Order Entry
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Product Select */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Select Product</label>
              <select 
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 focus:ring-2 focus:ring-red-600 outline-none"
                onChange={handleProductChange}
                required
              >
                <option value="">-- Select Inventory Item --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stock}) - Buy: {p.purchasePrice}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm text-zinc-400 mb-1 block flex items-center gap-2"><User size={14}/> Customer Name</label>
                <input name="customerName" required placeholder="Name from WhatsApp" onChange={handleChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 outline-none focus:border-red-500"/>
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block flex items-center gap-2"><Phone size={14}/> Mobile Number</label>
                <input name="phone" required placeholder="017..." onChange={handleChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 outline-none focus:border-red-500"/>
              </div>
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block flex items-center gap-2"><MapPin size={14}/> Full Address</label>
              <textarea name="address" required rows={3} placeholder="Full address with Thana/District" onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 outline-none focus:border-red-500"/>
            </div>

            {/* Price Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Sale Price (Product)</label>
                <input type="number" name="salePrice" value={formData.salePrice} onChange={handleChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 font-bold text-white outline-none focus:border-red-500"/>
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Delivery Charge</label>
                <input type="number" name="deliveryCharge" value={formData.deliveryCharge} onChange={handleChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 outline-none focus:border-red-500"/>
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Packaging Cost</label>
                <input type="number" name="packagingCost" value={formData.packagingCost} onChange={handleChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-500 outline-none"/>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg flex justify-center items-center gap-2 mt-4">
              {loading ? "Saving..." : <><Save size={20}/> Confirm Order</>}
            </button>
          </form>
        </div>

        {/* Calculator */}
        <div className="bg-black p-6 rounded-2xl border border-zinc-800 h-fit sticky top-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-zinc-300">
            <Calculator size={20}/> Order Summary
          </h2>

          <div className="space-y-4 text-sm">
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
              <p className="text-zinc-500 text-xs uppercase font-bold mb-2">Customer Payable</p>
              <div className="flex justify-between mb-1">
                <span>Product Price</span>
                <span>৳ {totalSale}</span>
              </div>
              <div className="flex justify-between mb-1 text-zinc-400">
                <span>Delivery Charge</span>
                <span>+ ৳ {delivery}</span>
              </div>
              <div className="border-t border-zinc-700 my-2 pt-2 flex justify-between font-bold text-lg text-white">
                <span>Total Bill (COD)</span>
                <span>৳ {totalBill}</span>
              </div>
            </div>

            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
              <p className="text-zinc-500 text-xs uppercase font-bold mb-2">Internal Profit Check</p>
              <div className="flex justify-between mb-1 text-red-400">
                <span>(-) Buying Cost</span>
                <span>৳ {buyingPrice}</span>
              </div>
              <div className="flex justify-between mb-1 text-red-400">
                <span>(-) Packaging</span>
                <span>৳ {packaging}</span>
              </div>
              <div className={`border-t border-zinc-700 my-2 pt-2 flex justify-between font-bold text-xl ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                <span>Net Profit</span>
                <span>৳ {netProfit}</span>
              </div>
              <p className="text-xs text-zinc-600 mt-1">* Delivery charge is passed to courier</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
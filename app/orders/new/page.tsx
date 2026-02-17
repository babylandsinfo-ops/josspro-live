"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, doc, updateDoc, increment } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Save, User, MapPin, Phone, ShoppingBag, Calculator, ArrowLeft, MessageCircle, Send } from "lucide-react"; 
import Link from "next/link";

// ১. সংখ্যা ক্লিন করার ফাংশন
const parseNumber = (value: any) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, ""); 
    return parseFloat(cleaned) || 0;
  }
  return 0;
};

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  
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

  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, "inventory")); 
      const productList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
           id: doc.id,
           ...data,
           name: data.name || data.productName || "No Name", 
           stock: parseNumber(data.stock),
           purchasePrice: parseNumber(data.buyPrice) || parseNumber(data.purchasePrice),
           salePrice: parseNumber(data.salePrice) || parseNumber(data.sellingPrice)
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
        salePrice: Number(product.salePrice) || 0 
      });
    } else {
      setSelectedProductData(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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

      const productRef = doc(db, "inventory", formData.productId);
      await updateDoc(productRef, {
        stock: increment(-1)
      });

      setShowSuccess(true); 

    } catch (error) {
      console.error("Error:", error);
      alert("Error saving order.");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 ১. অফিস গ্রুপের জন্য স্পেশাল ফরম্যাট (আপনার দেওয়া ফরম্যাট)
  const getOfficeMessage = () => {
    return `- নাম: ${formData.customerName}
- ঠিকানাঃ- ${formData.address}
- মোবাইল নাম্বার:
     ${formData.phone}

.    ${formData.productName}-${totalBill} /-
ধন্যবাদ 💙`;
  };

  // 🔥 ২. কাস্টমারের জন্য (Welcome + Cross Sell Hook)
  const getCustomerMessage = () => {
    return `আসসালামু আলাইকুম, ${formData.customerName}! 🌸
আমাদের শপ থেকে অর্ডার করার জন্য আপনাকে অসংখ্য ধন্যবাদ।

✅ আপনার অর্ডারটি কনফার্ম করা হয়েছে।
📦 প্রোডাক্ট: ${formData.productName}
💰 মোট বিল: ${totalBill} টাকা (ডেলিভারি চার্জ সহ)

💡 আপনার কিচেনকে আরও স্মার্ট করতে আমাদের কাছে আরও আছে - ভেজিটেবল কাটার, পুশ চপার এবং কফি মিক্সার! 
প্রয়োজন হলে জানাতে পারেন, আমরা একসাথেই পাঠিয়ে দেব। 🎁

ধন্যবাদান্তে,
JOSS PRO`;
  };

  // ৩. অফিস গ্রুপে পাঠানোর ফাংশন
  const sendToGroup = () => {
    const encodedMessage = encodeURIComponent(getOfficeMessage());
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  // ৪. কাস্টমারকে পাঠানোর ফাংশন
  const sendToCustomer = () => {
    let cleanPhone = formData.phone.replace(/\D/g, ""); 
    if (!cleanPhone.startsWith("88")) {
        cleanPhone = "88" + cleanPhone;
    }
    const encodedMessage = encodeURIComponent(getCustomerMessage());
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, "_blank");
  };

  return (
    <div className="max-w-6xl mx-auto p-4 text-white relative">
      <Link href="/orders" className="flex items-center text-zinc-400 hover:text-white mb-6">
        <ArrowLeft size={20} className="mr-2" /> Back to Orders
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ফর্ম সেকশন */}
        <div className="lg:col-span-2 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ShoppingBag className="text-red-500"/> New Order Entry
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                    {p.name} (Stock: {p.stock})
                  </option>
                ))}
              </select>
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Sale Price</label>
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

        {/* ক্যালকুলেটর */}
        <div className="bg-black p-6 rounded-2xl border border-zinc-800 h-fit sticky top-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-zinc-300">
            <Calculator size={20}/> Order Summary
          </h2>
          <div className="space-y-4 text-sm">
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
              <p className="text-zinc-500 text-xs uppercase font-bold mb-2">Customer Payable</p>
              <div className="flex justify-between mb-1"><span>Product Price</span><span>৳ {totalSale}</span></div>
              <div className="flex justify-between mb-1 text-zinc-400"><span>Delivery Charge</span><span>+ ৳ {delivery}</span></div>
              <div className="border-t border-zinc-700 my-2 pt-2 flex justify-between font-bold text-lg text-white"><span>Total Bill (COD)</span><span>৳ {totalBill}</span></div>
            </div>
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
              <p className="text-zinc-500 text-xs uppercase font-bold mb-2">Internal Profit Check</p>
              <div className="flex justify-between mb-1 text-red-400"><span>(-) Buying Cost</span><span>৳ {buyingPrice}</span></div>
              <div className="flex justify-between mb-1 text-red-400"><span>(-) Packaging</span><span>৳ {packaging}</span></div>
              <div className={`border-t border-zinc-700 my-2 pt-2 flex justify-between font-bold text-xl ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}><span>Net Profit</span><span>৳ {netProfit}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 SUCCESS MODAL 🔥 */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-zinc-900 p-8 rounded-2xl w-full max-w-sm border border-zinc-700 shadow-2xl text-center animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-black animate-bounce">
                    <Save size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Order Saved!</h2>
                <p className="text-zinc-400 mb-6">Choose where to send the confirmation:</p>
                
                {/* ১. কাস্টমারকে পাঠানোর বাটন */}
                <button 
                    onClick={sendToCustomer}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mb-3 shadow-lg transition-all"
                >
                    <Send size={20} /> Send to Customer (With Offer)
                </button>

                {/* ২. অফিস গ্রুপে পাঠানোর বাটন */}
                <button 
                    onClick={sendToGroup}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mb-3 border border-zinc-600 transition-all"
                >
                    <MessageCircle size={20} /> Send to Office Group
                </button>
                
                <button 
                    onClick={() => router.push("/orders")}
                    className="text-zinc-500 hover:text-white text-sm mt-2 underline"
                >
                    Skip & Go to List
                </button>
            </div>
        </div>
      )}

    </div>
  );
}
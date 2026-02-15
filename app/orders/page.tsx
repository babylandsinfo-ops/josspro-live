// app/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Search, Eye, TrendingUp, TrendingDown, Trash2, RefreshCw } from "lucide-react";

export default function AllOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // ডাটাবেস থেকে অর্ডার লোড করা
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 🔄 স্ট্যাটাস আপডেট ফাংশন
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
      
      // লোডিং ছাড়াই সাথে সাথে টেবিলে আপডেট দেখাবে
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      // সাকসেস মেসেজ (অপশনাল)
      // alert(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status!");
    }
  };

  // 🗑️ অর্ডার ডিলিট ফাংশন
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      await deleteDoc(doc(db, "orders", id));
      fetchOrders(); // রিফ্রেশ
    }
  };

  // সার্চ ফিল্টার
  const filteredOrders = orders.filter(order => 
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.phone?.includes(searchTerm) ||
    order.invoice?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* হেডার এবং সার্চ বার */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
           <h1 className="text-2xl font-bold text-zinc-800 flex items-center gap-2">
             <span className="bg-red-600 w-1.5 h-6 rounded-full"></span>
             All Orders List
           </h1>
           <p className="text-sm text-zinc-500 ml-3.5">Total Orders: {orders.length}</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search invoice, name..." 
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={fetchOrders} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-zinc-600" title="Refresh List">
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* অর্ডার টেবিল */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Invoice</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Customer</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Product</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase text-right">Price</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase text-center">Profit</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase text-center">Status (Action)</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase text-center">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="p-10 text-center text-zinc-400">Loading orders...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-zinc-400">No orders found.</td></tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-red-50/10 transition group">
                    
                    {/* Invoice */}
                    <td className="p-4">
                      <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded">
                        #{order.invoice || "N/A"}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="p-4">
                      <p className="font-bold text-zinc-800 text-sm">{order.customerName}</p>
                      <p className="text-xs text-zinc-500">{order.phone}</p>
                    </td>

                    {/* Product */}
                    <td className="p-4 text-sm text-zinc-700 font-medium">{order.productName}</td>

                    {/* Price */}
                    <td className="p-4 text-right font-bold text-zinc-800">৳ {order.salePrice}</td>

                    {/* Profit */}
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 font-bold px-2 py-1 rounded text-xs ${order.netProfit >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                        {order.netProfit >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                        {order.netProfit}
                      </span>
                    </td>

                    {/* 🛠️ STATUS CHANGE DROPDOWN */}
                    <td className="p-4 text-center">
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`px-3 py-1.5 rounded text-xs font-bold border outline-none cursor-pointer transition-colors ${
                          order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          order.status === 'Returned' ? 'bg-red-100 text-red-700 border-red-200' :
                          order.status === 'Shipped' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          order.status === 'Cancelled' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                          'bg-orange-100 text-orange-700 border-orange-200' // Pending Default
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Returned">Returned</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Delete Action */}
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDelete(order.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete Order"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
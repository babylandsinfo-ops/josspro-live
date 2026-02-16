"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Trash2, Search, Loader2 } from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // ডাটা লোড করা
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(ordersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // স্ট্যাটাস আপডেট ফাংশন
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  // ডিলিট ফাংশন
  const handleDelete = async (id: string) => {
    if(confirm('Are you sure you want to delete this order?')) {
        await deleteDoc(doc(db, 'orders', id));
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.phone?.includes(searchTerm)
  );

  // স্ট্যাটাস অনুযায়ী রং
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered": return "bg-green-600 text-white";
      case "Returned": return "bg-red-600 text-white";
      case "In Transit": return "bg-blue-600 text-white";
      case "Pending": return "bg-yellow-600 text-black";
      default: return "bg-zinc-700 text-white";
    }
  };

  if (loading) return <div className="p-10 text-white text-center flex justify-center"><Loader2 className="animate-spin text-red-600"/></div>;

  return (
    <div className="p-6 text-white min-h-screen animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-red-500">All Orders</h1>
          <p className="text-zinc-400">Total: {orders.length} orders found</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 bg-zinc-900 flex items-center p-4 rounded-xl border border-zinc-800">
        <Search className="text-zinc-400 mr-2" />
        <input
          type="text"
          placeholder="Search by Name or Phone..."
          className="bg-transparent w-full text-white outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-x-auto">
        <table className="w-full text-left text-zinc-300">
          <thead className="bg-zinc-800 text-zinc-100 uppercase text-xs">
            <tr>
              <th className="p-4">Customer</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Product</th>
              <th className="p-4">Price (COD)</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-zinc-800 transition-colors">
                <td className="p-4">
                    <p className="font-bold text-white">{order.customerName}</p>
                    <p className="text-xs text-zinc-500">{order.address}</p>
                </td>
                <td className="p-4">{order.phone}</td>
                <td className="p-4 text-sm">{order.productName || "N/A"}</td>
                <td className="p-4 font-mono text-white font-bold">৳ {order.totalAmount}</td>
                
                {/* Status Dropdown */}
                <td className="p-4">
                  <select
                    value={order.status || "Pending"}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className={`px-3 py-1 rounded text-xs font-bold border-none outline-none cursor-pointer ${getStatusColor(order.status)}`}
                  >
                    <option className="bg-zinc-800 text-white" value="Pending">Pending</option>
                    <option className="bg-zinc-800 text-white" value="In Transit">In Transit</option>
                    <option className="bg-zinc-800 text-white" value="Delivered">Delivered</option>
                    <option className="bg-zinc-800 text-white" value="Returned">Returned</option>
                  </select>
                </td>

                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleDelete(order.id)}
                    className="text-zinc-500 hover:text-red-500 p-2 transition-colors"
                    title="Delete Order"
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="p-10 text-center text-zinc-500">
            No orders found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
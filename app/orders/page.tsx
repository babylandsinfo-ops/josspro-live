"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, writeBatch, Timestamp } from "firebase/firestore";
import { Trash2, Search, Loader2, Edit, X, Save, Calendar, CheckSquare } from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState(""); 
  
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // এডিট স্টেট (তারিখ যুক্ত করা হয়েছে)
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    customerName: "",
    phone: "",
    address: "",
    salePrice: 0,
    deliveryCharge: 0,
    orderDate: "" // 🔥 নতুন: ডেট এডিট করার জন্য
  });

  // ১. ডাটা লোড
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

  // ২. হেল্পার: টাইমস্ট্যাম্প থেকে স্ট্রিং ডেট
  const getDateString = (timestamp: any) => {
    if (!timestamp) return "";
    let date;
    
    // ফায়ারবেস টাইমস্ট্যাম্প নাকি জাভাস্ক্রিপ্ট ডেট অবজেক্ট চেক
    if (timestamp?.toDate) {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        // স্ট্রিং বা অন্য ফরম্যাট হলে
        date = new Date(timestamp);
    }

    // যদি ইনভ্যালিড ডেট হয়
    if (isNaN(date.getTime())) return "";

    return date.toISOString().split('T')[0];
  };

  // ৩. ফিল্টারিং
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone?.includes(searchTerm);
    const orderDate = getDateString(order.createdAt);
    const matchesDate = filterDate ? orderDate === filterDate : true;
    return matchesSearch && matchesDate;
  });

  // ৪. বাল্ক সিলেকশন
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = filteredOrders.map(o => o.id);
      setSelectedOrders(allIds);
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter(orderId => orderId !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  // ৫. বাল্ক ডিলিট
  const handleBulkDelete = async () => {
    if (!selectedOrders.length) return;
    if (!confirm(`Are you sure you want to delete ${selectedOrders.length} orders?`)) return;

    try {
      const batch = writeBatch(db);
      selectedOrders.forEach((id) => {
        const docRef = doc(db, "orders", id);
        batch.delete(docRef);
      });
      await batch.commit();
      setSelectedOrders([]); 
      alert("Deleted successfully!");
    } catch (error) {
      console.error(error);
    }
  };

  // 🔥 ৬. এডিট ওপেন (ডেট সহ)
  const handleEditClick = (order: any) => {
    setEditingOrder(order);
    // বর্তমানে সেভ করা ডেট বের করা
    const currentdate = getDateString(order.createdAt);

    setEditForm({
      customerName: order.customerName,
      phone: order.phone,
      address: order.address,
      salePrice: order.salePrice,
      deliveryCharge: order.deliveryCharge,
      orderDate: currentdate // ইনপুটে দেখানোর জন্য
    });
  };

  // 🔥 ৭. এডিট আপডেট (ডেট সেভ করা)
  const handleUpdateOrder = async () => {
    if (!editingOrder) return;
    try {
      const totalAmount = Number(editForm.salePrice) + Number(editForm.deliveryCharge);
      
      // নতুন ডেট অবজেক্ট বানানো
      const newDateObj = new Date(editForm.orderDate);

      await updateDoc(doc(db, "orders", editingOrder.id), {
        customerName: editForm.customerName,
        phone: editForm.phone,
        address: editForm.address,
        salePrice: Number(editForm.salePrice),
        deliveryCharge: Number(editForm.deliveryCharge),
        totalAmount: totalAmount,
        createdAt: newDateObj // 🔥 ডেট আপডেট হবে
      });
      
      setEditingOrder(null);
      alert("Order & Date Updated!");
    } catch (error) {
      console.error(error);
      alert("Update Failed");
    }
  };

  // ৮. সিঙ্গেল ডিলিট
  const handleDelete = async (id: string) => {
    if(confirm('Delete this order?')) {
        await deleteDoc(doc(db, 'orders', id));
    }
  };

  // ৯. স্ট্যাটাস আপডেট
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await updateDoc(doc(db, "orders", orderId), { status: newStatus });
  };
  
  if (loading) return <div className="p-10 text-white text-center flex justify-center"><Loader2 className="animate-spin text-red-600"/></div>;

  return (
    <div className="p-6 text-white min-h-screen animate-in fade-in relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-red-500">All Orders</h1>
          <p className="text-zinc-400">
            {selectedOrders.length > 0 
              ? <span className="text-white font-bold">{selectedOrders.length} Selected</span> 
              : `Total Found: ${filteredOrders.length}`}
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
            
            {/* বাল্ক ডিলিট */}
            {selectedOrders.length > 0 && (
                <button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 animate-in zoom-in duration-200 shadow-lg shadow-red-900/50">
                    <Trash2 size={18}/> Delete ({selectedOrders.length})
                </button>
            )}

            {/* ডেট ফিল্টার */}
            <div className="bg-zinc-900 flex items-center p-3 rounded-xl border border-zinc-800">
                <Calendar className="text-zinc-400 mr-2" size={18}/>
                <input 
                    type="date" 
                    className="bg-transparent text-white outline-none text-sm"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                />
                 {filterDate && <button onClick={() => setFilterDate("")} className="ml-2 text-zinc-500 hover:text-white"><X size={14}/></button>}
            </div>

            {/* সার্চ বার */}
            <div className="bg-zinc-900 flex items-center p-3 rounded-xl border border-zinc-800 w-full md:w-64">
                <Search className="text-zinc-400 mr-2" size={18} />
                <input
                type="text"
                placeholder="Name or Phone..."
                className="bg-transparent w-full text-white outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-x-auto shadow-xl">
        <table className="w-full text-left text-zinc-300">
          <thead className="bg-zinc-800 text-zinc-100 uppercase text-xs">
            <tr>
              <th className="p-4 w-10">
                <input type="checkbox" onChange={handleSelectAll} checked={filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length} className="accent-red-600 w-4 h-4 cursor-pointer"/>
              </th>
              <th className="p-4">Date</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Product</th>
              <th className="p-4">Total</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700">
            {filteredOrders.map((order) => (
              <tr key={order.id} className={`hover:bg-zinc-800 transition-colors ${selectedOrders.includes(order.id) ? 'bg-zinc-800/80' : ''}`}>
                <td className="p-4">
                    <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => handleSelectRow(order.id)} className="accent-red-600 w-4 h-4 cursor-pointer"/>
                </td>

                <td className="p-4 text-xs text-zinc-500 font-mono">
                    {getDateString(order.createdAt)}
                </td>
                
                <td className="p-4">
                    <p className="font-bold text-white">{order.customerName}</p>
                    <p className="text-xs text-zinc-500 truncate max-w-[200px]">{order.address}</p>
                </td>
                <td className="p-4 font-mono text-sm">{order.phone}</td>
                <td className="p-4 text-sm">{order.productName || "N/A"}</td>
                <td className="p-4 font-mono text-white font-bold">৳ {order.totalAmount}</td>
                
                <td className="p-4">
                  <select
                    value={order.status || "Pending"}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className={`px-3 py-1 rounded text-xs font-bold border-none outline-none cursor-pointer 
                        ${order.status === 'Delivered' ? 'bg-green-600 text-white' : 
                          order.status === 'Returned' ? 'bg-red-600 text-white' : 
                          order.status === 'In Transit' ? 'bg-blue-600 text-white' : 'bg-yellow-600 text-black'}`}
                  >
                    <option className="bg-zinc-800 text-white" value="Pending">Pending</option>
                    <option className="bg-zinc-800 text-white" value="In Transit">In Transit</option>
                    <option className="bg-zinc-800 text-white" value="Delivered">Delivered</option>
                    <option className="bg-zinc-800 text-white" value="Returned">Returned</option>
                  </select>
                </td>

                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEditClick(order)} className="bg-zinc-800 hover:bg-blue-600 text-zinc-400 hover:text-white p-2 rounded-lg transition-colors">
                        <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(order.id)} className="bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white p-2 rounded-lg transition-colors">
                        <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredOrders.length === 0 && <div className="p-10 text-center text-zinc-500">No orders found.</div>}
      </div>

      {/* 🔥 EDIT MODAL (With Date Input) */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-md border border-zinc-700 shadow-2xl animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                    <h2 className="text-xl font-bold text-white">Edit Order</h2>
                    <button onClick={() => setEditingOrder(null)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
                </div>
                
                <div className="space-y-4">
                    {/* 🔥 ডেট চেঞ্জ করার ফিল্ড */}
                    <div>
                        <label className="text-xs text-zinc-400 uppercase font-bold">Order Date</label>
                        <input 
                            type="date"
                            value={editForm.orderDate} 
                            onChange={(e) => setEditForm({...editForm, orderDate: e.target.value})} 
                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 mt-1 text-white outline-none focus:border-red-500"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-zinc-400 uppercase font-bold">Customer Name</label>
                        <input value={editForm.customerName} onChange={(e) => setEditForm({...editForm, customerName: e.target.value})} className="w-full bg-black border border-zinc-700 rounded-lg p-3 mt-1 text-white outline-none"/>
                    </div>
                    <div>
                         <label className="text-xs text-zinc-400 uppercase font-bold">Phone</label>
                         <input value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-black border border-zinc-700 rounded-lg p-3 mt-1 text-white outline-none"/>
                    </div>
                    <div>
                        <label className="text-xs text-zinc-400 uppercase font-bold">Address</label>
                        <textarea value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} rows={2} className="w-full bg-black border border-zinc-700 rounded-lg p-3 mt-1 text-white outline-none"/>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-zinc-400 uppercase font-bold">Sale Price</label>
                            <input type="number" value={editForm.salePrice} onChange={(e) => setEditForm({...editForm, salePrice: Number(e.target.value)})} className="w-full bg-black border border-zinc-700 rounded-lg p-3 mt-1 text-white font-bold text-center outline-none"/>
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400 uppercase font-bold">Delivery</label>
                            <input type="number" value={editForm.deliveryCharge} onChange={(e) => setEditForm({...editForm, deliveryCharge: Number(e.target.value)})} className="w-full bg-black border border-zinc-700 rounded-lg p-3 mt-1 text-white text-center outline-none"/>
                        </div>
                    </div>
                    
                    <div className="pt-4 flex gap-3">
                        <button onClick={() => setEditingOrder(null)} className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-bold">Cancel</button>
                        <button onClick={handleUpdateOrder} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 font-bold flex items-center justify-center gap-2"><Save size={18}/> Update</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
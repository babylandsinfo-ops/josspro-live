// app/inventory/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Package, Plus, Search, Trash2, Save, X, Edit2, RefreshCcw } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // ফর্ম ডাটা
  const [currentItem, setCurrentItem] = useState({
    id: "",
    name: "",
    buyPrice: "",
    sellPrice: "",
    stock: "",
  });

  const fetchProducts = async () => {
    const querySnapshot = await getDocs(collection(db, "inventory"));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // সেভ বা আপডেট ফাংশন
  const handleSave = async () => {
    if (!currentItem.name || !currentItem.buyPrice) return alert("Fill all details!");
    setLoading(true);
    try {
      if (isEditing && currentItem.id) {
        // আপডেট (Edit Mode)
        const productRef = doc(db, "inventory", currentItem.id);
        await updateDoc(productRef, {
          name: currentItem.name,
          buyPrice: Number(currentItem.buyPrice),
          sellPrice: Number(currentItem.sellPrice),
          stock: Number(currentItem.stock),
        });
        alert("✅ Product Updated!");
      } else {
        // নতুন অ্যাড (Add Mode)
        await addDoc(collection(db, "inventory"), {
            name: currentItem.name,
            buyPrice: Number(currentItem.buyPrice),
            sellPrice: Number(currentItem.sellPrice),
            stock: Number(currentItem.stock),
        });
        alert("✅ Product Added!");
      }
      
      setShowModal(false);
      setCurrentItem({ id: "", name: "", buyPrice: "", sellPrice: "", stock: "" });
      fetchProducts();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setCurrentItem({
      id: item.id,
      name: item.name,
      buyPrice: item.buyPrice,
      sellPrice: item.sellPrice,
      stock: item.stock,
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if(confirm("Are you sure?")) {
      await deleteDoc(doc(db, "inventory", id));
      fetchProducts();
    }
  }

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentItem({ id: "", name: "", buyPrice: "", sellPrice: "", stock: "" });
    setShowModal(true);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-zinc-800 border-l-4 border-emerald-600 pl-3">
          Inventory Management
        </h1>
        <button onClick={openAddModal} className="bg-zinc-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-black transition shadow-lg">
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b">
            <tr>
              <th className="p-4 font-bold text-zinc-500">Product Name</th>
              <th className="p-4 font-bold text-zinc-500">Stock</th>
              <th className="p-4 font-bold text-zinc-500">Buying Price</th>
              <th className="p-4 font-bold text-zinc-500">Selling Price</th>
              <th className="p-4 font-bold text-zinc-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{item.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${Number(item.stock) < 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {item.stock} Units
                  </span>
                </td>
                <td className="p-4 text-zinc-500">৳ {item.buyPrice}</td>
                <td className="p-4 font-bold text-zinc-800">৳ {item.sellPrice}</td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={() => handleEdit(item)} className="bg-blue-50 text-blue-600 p-2 rounded hover:bg-blue-100" title="Edit / Restock">
                    <Edit2 size={16}/>
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="bg-red-50 text-red-500 p-2 rounded hover:bg-red-100" title="Delete">
                    <Trash2 size={16}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-96 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{isEditing ? "Update Product" : "Add New Product"}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-500"/></button>
            </div>
            
            <div className="space-y-3">
              <input 
                placeholder="Product Name" className="w-full p-2 border rounded"
                value={currentItem.name}
                onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-xs text-gray-500">Buy Price</label>
                    <input type="number" className="w-full p-2 border rounded" value={currentItem.buyPrice} onChange={(e) => setCurrentItem({...currentItem, buyPrice: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-xs text-gray-500">Sell Price</label>
                    <input type="number" className="w-full p-2 border rounded" value={currentItem.sellPrice} onChange={(e) => setCurrentItem({...currentItem, sellPrice: e.target.value})} />
                 </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-bold">Current Stock</label>
                <input type="number" className="w-full p-2 border rounded font-bold text-lg" value={currentItem.stock} onChange={(e) => setCurrentItem({...currentItem, stock: e.target.value})} />
              </div>
              
              <button 
                onClick={handleSave} disabled={loading}
                className="w-full bg-zinc-900 hover:bg-black text-white py-3 rounded-lg font-bold flex justify-center gap-2 mt-4"
              >
                {loading ? "Saving..." : <><Save size={18}/> {isEditing ? "Update Stock" : "Save Product"}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
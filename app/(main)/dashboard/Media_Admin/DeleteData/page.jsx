"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/app/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, query, orderBy, updateDoc } from "firebase/firestore";
import { useAuth } from "@/app/context/AuthContext";
import { MdDeleteForever, MdEdit, MdClose, MdSave, MdLocationOn } from "react-icons/md";

export default function DeleteDataPage() {
  const { user, loading: authLoading } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const q = query(collection(db, "Jagaban_results"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResults(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- ACTIONS ---
  
  const handleDelete = async (id, candidateName) => {
    if (confirm(`⚠️ PERMANENTLY delete result for ${candidateName}?`)) {
      try {
        await deleteDoc(doc(db, "Jagaban_results", id));
      } catch (error) {
        alert("❌ Failed to delete record.");
      }
    }
  };

  const startEdit = (item) => {
    setEditingItem(item.id);
    setEditForm({ ...item });
  };

  const handleUpdate = async () => {
    try {
      const { id, ...updatedData } = editForm;
      // Recalculate percentage in case votes changed
      const validVotes = Number(editForm.totalOverallVotes) - Number(editForm.invalidVotes);
      updatedData.percentage = validVotes > 0 
        ? ((Number(editForm.individualVotes) / validVotes) * 100).toFixed(2) 
        : "0.00";

      await updateDoc(doc(db, "Jagaban_results", editingItem), updatedData);
      setEditingItem(null);
      alert("✅ Record Updated!");
    } catch (error) {
      alert("❌ Update failed");
    }
  };

  if (authLoading || loading) return <div className="p-10 text-center font-black animate-pulse text-amber-600 bg-[#020617] min-h-screen flex items-center justify-center">ACCESSING SECURE LEDGER...</div>;

  return (
    <div className="p-4 md:p-10 bg-[#020617] min-h-screen text-slate-200">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="border-l-4 border-red-600 pl-6">
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Data Integrity <span className="text-red-600">Control</span></h1>
            <p className="text-slate-500 font-bold text-xs uppercase mt-1 tracking-[0.3em]">
              Authorized Personnel: {user?.data?.fullName || "Admin"}
            </p>
          </div>
          <div className="flex gap-4">
             <div className="bg-slate-900 px-8 py-4 rounded-[2rem] border border-slate-800 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase">Synchronized Entries</p>
                <p className="text-3xl font-black text-amber-500">{results.length}</p>
             </div>
          </div>
        </header>

        {/* MAIN DATA GRID */}
        <div className="grid grid-cols-1 gap-4">
          {results.map((item) => (
            <div key={item.id} className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-6 hover:border-slate-600 transition group relative overflow-hidden">
              
              {/* EDITING OVERLAY */}
              {editingItem === item.id ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in zoom-in duration-200">
                  <div className="md:col-span-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Name</label>
                    <input value={editForm.name} onChange={(e)=>setEditForm({...editForm, name: e.target.value})} className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700 text-sm font-bold" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Votes</label>
                    <input type="number" value={editForm.individualVotes} onChange={(e)=>setEditForm({...editForm, individualVotes: e.target.value})} className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700 text-sm font-black text-amber-500" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Remarks</label>
                    <input value={editForm.remarks} onChange={(e)=>setEditForm({...editForm, remarks: e.target.value})} className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs italic" />
                  </div>
                  <div className="flex items-end gap-2">
                    <button onClick={handleUpdate} className="flex-1 bg-green-600 p-3 rounded-xl hover:bg-green-500 transition flex items-center justify-center"><MdSave size={20}/></button>
                    <button onClick={()=>setEditingItem(null)} className="flex-1 bg-slate-700 p-3 rounded-xl hover:bg-slate-600 transition flex items-center justify-center"><MdClose size={20}/></button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Info Section */}
                  <div className="flex items-center gap-6 flex-1 w-full">
                    <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
                      {item.resultPhotoUrl ? <img src={item.resultPhotoUrl} className="w-full h-full object-cover rounded-2xl" /> : <MdLocationOn size={24}/>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-red-600/10 text-red-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">{item.position}</span>
                        <span className="text-slate-600 text-[10px] font-bold">Constituency: {item.constituency}</span>
                      </div>
                      <h3 className="text-xl font-black text-white uppercase italic tracking-tight mt-1">{item.name}</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Captured by: {item.submittedBy}</p>
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div className="flex items-center gap-8 px-8 border-x border-slate-800/50">
                    <div className="text-center">
                        <p className="text-[9px] font-black text-slate-600 uppercase">Tally</p>
                        <p className="text-2xl font-black text-white">{item.individualVotes}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[9px] font-black text-slate-600 uppercase">Share</p>
                        <p className="text-xl font-black text-amber-500">{item.percentage}%</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button 
                      onClick={() => startEdit(item)}
                      className="w-12 h-12 bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white rounded-2xl transition flex items-center justify-center shadow-lg"
                    >
                      <MdEdit size={20} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id, item.name)}
                      className="w-12 h-12 bg-slate-800 text-slate-400 hover:bg-red-600 hover:text-white rounded-2xl transition flex items-center justify-center shadow-lg"
                    >
                      <MdDeleteForever size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {results.length === 0 && (
          <div className="p-20 text-center border-2 border-dashed border-slate-800 rounded-[3rem]">
            <p className="text-slate-600 font-black uppercase text-xs tracking-widest italic">Database Empty: No Records Synchronized</p>
          </div>
        )}
      </div>
    </div>
  );
}
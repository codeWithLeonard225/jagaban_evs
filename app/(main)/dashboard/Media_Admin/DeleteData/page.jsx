"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/app/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { useAuth } from "@/app/context/AuthContext";
import { MdDeleteForever } from "react-icons/md";

export default function DeleteDataPage() {
  const { user, loading: authLoading } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "Jagaban_results"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResults(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id, candidateName) => {
    const confirmDelete = confirm(`⚠️ PERMANENTLY delete result for ${candidateName}?`);
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "Jagaban_results", id));
      } catch (error) {
        alert("❌ Failed to delete record.");
      }
    }
  };

  if (authLoading || loading) return <div className="p-10 text-center font-black animate-pulse text-red-600">LOADING DATABASE...</div>;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* RESPONSIVE HEADER */}
        <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-red-700 uppercase leading-none">Delete Management</h1>
            <p className="text-gray-500 font-bold text-[10px] md:text-xs uppercase mt-1 tracking-wider">
              Admin: {user?.data?.fullName || "Authorized"}
            </p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center min-w-[120px]">
            <p className="text-[10px] font-black text-gray-400 uppercase">Total Entries</p>
            <p className="text-xl md:text-2xl font-black text-blue-900">{results.length}</p>
          </div>
        </header>

        {/* TABLE CONTAINER */}
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border border-gray-200">
          
          {/* DESKTOP TABLE (Hidden on Mobile) */}
          <div className="hidden md:block">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900 text-white uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="p-5">Candidate & Position</th>
                  <th className="p-5">Location</th>
                  <th className="p-5 text-center">Votes</th>
                  <th className="p-5">Submitted By</th>
                  <th className="p-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {results.map((item) => (
                  <tr key={item.id} className="hover:bg-red-50/50 transition">
                    <td className="p-5">
                      <p className="font-black text-blue-900 uppercase text-sm">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{item.position}</p>
                    </td>
                    <td className="p-5">
                      <p className="font-bold text-gray-700">{item.constituency}</p>
                      <p className="text-[10px] text-gray-500 uppercase">{item.district}</p>
                    </td>
                    <td className="p-5 text-center font-black text-lg text-gray-800">{item.individualVotes}</td>
                    <td className="p-5">
                      <p className="text-[10px] font-bold text-gray-500 uppercase">{item.submittedBy}</p>
                      <p className="text-[9px] text-gray-400 italic">
                        {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : "New"}
                      </p>
                    </td>
                    <td className="p-5 text-center">
                      <button 
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition shadow-sm"
                      >
                        <MdDeleteForever size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE LIST (Hidden on Desktop) */}
          <div className="md:hidden divide-y divide-gray-100">
            {results.map((item) => (
              <div key={item.id} className="p-5 flex flex-col gap-3 hover:bg-red-50/30 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">{item.position}</p>
                    <p className="text-base font-black text-gray-900 uppercase leading-tight">{item.name}</p>
                    <p className="text-xs text-gray-500 font-bold mt-1">{item.constituency} — {item.district}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Votes</p>
                    <p className="text-xl font-black text-blue-900 leading-none">{item.individualVotes}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="text-[9px]">
                    <p className="font-bold text-gray-600 uppercase">By: {item.submittedBy}</p>
                    <p className="text-gray-400 italic">
                       {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : "Recently"}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDelete(item.id, item.name)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-black text-[10px] uppercase shadow-md active:scale-95 transition"
                  >
                    <MdDeleteForever size={16} /> DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>

          {results.length === 0 && (
            <div className="p-20 text-center text-gray-400 italic uppercase font-bold tracking-widest text-xs">
              No records found in database.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
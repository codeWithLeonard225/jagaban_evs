"use client";

import React, { useState, useMemo, useEffect } from "react";
import { db } from "@/app/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useAuth } from "@/app/context/AuthContext";
import { MdFilterList, MdDashboard, MdOutlineHowToVote, MdFactCheck } from "react-icons/md";

export default function NationalResultsLedger() {
  const { user, loading: authLoading } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState("");

  useEffect(() => {
    const q = query(collection(db, "Jagaban_results"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResults(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const districts = useMemo(() => [...new Set(results.map((item) => item.district))].sort(), [results]);

  const filteredGroupedData = useMemo(() => {
    if (!selectedDistrict) return {};
    return results
      .filter((item) => item.district === selectedDistrict)
      .reduce((acc, item) => {
        if (!acc[item.position]) acc[item.position] = [];
        acc[item.position].push(item);
        return acc;
      }, {});
  }, [results, selectedDistrict]);

  // Global Stats for the Header
  const globalStats = useMemo(() => {
    const total = results.reduce((s, i) => s + Number(i.individualVotes || 0), 0);
    return { total };
  }, [results]);

  if (authLoading || loading) return <div className="p-20 text-center font-black animate-pulse">SYNCING NATIONAL DATA...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
      
      {/* --- BRANDED HERO HEADER --- */}
      <div className="bg-white border-b shadow-sm overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center">
          
          {/* Presidential Photo Container */}
          <div className="w-full md:w-1/3 h-64 md:h-80 relative bg-slate-100">
            <img 
              src="/images/jagaban1.jpeg" 
              alt="Presidential Candidate"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white hidden md:block"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent md:hidden"></div>
          </div>

          {/* Header Text & Stats */}
          <div className="p-8 flex-1 space-y-4 text-center ">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 italic">
                National <span className="text-red-700">Results Ledger</span>
              </h1>
              <p className="text-blue-700 font-bold text-xs uppercase tracking-widest mt-1">
                Face of Hope
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <div className="bg-blue-900 text-white px-5 py-3 rounded-2xl shadow-lg">
                <p className="text-[10px] font-bold opacity-60 uppercase">Total National Votes</p>
                <p className="text-2xl font-black">{globalStats.total.toLocaleString()}</p>
              </div>
              <div className="bg-slate-100 px-5 py-3 rounded-2xl border">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Active Districts</p>
                <p className="text-2xl font-black text-slate-800">{districts.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* DISTRICT FILTER PANEL */}
        <div className="bg-white rounded-3xl shadow-sm border p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 sticky top-4 z-40">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="bg-red-50 p-3 rounded-2xl text-red-600"><MdFilterList size={24}/></div>
            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Select Jurisdiction</label>
              <select 
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full md:w-64 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 p-3 outline-none focus:border-red-600"
              >
                <option value="">-- Select District --</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {selectedDistrict && (
            <div className="flex gap-6 border-l pl-6 border-slate-100">
               <div className="flex flex-col items-end">
                <p className="text-[9px] font-black text-slate-400 uppercase">District Live Status</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-blue-900 uppercase">{selectedDistrict}</span>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RESULTS AREA */}
        {!selectedDistrict ? (
          <div className="text-center py-20 border-2 border-dashed rounded-[3rem] border-slate-200">
            <MdOutlineHowToVote size={50} className="mx-auto mb-3 text-slate-200" />
            <h2 className="text-xl font-bold text-slate-300 uppercase italic">Select a district to pull live data</h2>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(filteredGroupedData).map((posName) => (
              <div key={posName} className="bg-white rounded-[2rem] shadow-sm border overflow-hidden">
                <div className="bg-slate-900 text-white p-5 px-8 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <MdFactCheck className="text-yellow-500" />
                    <h3 className="font-black uppercase text-xs tracking-widest">{posName}</h3>
                  </div>
                  <span className="text-[10px] font-bold opacity-40 uppercase">{filteredGroupedData[posName].length} Candidate Reported</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b">
                      <tr className="text-[9px] font-black text-slate-400 uppercase">
                        <th className="p-4 pl-8">Constituency</th>
                        <th className="p-4">Candidate / Camp</th>
                        <th className="p-4 text-center bg-blue-50 text-blue-900">Total Votes</th>
                        <th className="p-4 text-center">% Share</th>
                        <th className="p-4">Reported By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredGroupedData[posName].map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition text-xs">
                          <td className="p-4 pl-8 font-black text-slate-900 uppercase">{item.constituency}</td>
                          <td className="p-4">
                            <p className="font-bold text-slate-800">{item.name}</p>
                            <p className="text-[9px] font-bold text-red-600 uppercase tracking-tighter">{item.campName}</p>
                          </td>
                          <td className="p-4 text-center bg-blue-50/50 font-black text-blue-900 text-sm">{Number(item.individualVotes).toLocaleString()}</td>
                          <td className="p-4 text-center">
                            <span className="bg-green-100 text-green-800 text-[10px] font-black px-2 py-1 rounded-lg">
                              {item.percentage}%
                            </span>
                          </td>
                          <td className="p-4 text-[9px] font-bold text-slate-400 uppercase italic">{item.submittedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
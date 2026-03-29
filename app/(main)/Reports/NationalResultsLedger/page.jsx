"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/app/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useAuth } from "@/app/context/AuthContext";
import { MdAnalytics, MdLocationOn, MdPeople, MdFilterList } from "react-icons/md";

export default function NationalResultsLedger() {
  const { user, loading: authLoading } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. REAL-TIME FETCH (All Districts) ---
  useEffect(() => {
    const q = query(
      collection(db, "Jagaban_results"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResults(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- 2. CALCULATE NATIONAL STATS ---
  const stats = useMemo(() => {
    const totalVotes = results.reduce((sum, item) => sum + (item.individualVotes || 0), 0);
    const totalInvalid = results.reduce((sum, item) => sum + (item.invalidVotes || 0), 0);
    const reportingStations = new Set(results.map(item => item.constituency)).size;
    
    return { totalVotes, totalInvalid, reportingStations };
  }, [results]);

  // --- 3. GROUPING LOGIC (District > Position) ---
  const groupedData = results.reduce((acc, item) => {
    const district = item.district || "Unknown District";
    if (!acc[district]) acc[district] = {};
    if (!acc[district][item.position]) acc[district][item.position] = [];
    acc[district][item.position].push(item);
    return acc;
  }, {});

  if (authLoading || loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-blue-900 font-black uppercase tracking-widest animate-pulse">
        <div className="w-12 h-12 border-4 border-blue-900 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
        Syncing National Data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      
      {/* TOP HEADER */}
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">National Results Ledger</h1>
          <p className="text-blue-700 font-bold text-xs uppercase tracking-[0.3em]">Jagaban Multi-District Command Center</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">System Administrator</p>
                <p className="text-sm font-black text-slate-800">{user?.data?.fullName}</p>
            </div>
            <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center text-white font-bold">
                {user?.data?.fullName?.charAt(0)}
            </div>
        </div>
      </header>

      {/* QUICK STATS STRIP */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-blue-900 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
            <MdPeople className="absolute -right-4 -bottom-4 text-8xl opacity-10" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Individual Votes</p>
            <h3 className="text-4xl font-black mt-2">{stats.totalVotes.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
            <MdLocationOn className="absolute -right-4 -bottom-4 text-8xl text-slate-100" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Constituencies</p>
            <h3 className="text-4xl font-black mt-2 text-slate-900">{stats.reportingStations}</h3>
        </div>
        <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 shadow-sm relative overflow-hidden">
            <MdAnalytics className="absolute -right-4 -bottom-4 text-8xl text-red-100" />
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Invalid Ballots</p>
            <h3 className="text-4xl font-black mt-2 text-red-600">{stats.totalInvalid.toLocaleString()}</h3>
        </div>
      </div>

      {/* RESULTS BY DISTRICT */}
      <div className="max-w-7xl mx-auto space-y-12">
        {Object.keys(groupedData).length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-300 font-bold uppercase italic">
            Waiting for field data to synchronize...
          </div>
        ) : (
          Object.keys(groupedData).map((districtName) => (
            <section key={districtName} className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-slate-900 uppercase italic underline decoration-yellow-500 decoration-4 underline-offset-8">
                  {districtName}
                </h2>
                <div className="h-[2px] flex-1 bg-slate-200"></div>
              </div>

              {Object.keys(groupedData[districtName]).map((posName) => (
                <div key={posName} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-900 p-5 px-8 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <h3 className="font-black uppercase tracking-wider text-xs">{posName}</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {groupedData[districtName][posName].length} Entries
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 border-b">
                          <th className="p-5 pl-8">Constituency</th>
                          <th className="p-5">Candidate</th>
                          <th className="p-5">Camp</th>
                          <th className="p-5 text-center">Valid</th>
                          <th className="p-5 text-center">Inv</th>
                          <th className="p-5 text-center bg-blue-50 text-blue-900 font-black">Votes</th>
                          <th className="p-5 text-center">%</th>
                          <th className="p-5">Auditor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {groupedData[districtName][posName].map((item, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/30 transition group">
                            <td className="p-5 pl-8 font-black text-slate-900 text-xs uppercase">{item.constituency}</td>
                            <td className="p-5 font-bold text-slate-700 text-sm">{item.name}</td>
                            <td className="p-5 text-xs font-bold text-slate-400">{item.campName}</td>
                            <td className="p-5 text-center text-xs font-medium text-slate-500">{item.totalOverallVotes - item.invalidVotes}</td>
                            <td className="p-5 text-center text-xs font-medium text-red-400">{item.invalidVotes}</td>
                            <td className="p-5 text-center bg-blue-50/50 font-black text-blue-900">{item.individualVotes}</td>
                            <td className="p-5 text-center">
                                <span className="bg-yellow-100 text-yellow-800 text-[10px] font-black px-2 py-1 rounded-lg">
                                    {item.percentage}%
                                </span>
                            </td>
                            <td className="p-5 text-[9px] font-black text-slate-400 uppercase italic truncate max-w-[100px]">
                                {item.submittedBy}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
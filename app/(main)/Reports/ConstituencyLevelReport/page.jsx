"use client";

import React, { useState, useMemo, useEffect } from "react";
import { db } from "@/app/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { MdMap, MdHowToVote, MdReportProblem, MdFactCheck, MdLocationCity } from "react-icons/md";

export default function ConstituencyLevelReport({ targetConstituency }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If no target is passed, we could default to a specific one or fetch all
    const q = targetConstituency 
      ? query(collection(db, "Jagaban_results"), where("constituency", "==", targetConstituency))
      : query(collection(db, "Jagaban_results"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResults(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [targetConstituency]);

  // --- CONSTITUENCY AGGREGATION ENGINE ---
  const stats = useMemo(() => {
    const summary = {
      totalOverall: 0,
      totalInvalid: 0,
      totalValid: 0,
      positionBreakdown: {}
    };

    results.forEach(item => {
      const overall = Number(item.totalOverallVotes || 0);
      const invalid = Number(item.invalidVotes || 0);
      const pos = item.position || "Unknown";

      // Global Totals for this Constituency
      summary.totalOverall += overall;
      summary.totalInvalid += invalid;
      summary.totalValid += (overall - invalid);

      // Position-wise grouping
      if (!summary.positionBreakdown[pos]) {
        summary.positionBreakdown[pos] = {
          posName: pos,
          posValid: 0,
          posInvalid: 0,
          candidates: []
        };
      }
      
      summary.positionBreakdown[pos].posValid += (overall - invalid);
      summary.positionBreakdown[pos].posInvalid += invalid;
      summary.positionBreakdown[pos].candidates.push({
        name: item.name,
        votes: Number(item.individualVotes || 0),
        perc: item.percentage
      });
    });

    return summary;
  }, [results]);

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-red-600">LOADING CONSTITUENCY DATA...</div>;

  const spoilageRate = stats.totalOverall > 0 
    ? ((stats.totalInvalid / stats.totalOverall) * 100).toFixed(2) 
    : "0.00";

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* 1. CONSTITUENCY SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-900 p-6 rounded-[2rem] text-white shadow-xl flex flex-col justify-center border-b-8 border-blue-700">
             <MdLocationCity size={32} className="mb-2 text-blue-300" />
             <h2 className="text-2xl font-black uppercase italic tracking-tighter">{targetConstituency || "All Districts"}</h2>
             <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Active Reporting Unit</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-md border border-slate-100">
             <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Votes Cast</p>
             <div className="flex items-center gap-2">
                <MdHowToVote className="text-blue-600" size={24} />
                <span className="text-3xl font-black text-slate-900">{stats.totalOverall.toLocaleString()}</span>
             </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-md border border-slate-100">
             <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Invalid</p>
             <div className="flex items-center gap-2">
                <MdReportProblem className="text-red-500" size={24} />
                <span className="text-3xl font-black text-red-600">{stats.totalInvalid.toLocaleString()}</span>
             </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-md border border-slate-100">
             <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Spoilage Rate</p>
             <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-red-500 flex items-center justify-center">
                    <span className="text-[10px] font-bold">{spoilageRate}%</span>
                </div>
                <span className="text-sm font-black text-slate-700 uppercase">Invalid Ratio</span>
             </div>
          </div>
        </div>

        {/* 2. POSITION-WISE CONSTITUENCY TABLE */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 p-6 px-10 flex items-center gap-3">
            <MdFactCheck className="text-green-400" size={24} />
            <h3 className="text-white font-black uppercase tracking-widest text-sm">Summarized Position Ledger</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
                  <th className="p-6">Position</th>
                  <th className="p-6">Constituency Total</th>
                  <th className="p-6">Leading Candidate</th>
                  <th className="p-6">Candidate Spread</th>
                  <th className="p-6 text-center">Invalid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.values(stats.positionBreakdown).map((pos, idx) => {
                  const sortedCands = [...pos.candidates].sort((a,b) => b.votes - a.votes);
                  const winner = sortedCands[0];

                  return (
                    <tr key={idx} className="hover:bg-blue-50/50 transition duration-200">
                      <td className="p-6">
                        <p className="font-black text-blue-900 uppercase text-sm tracking-tighter">{pos.posName}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Station Processed</p>
                      </td>
                      <td className="p-6">
                        <span className="text-lg font-black text-slate-800">{pos.posValid.toLocaleString()}</span>
                        <p className="text-[9px] font-bold text-green-600 uppercase">Valid Votes</p>
                      </td>
                      <td className="p-6">
                        <div className="bg-yellow-100 px-3 py-1 rounded-lg inline-block">
                           <p className="text-[10px] font-black text-yellow-800 uppercase leading-none">{winner?.name}</p>
                           <p className="text-[9px] font-bold text-yellow-600 uppercase">{winner?.votes} Votes</p>
                        </div>
                      </td>
                      <td className="p-6">
                         <div className="flex -space-x-2">
                            {sortedCands.slice(0, 3).map((_, i) => (
                               <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-500">
                                 {i + 1}
                               </div>
                            ))}
                            {sortedCands.length > 3 && (
                                <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[9px] font-black text-blue-600">
                                    +{sortedCands.length - 3}
                                </div>
                            )}
                         </div>
                      </td>
                      <td className="p-6 text-center">
                        <span className="text-xs font-black text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                           {pos.posInvalid}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. PARTICIPATION INSIGHT */}
        <div className="mt-8 bg-blue-50 p-6 rounded-[2rem] border-2 border-dashed border-blue-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                    <MdMap size={24} />
                </div>
                <div>
                    <h4 className="font-black text-blue-900 uppercase tracking-tighter text-lg leading-tight">Data Saturation</h4>
                    <p className="text-[10px] font-bold text-blue-400 uppercase">Real-time participation flow for {targetConstituency}</p>
                </div>
            </div>
            <div className="text-right">
                <button 
                  onClick={() => window.print()}
                  className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition active:scale-95 shadow-xl"
                >
                    Generate Printable Audit
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}
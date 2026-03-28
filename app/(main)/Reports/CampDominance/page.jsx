"use client";

import React, { useState, useMemo, useEffect } from "react";
import { db } from "@/app/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { MdMilitaryTech, MdTrendingUp, MdGroups, MdLeaderboard } from "react-icons/md";

export default function CampPerformanceAnalytics() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "Jagaban_results"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResults(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- ANALYTICS ENGINE: CAMP VS CAMP ---
  const campStats = useMemo(() => {
    const camps = {};
    let grandTotal = 0;

    results.forEach((item) => {
      const cName = item.campName?.toUpperCase() || "INDEPENDENT / OTHER";
      const votes = Number(item.individualVotes || 0);
      const district = item.district || "Unknown";

      if (!camps[cName]) {
        camps[cName] = {
          name: cName,
          totalVotes: 0,
          districtsWon: new Set(),
          positionStrength: {}, // How many votes they get per role
        };
      }

      camps[cName].totalVotes += votes;
      camps[cName].districtsWon.add(district);
      grandTotal += votes;

      // Track strength by position
      const pos = item.position;
      camps[cName].positionStrength[pos] = (camps[cName].positionStrength[pos] || 0) + votes;
    });

    // Sort camps by total votes (Highest first)
    return {
      sortedCamps: Object.values(camps).sort((a, b) => b.totalVotes - a.totalVotes),
      grandTotal
    };
  }, [results]);

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-emerald-600">ANALYZING CAMP MOBILIZATION...</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-10 text-white font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-12 border-l-4 border-yellow-500 pl-6">
          <h1 className="text-5xl font-black uppercase tracking-tighter italic">Camp Power Rankings</h1>
          <p className="text-yellow-500 font-bold text-xs uppercase tracking-[0.5em] mt-2">Head-to-Head Internal Faction Analytics</p>
        </header>

        {/* RANKING CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: THE LEADERBOARD */}
          <div className="lg:col-span-8 space-y-6">
            {campStats.sortedCamps.map((camp, index) => {
              const share = ((camp.totalVotes / campStats.grandTotal) * 100).toFixed(1);
              
              return (
                <div key={camp.name} className="bg-slate-900 rounded-[2rem] p-1 border border-slate-800 hover:border-yellow-500/50 transition duration-500">
                  <div className="p-6 flex flex-col md:flex-row items-center gap-6">
                    {/* Rank Circle */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black border-4 ${index === 0 ? 'bg-yellow-500 border-yellow-300 text-slate-950' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                      {index + 1}
                    </div>

                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <h3 className="text-2xl font-black uppercase italic tracking-tight">{camp.name}</h3>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Active in {camp.districtsWon.size} Districts</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-black text-white">{camp.totalVotes.toLocaleString()}</p>
                          <p className="text-[10px] font-black text-yellow-500 uppercase">{share}% Share of Total Votes</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${index === 0 ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-blue-600'}`}
                          style={{ width: `${share}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Detailed Breakdown (Accordion-style display) */}
                  <div className="bg-slate-950/50 rounded-b-[1.8rem] p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-800/50">
                    {Object.entries(camp.positionStrength).slice(0, 4).map(([pos, val]) => (
                        <div key={pos} className="border-l border-slate-800 pl-3">
                            <p className="text-[8px] font-black text-slate-500 uppercase truncate">{pos}</p>
                            <p className="text-sm font-black text-slate-300">{val.toLocaleString()}</p>
                        </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: STRATEGIC INSIGHTS */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-yellow-500 rounded-[2.5rem] p-8 text-slate-950 shadow-2xl shadow-yellow-500/10">
                <MdMilitaryTech size={48} className="mb-4" />
                <h2 className="text-2xl font-black uppercase leading-none">Top Performing Camp</h2>
                <p className="text-4xl font-black mt-4 italic uppercase tracking-tighter">
                    {campStats.sortedCamps[0]?.name || "N/A"}
                </p>
                <div className="mt-6 p-4 bg-slate-950/10 rounded-2xl border border-slate-950/10">
                    <p className="text-xs font-bold italic">"This faction is currently providing the strongest mobilization across all monitored positions."</p>
                </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.2em] mb-6 flex items-center gap-2">
                    <MdTrendingUp className="text-blue-500" /> Strategic Distribution
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase">Total Results Captured</span>
                        <span className="text-lg font-black">{results.length}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-800 pt-4">
                        <span className="text-[10px] font-black uppercase">Grand Vote Tally</span>
                        <span className="text-lg font-black text-yellow-500">{campStats.grandTotal.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <button className="w-full py-5 bg-white text-slate-950 rounded-[2rem] font-black uppercase tracking-widest hover:bg-yellow-500 transition duration-300 flex items-center justify-center gap-3 shadow-xl">
                <MdGroups size={24} /> EXPORT FULL ANALYSIS
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
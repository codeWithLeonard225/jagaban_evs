"use client";

import React, { useState, useMemo, useEffect } from "react";
import { db } from "@/app/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { MdPieChart, MdAnalytics, MdCheckCircle, MdBlock } from "react-icons/md";

export default function PositionLevelReport() {
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

  // --- POSITION AGGREGATION ENGINE ---
  const positionStats = useMemo(() => {
    const stats = {};

    results.forEach((item) => {
      const pos = item.position;
      if (!stats[pos]) {
        stats[pos] = {
          totalOverall: 0,
          totalInvalid: 0,
          totalValid: 0,
          candidates: [],
          avgPercentage: 0
        };
      }

      const individualVotes = Number(item.individualVotes || 0);
      const invalid = Number(item.invalidVotes || 0);
      const overall = Number(item.totalOverallVotes || 0);

      stats[pos].totalOverall += overall;
      stats[pos].totalInvalid += invalid;
      stats[pos].totalValid += (overall - invalid);
      
      stats[pos].candidates.push({
        name: item.name,
        votes: individualVotes,
        percentage: Number(item.percentage || 0)
      });
    });

    // Calculate Averages and Sort
    Object.keys(stats).forEach(pos => {
      const totalCandidates = stats[pos].candidates.length;
      const sumPercentages = stats[pos].candidates.reduce((sum, c) => sum + c.percentage, 0);
      stats[pos].avgPercentage = (sumPercentages / totalCandidates).toFixed(2);
      
      // Sort candidates for the distribution chart
      stats[pos].candidates.sort((a, b) => b.votes - a.votes);
    });

    return stats;
  }, [results]);

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-indigo-600">AGGREGATING POSITION DATA...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-12 text-center md:text-left">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Position Analytics</h1>
          <p className="text-indigo-600 font-bold text-xs uppercase tracking-[0.4em] mt-2">Race Integrity & Vote Distribution</p>
        </header>

        <div className="space-y-10">
          {Object.entries(positionStats).map(([posName, data]) => {
            const spoilageRate = ((data.totalInvalid / data.totalOverall) * 100).toFixed(1);
            
            return (
              <div key={posName} className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-200">
                
                {/* TOP STATS BAR */}
                <div className="grid grid-cols-1 md:grid-cols-4 bg-slate-900 text-white border-b-8 border-indigo-600">
                  <div className="p-8 border-r border-white/10">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Position</p>
                    <h2 className="text-2xl font-black italic uppercase truncate">{posName}</h2>
                  </div>
                  <div className="p-8 border-r border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Cast</p>
                      <p className="text-2xl font-black">{data.totalOverall.toLocaleString()}</p>
                    </div>
                    <MdAnalytics className="text-indigo-400 text-3xl opacity-30" />
                  </div>
                  <div className="p-8 border-r border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-green-400 uppercase mb-1">Valid Votes</p>
                      <p className="text-2xl font-black text-green-400">{data.totalValid.toLocaleString()}</p>
                    </div>
                    <MdCheckCircle className="text-green-500 text-3xl opacity-30" />
                  </div>
                  <div className="p-8 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-red-400 uppercase mb-1">Spoilage ({spoilageRate}%)</p>
                      <p className="text-2xl font-black text-red-500">{data.totalInvalid.toLocaleString()}</p>
                    </div>
                    <MdBlock className="text-red-500 text-3xl opacity-30" />
                  </div>
                </div>

                <div className="p-10">
                  {/* VOTE DISTRIBUTION CHART (CSS BAR) */}
                  <div className="mb-10">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <MdPieChart className="text-indigo-600" /> Vote Share Distribution
                    </h3>
                    
                    <div className="flex h-12 w-full rounded-2xl overflow-hidden shadow-inner bg-slate-100 p-1">
                      {data.candidates.map((c, idx) => {
                        const share = ((c.votes / data.totalValid) * 100);
                        const colors = ['bg-indigo-600', 'bg-blue-500', 'bg-slate-400', 'bg-slate-300'];
                        return (
                          <div 
                            key={idx}
                            title={`${c.name}: ${share.toFixed(1)}%`}
                            className={`${colors[idx % colors.length]} transition-all duration-500 border-r border-white/20`}
                            style={{ width: `${share}%` }}
                          />
                        );
                      })}
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {data.candidates.map((c, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                           <div className={`w-3 h-3 rounded-full ${['bg-indigo-600', 'bg-blue-500', 'bg-slate-400', 'bg-slate-300'][idx % 4]}`} />
                           <p className="text-[10px] font-black uppercase text-slate-600 truncate">{c.name}</p>
                           <p className="text-[10px] font-bold text-slate-400 italic">({((c.votes / data.totalValid) * 100).toFixed(1)}%)</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PERCENTAGE REPORT SECTION */}
                  <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                      <h4 className="text-sm font-black uppercase text-indigo-900">Average Performance Strength</h4>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Calculated across {data.candidates.length} contestants</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="text-right">
                          <p className="text-3xl font-black text-indigo-600 leading-none">{data.avgPercentage}%</p>
                          <p className="text-[9px] font-black text-indigo-300 uppercase">Avg Candidate Vote %</p>
                       </div>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
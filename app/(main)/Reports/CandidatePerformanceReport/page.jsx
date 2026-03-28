"use client";

import React, { useState, useMemo, useEffect } from "react";
import { db } from "@/app/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { MdEmojiEvents, MdPersonSearch, MdTrendingUp, MdPieChart } from "react-icons/md";

export default function CandidatePerformanceReport() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetches all results to allow for cross-constituency ranking if needed
    const q = query(collection(db, "Jagaban_results"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResults(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- CANDIDATE ANALYTICS ENGINE ---
  const candidateReport = useMemo(() => {
    const grouped = {};

    results.forEach((item) => {
      const pos = item.position;
      if (!grouped[pos]) grouped[pos] = [];
      
      grouped[pos].push({
        name: item.name,
        camp: item.campName,
        votes: Number(item.individualVotes || 0),
        invalid: Number(item.invalidVotes || 0),
        validInRace: Number(item.totalOverallVotes || 0) - Number(item.invalidVotes || 0),
        percentage: item.percentage,
        constituency: item.constituency
      });
    });

    // Sort candidates within each position by highest votes
    Object.keys(grouped).forEach(pos => {
      grouped[pos].sort((a, b) => b.votes - a.votes);
    });

    return grouped;
  }, [results]);

  if (loading) return <div className="p-20 text-center font-black animate-spin text-blue-600">RANKING CANDIDATES...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-end border-b-4 border-blue-900 pb-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-3">
              <MdEmojiEvents className="text-yellow-500" /> Candidate Leaderboard
            </h1>
            <p className="text-blue-700 font-bold text-xs uppercase tracking-[0.3em] mt-2">Real-Time Performance & Ranking Summary</p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase">Total Candidates Tracked</p>
            <p className="text-2xl font-black text-slate-900">{results.length}</p>
          </div>
        </header>

        {/* POSITION GRIDS */}
        <div className="space-y-12">
          {Object.entries(candidateReport).map(([position, candidates]) => (
            <div key={position} className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-200">
              
              {/* POSITION SUB-HEADER */}
              <div className="bg-slate-900 p-6 px-10 flex justify-between items-center text-white">
                <h2 className="text-lg font-black uppercase tracking-widest italic">{position}</h2>
                <span className="bg-yellow-500 text-slate-900 text-[10px] font-black px-4 py-1 rounded-full uppercase">
                  Top of the Poll: {candidates[0].name}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12">
                
                {/* LEFT: THE WINNER SPOTLIGHT */}
                <div className="lg:col-span-4 bg-yellow-50/50 p-8 border-r border-slate-100 flex flex-col justify-center items-center text-center">
                  <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg mb-4 text-slate-900 border-4 border-white">
                    <MdEmojiEvents size={48} />
                  </div>
                  <p className="text-[10px] font-black text-yellow-700 uppercase tracking-widest mb-1">Current Leader</p>
                  <h3 className="text-2xl font-black uppercase text-slate-900 leading-tight">{candidates[0].name}</h3>
                  <p className="text-xs font-bold text-slate-500 mb-6">{candidates[0].camp}</p>
                  
                  <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-yellow-200">
                     <p className="text-4xl font-black text-slate-900">{candidates[0].votes}</p>
                     <p className="text-[10px] font-black text-slate-400 uppercase">Individual Votes</p>
                  </div>
                </div>

                {/* RIGHT: THE FULL RANKING TABLE */}
                <div className="lg:col-span-8 p-6">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                            <th className="p-4">Rank</th>
                            <th className="p-4">Candidate</th>
                            <th className="p-4 text-center">Votes</th>
                            <th className="p-4 text-center">% of Valid</th>
                            <th className="p-4 text-center">Spoilage</th>
                            <th className="p-4">Location</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {candidates.map((c, idx) => (
                            <tr key={idx} className={`group hover:bg-slate-50 transition ${idx === 0 ? 'bg-blue-50/30' : ''}`}>
                              <td className="p-4 font-black text-slate-300 group-hover:text-blue-500 text-lg italic">
                                #{idx + 1}
                              </td>
                              <td className="p-4">
                                <p className="font-black text-slate-800 uppercase text-sm">{c.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{c.camp}</p>
                              </td>
                              <td className="p-4 text-center font-black text-slate-900 text-lg">
                                {c.votes.toLocaleString()}
                              </td>
                              <td className="p-4 text-center">
                                <span className="bg-blue-900 text-white text-[10px] font-black px-3 py-1 rounded-lg">
                                  {c.percentage}%
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <p className="text-[10px] font-bold text-red-500">{c.invalid} <span className="text-slate-300">Inv</span></p>
                              </td>
                              <td className="p-4 text-[10px] font-black text-slate-400 uppercase italic">
                                {c.constituency}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </div>

              </div>

              {/* STRATEGIC INSIGHT FOOTER */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-around items-center">
                 <div className="flex items-center gap-2">
                    <MdPieChart className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Race Margin: {(candidates[0].votes - (candidates[1]?.votes || 0)).toLocaleString()} Votes
                    </span>
                 </div>
                 <div className="flex items-center gap-2">
                    <MdTrendingUp className="text-green-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Total Valid Votes: {candidates.reduce((sum, c) => sum + c.votes, 0).toLocaleString()}
                    </span>
                 </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
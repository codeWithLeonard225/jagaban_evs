"use client";

import React, { useState, useMemo, useEffect } from "react";
import { db } from "@/app/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { 
  MdPublic, MdMilitaryTech, MdLocationCity, 
  MdAssessment, MdTrendingUp, MdFlag 
} from "react-icons/md";

export default function NationalSummaryReport() {
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

  // --- NATIONAL ANALYTICS ENGINE ---
  const nationalData = useMemo(() => {
    const stats = {
      totalVotes: 0,
      totalInvalid: 0,
      candidates: {}, // Aggregated by name
      districts: {},   // Projections per district
    };

    results.forEach((item) => {
      const votes = Number(item.individualVotes || 0);
      const invalid = Number(item.invalidVotes || 0);
      const overall = Number(item.totalOverallVotes || 0);
      const name = item.name;
      const dist = item.district;

      // 1. National Totals (Avoiding double counting position totals)
      // Logic: Use a unique key for each position/constituency to sum overall turnouts
      const turnoutKey = `${item.constituency}_${item.position}`;
      if (!stats[turnoutKey]) {
          stats.totalVotes += overall;
          stats.totalInvalid += invalid;
          stats[turnoutKey] = true; 
      }

      // 2. Candidate National Performance
      if (!stats.candidates[name]) {
        stats.candidates[name] = { name, votes: 0, camp: item.campName };
      }
      stats.candidates[name].votes += votes;

      // 3. District Projection Logic
      if (!stats.districts[dist]) stats.districts[dist] = { name: dist, candidates: {} };
      if (!stats.districts[dist].candidates[name]) stats.districts[dist].candidates[name] = 0;
      stats.districts[dist].candidates[name] += votes;
    });

    // Convert to arrays and sort
    const validNational = stats.totalVotes - stats.totalInvalid;
    const sortedCandidates = Object.values(stats.candidates)
      .sort((a, b) => b.votes - a.votes)
      .map(c => ({
        ...c,
        percentage: validNational > 0 ? ((c.votes / validNational) * 100).toFixed(2) : "0.00"
      }));

    const districtWinners = Object.values(stats.districts).map(d => {
      const top = Object.entries(d.candidates).sort((a, b) => b[1] - a[1])[0];
      return { district: d.name, winner: top ? top[0] : "N/A", votes: top ? top[1] : 0 };
    });

    return { ...stats, sortedCandidates, districtWinners, validNational };
  }, [results]);

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-blue-900">COMPILING NATIONAL RESULTS...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* NATIONAL STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-blue-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <MdPublic className="absolute -right-4 -bottom-4 text-white/10" size={150} />
            <p className="text-[10px] font-black uppercase text-blue-300 tracking-widest">Total National Turnout</p>
            <h2 className="text-4xl font-black mt-2">{nationalData.totalVotes.toLocaleString()}</h2>
            <p className="text-[10px] font-bold text-blue-400 mt-1 italic">Across all Districts</p>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border-t-8 border-green-600 shadow-xl">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Valid Ballots</p>
            <h2 className="text-4xl font-black text-slate-900 mt-2">{nationalData.validNational.toLocaleString()}</h2>
            <div className="flex items-center gap-2 mt-2">
               <MdTrendingUp className="text-green-500" />
               <span className="text-[10px] font-black text-green-600 uppercase">Integrity Verified</span>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border-t-8 border-red-600 shadow-xl">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">National Spoilage</p>
            <h2 className="text-4xl font-black text-red-600 mt-2">{nationalData.totalInvalid.toLocaleString()}</h2>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic">
              {((nationalData.totalInvalid / nationalData.totalVotes) * 100).toFixed(2)}% of total
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* NATIONAL RANKING TABLE */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
              <div className="bg-slate-900 p-6 px-10 flex justify-between items-center text-white">
                <h3 className="font-black uppercase tracking-[0.2em] text-sm italic">National Candidate Standings</h3>
                <MdAssessment className="text-blue-400" size={24} />
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                  <tr>
                    <th className="p-6">Rank</th>
                    <th className="p-6">Candidate</th>
                    <th className="p-6 text-center">Total Votes</th>
                    <th className="p-6 text-center">Share (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {nationalData.sortedCandidates.map((c, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/50 transition duration-300">
                      <td className="p-6 text-2xl font-black text-slate-200 italic">#{idx + 1}</td>
                      <td className="p-6">
                        <p className="font-black text-slate-800 uppercase text-sm">{c.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.camp}</p>
                      </td>
                      <td className="p-6 text-center font-black text-slate-900 text-lg">
                        {c.votes.toLocaleString()}
                      </td>
                      <td className="p-6 text-center">
                        <div className="inline-block bg-blue-100 text-blue-800 px-4 py-1 rounded-full font-black text-xs">
                          {c.percentage}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DISTRICT PROJECTIONS */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
               <h3 className="font-black uppercase tracking-widest text-xs text-blue-900 border-b-2 border-blue-900 pb-4 mb-6 flex items-center gap-2">
                 <MdFlag /> District Winners
               </h3>
               <div className="space-y-6">
                 {nationalData.districtWinners.map((win, i) => (
                   <div key={i} className="flex justify-between items-center group">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">{win.district}</p>
                        <p className="text-xs font-black text-slate-800 uppercase group-hover:text-blue-600 transition">{win.winner}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md">
                          {win.votes.toLocaleString()}
                        </p>
                      </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* QUICK-ACTION CARDS */}
            <div className="bg-red-700 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col items-center text-center">
               <MdMilitaryTech size={48} className="text-yellow-400 mb-2" />
               <h4 className="font-black uppercase text-sm italic">Projected National Winner</h4>
               <p className="text-2xl font-black mt-2 uppercase">{nationalData.sortedCandidates[0]?.name || "Calculating..."}</p>
               <p className="text-[10px] font-bold text-red-200 mt-1 tracking-widest">LEADING BY {((nationalData.sortedCandidates[0]?.votes || 0) - (nationalData.sortedCandidates[1]?.votes || 0)).toLocaleString()} VOTES</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
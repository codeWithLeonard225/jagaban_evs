"use client";

import React, { useState, useMemo, useEffect } from "react";
import { db } from "@/app/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
// FIXED: Added MdPeople
import { MdReportProblem, MdGavel, MdOutlineFactCheck, MdError, MdPeople } from "react-icons/md";

export default function VoterIntegrityReport() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false); // Prevents hydration errors

  useEffect(() => {
    setMounted(true);
    const q = query(collection(db, "Jagaban_results"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResults(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const integrityData = useMemo(() => {
    const constituencyStats = {};
    results.forEach((item) => {
      const conKey = `${item.district} - ${item.constituency}`;
      if (!constituencyStats[conKey]) {
        constituencyStats[conKey] = {
          name: item.constituency,
          district: item.district,
          totalCast: 0,
          totalInvalid: 0,
          entries: 0,
          auditor: item.submittedBy
        };
      }
      const overall = Number(item.totalOverallVotes) || 0;
      const invalid = Number(item.invalidVotes) || 0;
      constituencyStats[conKey].totalCast += overall;
      constituencyStats[conKey].totalInvalid += invalid;
      constituencyStats[conKey].entries += 1;
    });

    return Object.values(constituencyStats)
      .map(stat => ({
        ...stat,
        spoilageRate: stat.totalCast > 0 ? ((stat.totalInvalid / stat.totalCast) * 100).toFixed(2) : "0.00"
      }))
      .sort((a, b) => Number(b.spoilageRate) - Number(a.spoilageRate));
  }, [results]);

  // Don't render until mounted to ensure client/server match
  if (!mounted || loading) return (
    <div className="p-20 text-center font-black animate-pulse text-red-600 uppercase tracking-widest">
      Establishing Secure Audit Connection...
    </div>
  );

  return (
    <div className="min-h-screen bg-red-50/30 p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* ALERT HEADER */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border-l-[12px] border-red-600">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
              <MdReportProblem className="text-red-600" /> Integrity Audit
            </h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
              Ballot Spoilage & Voter Education Monitoring
            </p>
          </div>
          <div className="bg-red-600 px-6 py-3 rounded-2xl text-white text-center min-w-[140px]">
            <p className="text-[10px] font-black uppercase opacity-80 leading-none">High-Risk Zones</p>
            <p className="text-2xl font-black">{integrityData.filter(d => Number(d.spoilageRate) > 5).length}</p>
          </div>
        </header>

        {/* TOP OFFENDERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {integrityData.slice(0, 4).map((zone, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-md border border-red-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-red-600 text-white px-4 py-1 font-black rounded-bl-2xl text-xs">
                        RANK {idx + 1}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{zone.district}</p>
                    <h3 className="text-lg font-black uppercase mb-4 truncate">{zone.name}</h3>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-3xl font-black text-red-600">{zone.spoilageRate}%</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Spoilage Rate</p>
                        </div>
                        <MdError className="text-4xl text-red-50" />
                    </div>
                </div>
            ))}
        </div>

        {/* LEDGER */}
        <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-200">
          <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-900 text-white gap-4">
            <h2 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
                <MdOutlineFactCheck className="text-yellow-500 text-xl" /> Spoilage Ledger
            </h2>
            <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest">Real-Time Integrity Verification</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b">
                  <th className="p-6 pl-10">Status</th>
                  <th className="p-6">Constituency</th>
                  <th className="p-6 text-center text-red-500">Invalid</th>
                  <th className="p-6 text-center">Rate (%)</th>
                  <th className="p-6">Latest Auditor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {integrityData.map((row, idx) => {
                  const rate = Number(row.spoilageRate);
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-6 pl-10">
                        <div className={`w-3 h-3 rounded-full ${rate > 5 ? 'bg-red-600 animate-pulse' : rate > 2 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                      </td>
                      <td className="p-6">
                        <p className="font-black text-slate-800 text-sm uppercase leading-none">{row.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{row.district}</p>
                      </td>
                      <td className="p-6 text-center font-black text-red-600">{row.totalInvalid.toLocaleString()}</td>
                      <td className="p-6 text-center">
                        <span className={`px-3 py-1 rounded-full font-black text-xs ${rate > 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {row.spoilageRate}%
                        </span>
                      </td>
                      <td className="p-6 text-[10px] font-black text-slate-400 uppercase italic">
                        {row.auditor || "AGENT"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ACTION PANEL */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex gap-6 items-center">
                <div className="bg-yellow-500 p-4 rounded-3xl text-slate-950 shadow-lg shrink-0">
                    <MdGavel size={32} />
                </div>
                <div>
                    <h3 className="font-black uppercase text-xl italic tracking-tighter">Legal Intervention</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                        Immediate station inquiry for zones exceeding 5% spoilage.
                    </p>
                </div>
            </div>
            <div className="bg-white rounded-[2.5rem] p-8 border border-red-200 flex gap-6 items-center">
                <div className="bg-red-600 p-4 rounded-3xl text-white shadow-lg shrink-0">
                    <MdPeople size={32} />
                </div>
                <div>
                    <h3 className="font-black uppercase text-xl italic tracking-tighter text-red-600">Voter Education</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                        Deploy field educators to high-spoilage districts.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
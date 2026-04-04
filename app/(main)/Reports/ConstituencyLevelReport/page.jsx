"use client";

import React, { useState, useMemo, useEffect } from "react";
import { db } from "@/app/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { MdMap, MdHowToVote, MdReportProblem, MdFactCheck, MdLocationCity, MdFilterList, MdSearch } from "react-icons/md";

export default function ConstituencyLevelReport({ targetConstituency: propConstituency }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 1. FILTER STATES
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [selectedConstituency, setSelectedConstituency] = useState("All");

  useEffect(() => {
    let q = collection(db, "Jagaban_results");

    // 2. NESTED QUERY LOGIC
    // Priority 1: Prop passed from parent
    if (propConstituency) {
      q = query(q, where("constituency", "==", propConstituency));
    } 
    // Priority 2: Specific Constituency selected in dropdown
    else if (selectedConstituency !== "All") {
      q = query(q, where("constituency", "==", selectedConstituency));
    }
    // Priority 3: District selected (shows all constituencies in that district)
    else if (selectedDistrict !== "All") {
      q = query(q, where("district", "==", selectedDistrict));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResults(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [propConstituency, selectedDistrict, selectedConstituency]);

  // 3. HIERARCHICAL DATA MAPPING
  // Map districts to their constituencies so the UI stays in sync
  const districtMap = useMemo(() => {
    const map = { "All": new Set() };
    results.forEach(item => {
      if (item.district) {
        if (!map[item.district]) map[item.district] = new Set();
        if (item.constituency) map[item.district].add(item.constituency);
        map["All"].add(item.constituency);
      }
    });
    return map;
  }, [results]);

  const districtList = useMemo(() => Object.keys(districtMap).sort(), [districtMap]);
  
  const constituencyList = useMemo(() => {
    return ["All", ...Array.from(districtMap[selectedDistrict] || [])].sort();
  }, [selectedDistrict, districtMap]);

  const stats = useMemo(() => {
    const summary = { totalOverall: 0, totalInvalid: 0, totalValid: 0, positionBreakdown: {} };
    const processedSheets = new Set();

    results.forEach(item => {
      const overall = Number(item.totalOverallVotes || 0);
      const invalid = Number(item.invalidVotes || 0);
      const pos = item.position || "Unknown";
      const sheetKey = `${item.constituency}_${pos}_${item.resultPhotoUrl}`;

      if (!processedSheets.has(sheetKey)) {
        summary.totalOverall += overall;
        summary.totalInvalid += invalid;
        summary.totalValid += (overall - invalid);
        processedSheets.add(sheetKey);
      }

      if (!summary.positionBreakdown[pos]) {
        summary.positionBreakdown[pos] = {
          posName: pos, posValid: 0, posInvalid: 0,
          district: item.district || "N/A",
          constituency: item.constituency || "N/A",
          candidates: []
        };
      }

      if (!summary.positionBreakdown[pos].hasCountedSheet) {
        summary.positionBreakdown[pos].posValid = overall - invalid;
        summary.positionBreakdown[pos].posInvalid = invalid;
        summary.positionBreakdown[pos].hasCountedSheet = true;
      }

      summary.positionBreakdown[pos].candidates.push({
        name: item.name, votes: Number(item.individualVotes || 0),
        perc: item.percentage, campName: item.campName || "N/A"
      });
    });
    return summary;
  }, [results]);

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-red-600 uppercase">Verifying Data Integrity...</div>;

  const spoilageRate = stats.totalOverall > 0 ? ((stats.totalInvalid / stats.totalOverall) * 100).toFixed(2) : "0.00";

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* 4. DUAL FILTER HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6">
            <div className="flex-1">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Live Audit Ledger</p>
                <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
                    {selectedConstituency !== "All" ? selectedConstituency : selectedDistrict === "All" ? "National" : selectedDistrict}
                </h1>
            </div>

            {!propConstituency && (
                <div className="flex flex-wrap gap-3">
                    {/* DISTRICT SELECT */}
                    <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 px-4">
                        <MdLocationCity className="text-blue-500" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase leading-none">District</span>
                            <select 
                                value={selectedDistrict} 
                                onChange={(e) => {
                                    setSelectedDistrict(e.target.value);
                                    setSelectedConstituency("All"); // Reset constituency when district changes
                                }}
                                className="bg-transparent font-black uppercase text-xs outline-none cursor-pointer text-slate-700"
                            >
                                {districtList.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* CONSTITUENCY SELECT */}
                    <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 px-4">
                        <MdSearch className="text-purple-500" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase leading-none">Constituency</span>
                            <select 
                                value={selectedConstituency} 
                                onChange={(e) => setSelectedConstituency(e.target.value)}
                                className="bg-transparent font-black uppercase text-xs outline-none cursor-pointer text-slate-700"
                            >
                                {constituencyList.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* 5. SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-900 p-6 rounded-[2rem] text-white shadow-xl flex flex-col justify-center border-b-8 border-blue-700">
            <MdMap size={32} className="mb-2 text-blue-300" />
            <h2 className="text-xl font-black uppercase italic tracking-tighter leading-tight truncate">
                {selectedConstituency !== "All" ? selectedConstituency : selectedDistrict}
            </h2>
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-1">Reporting Scope</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-md border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Cast</p>
            <div className="flex items-center gap-2 font-black text-slate-900 text-3xl">
              <MdHowToVote className="text-blue-600" size={24} />
              <span>{stats.totalOverall.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-md border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Invalid</p>
            <div className="flex items-center gap-2 font-black text-red-600 text-3xl">
              <MdReportProblem className="text-red-500" size={24} />
              <span>{stats.totalInvalid.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-md border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Spoilage</p>
            <div className="flex items-center gap-2">
              <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center ${Number(spoilageRate) > 5 ? 'border-red-500' : 'border-green-500'}`}>
                <span className="text-[10px] font-black">{spoilageRate}%</span>
              </div>
              <span className="text-[9px] font-black text-slate-500 uppercase leading-tight">Error<br/>Margin</span>
            </div>
          </div>
        </div>

        {/* 6. TABLE (Same layout as your original) */}
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
                  <th className="p-6">Location</th>
                  <th className="p-6">Valid Votes</th>
                  <th className="p-6">Leading Candidate</th>
                  <th className="p-6">Candidate Spread</th>
                  <th className="p-6 text-center">Invalid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.values(stats.positionBreakdown).map((pos, idx) => {
                  const sortedCands = [...pos.candidates].sort((a, b) => b.votes - a.votes);
                  const winner = sortedCands[0];
                  return (
                    <tr key={idx} className="hover:bg-blue-50/50 transition duration-200">
                      <td className="p-6">
                        <p className="font-black text-blue-900 uppercase text-sm tracking-tighter">{pos.posName}</p>
                        <p className="text-[9px] font-bold text-purple-600 uppercase italic leading-none">{winner?.campName || "Independent"}</p>
                      </td>
                      <td className="p-6">
                        <p className="text-xs font-black text-slate-800 uppercase leading-none">{pos.district}</p>
                        <p className="text-[9px] font-bold text-blue-600 uppercase mt-1">{pos.constituency}</p>
                      </td>
                      <td className="p-6 font-black text-slate-800 text-lg">{pos.posValid.toLocaleString()}</td>
                      <td className="p-6">
                        <div className="bg-yellow-100 px-3 py-1.5 rounded-xl inline-block border border-yellow-200">
                          <p className="text-[10px] font-black text-yellow-800 uppercase leading-none mb-1">{winner?.name}</p>
                          <p className="text-[11px] font-black text-blue-700 uppercase">{winner?.votes.toLocaleString()} Votes</p>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex -space-x-2">
                          {sortedCands.slice(0, 3).map((cand, i) => (
                            <div key={i} title={cand.name} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm uppercase">
                              {cand.name.charAt(0)}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-6 text-center font-black text-red-500">
                        <span className="bg-red-50 px-3 py-1 rounded-full border border-red-100 text-xs">{pos.posInvalid}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
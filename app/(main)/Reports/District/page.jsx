"use client";

import React, { useState, useMemo, useEffect } from "react";
import { db } from "@/app/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { MdOutlineLeaderboard, MdGppGood, MdErrorOutline, MdLocationCity } from "react-icons/md";

export default function StateOfRaceSummary() {
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

  // --- STRATEGIC AGGREGATION LOGIC ---
  const districtAnalytics = useMemo(() => {
    const districts = {};
    const processedSheets = new Set();

    results.forEach((item) => {
      const dName = item.district || "Unassigned";
      const pos = item.position;
      const candidate = item.name;
      const votes = Number(item.individualVotes || 0);
      const totalOverall = Number(item.totalOverallVotes || 0);
      const invalid = Number(item.invalidVotes || 0);
      const valid = totalOverall - invalid;
      const constituency = item.constituency || "N/A";

      const sheetKey = `${item.constituency}_${pos}_${item.resultPhotoUrl}`;

      if (!districts[dName]) {
        districts[dName] = { totalValid: 0, totalInvalid: 0, positions: {} };
      }

      if (!processedSheets.has(sheetKey)) {
        districts[dName].totalValid += valid;
        districts[dName].totalInvalid += invalid;
        processedSheets.add(sheetKey);
      }

      if (!districts[dName].positions[pos]) districts[dName].positions[pos] = {};

      // Store both votes and the constituency name
      if (!districts[dName].positions[pos][candidate]) {
        districts[dName].positions[pos][candidate] = { votes: 0, constituency: constituency };
      }
      districts[dName].positions[pos][candidate].votes += votes;
    });

    return districts;
  }, [results]);

  if (loading) return <div className="p-20 text-center font-black animate-bounce text-blue-900">GENERATING STRATEGIC SUMMARY...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">State of the Race</h1>
          <p className="text-red-600 font-bold text-xs uppercase tracking-[0.4em] mt-2">District-Level Strategic Intelligence</p>
        </header>

        <div className="grid grid-cols-1 gap-10">
          {Object.entries(districtAnalytics).map(([district, data]) => (
            <div key={district} className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">

              {/* DISTRICT HEADER STATS */}
              <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-500 p-4 rounded-3xl text-slate-900 shadow-lg">
                    <MdLocationCity size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black uppercase italic">{district}</h2>
                    <p className="text-yellow-500 font-bold text-[10px] tracking-widest uppercase">District Performance Overview</p>
                  </div>
                </div>

                <div className="flex gap-8">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Valid</p>
                    <p className="text-2xl font-black">{data.totalValid.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-red-400 uppercase mb-1">Total Invalid</p>
                    <p className="text-2xl font-black text-red-500">{data.totalInvalid.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* LEADERBOARD SECTION */}
              <div className="p-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <MdOutlineLeaderboard className="text-blue-600 text-lg" /> Current District Leaders
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(data.positions).map(([pos, candidates]) => {
                    // Sort based on the 'votes' property inside our new object structure
                    const leaderEntry = Object.entries(candidates).sort((a, b) => b[1].votes - a[1].votes)[0];
                    const leaderName = leaderEntry[0];
                    const leaderData = leaderEntry[1];

                    return (
                      <div key={pos} className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100 relative group hover:bg-blue-900 transition-all duration-300 shadow-sm hover:shadow-xl">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-[9px] font-black text-slate-400 group-hover:text-blue-300 uppercase tracking-tighter">
                            {pos}
                          </p>
                          <span className="text-[8px] bg-white group-hover:bg-blue-800 border group-hover:border-blue-700 px-2 py-0.5 rounded-full font-black text-slate-500 group-hover:text-white uppercase transition-colors">
                            {leaderData.constituency}
                          </span>
                        </div>

                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-lg font-black text-slate-800 group-hover:text-white leading-tight uppercase tracking-tighter">
                              {leaderName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-[11px] font-black text-blue-600 group-hover:text-yellow-400 uppercase">
                                {leaderData.votes.toLocaleString()} <span className="text-[8px] opacity-60">Votes</span>
                              </p>
                            </div>
                          </div>
                          <MdGppGood className="text-3xl text-green-500 group-hover:text-white opacity-20 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STRATEGIC INTERVENTION FOOTER */}
              <div className="bg-blue-50 p-4 px-8 border-t border-blue-100 flex justify-between items-center">
                <div className="flex items-center gap-2 text-blue-800">
                  <MdErrorOutline className="animate-pulse" />
                  <span className="text-[10px] font-black uppercase">Intervention Level: </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${data.totalInvalid > (data.totalValid * 0.05) ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                    {data.totalInvalid > (data.totalValid * 0.05) ? 'URGENT ATTENTION' : 'STABLE'}
                  </span>
                </div>
                <p className="text-[9px] font-bold text-blue-400 italic uppercase">Report Live: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
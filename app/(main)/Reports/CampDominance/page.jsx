"use client";

import React, { useState, useMemo, useEffect } from "react";
import { db } from "@/app/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { MdMilitaryTech, MdTrendingUp, MdGroups, MdEmojiEvents, MdLocationCity } from "react-icons/md";

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

  const analytics = useMemo(() => {
    const competitionMap = {}; // Tracks: { District_Position: { CampName: totalVotes } }
    const campWins = {}; // Tracks: { CampName: { PositionName: winCount } }

    // 1. GROUP VOTES BY DISTRICT AND POSITION TO FIND WINNERS
    results.forEach((item) => {
      const dName = item.district || "Unknown";
      const pos = item.position || "Unknown";
      const camp = item.campName?.toUpperCase() || "INDEPENDENT";
      const votes = Number(item.individualVotes || 0);
      
      // We group by District + Position (and Constituency if you want more granular wins)
      const competitionKey = `${dName}_${pos}`;

      if (!competitionMap[competitionKey]) competitionMap[competitionKey] = {};
      competitionMap[competitionKey][camp] = (competitionMap[competitionKey][camp] || 0) + votes;

      if (!campWins[camp]) campWins[camp] = { name: camp, totalWins: 0, breakdown: {} };
    });

    // 2. CALCULATE WHO WON EACH SEAT
    Object.entries(competitionMap).forEach(([key, campsInRace]) => {
      const positionName = key.split("_")[1];
      
      // Find the camp with the highest votes in this specific race
      const winner = Object.entries(campsInRace).sort((a, b) => b[1] - a[1])[0];
      const winningCamp = winner[0];
      const winningVotes = winner[1];

      // Only count as a win if they actually have votes (ignore 0-vote placeholders)
      if (winningVotes > 0) {
        campWins[winningCamp].totalWins += 1;
        campWins[winningCamp].breakdown[positionName] = (campWins[winningCamp].breakdown[positionName] || 0) + 1;
      }
    });

    return Object.values(campWins).sort((a, b) => b.totalWins - a.totalWins);
  }, [results]);

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-yellow-500">CALCULATING SEAT DISTRIBUTION...</div>;

  return (
    <div className="min-h-screen bg-red-600 p-4 md:p-10 text-white">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-1 w-12 bg-yellow-500"></div>
            <p className="text-yellow-500 font-black text-xs uppercase tracking-[0.4em]">Strategic Seat Distribution</p>
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic">Faction Victory Ledger</h1>
        </header>

        <div className="grid grid-cols-1 gap-8">
          {analytics.map((camp, index) => (
            <div key={camp.name} className="bg-slate-900 rounded-[3rem] overflow-hidden border border-slate-800 transition hover:border-yellow-500/40 shadow-2xl">
              
              {/* TOP BAR: CAMP NAME & TOTAL WINS */}
              <div className="p-8 flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
                <div className="flex items-center gap-6">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl ${index === 0 ? 'bg-yellow-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    <MdEmojiEvents size={40} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">{camp.name}</h2>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Total Positions Won Across Districts</p>
                  </div>
                </div>

                <div className="text-center md:text-right mt-6 md:mt-0">
                  <span className="text-6xl font-black text-white leading-none">{camp.totalWins}</span>
                  <p className="text-yellow-500 font-black text-[10px] uppercase tracking-widest">Seats Secured</p>
                </div>
              </div>

              {/* BOTTOM BAR: POSITION BREAKDOWN GRID */}
              <div className="p-8 bg-slate-950/40">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Positions Breakdown (Wins per Role)</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(camp.breakdown).length > 0 ? (
                    Object.entries(camp.breakdown).map(([pos, count]) => (
                      <div key={pos} className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 hover:bg-slate-800 transition-colors">
                        <p className="text-[9px] font-black text-blue-400 uppercase mb-1 truncate">{pos}</p>
                        <div className="flex items-end justify-between">
                          <span className="text-2xl font-black text-white">{count}</span>
                          <MdMilitaryTech className="text-slate-700" size={20} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-4 text-slate-600 text-xs font-black uppercase italic">
                      No positions won in current data set.
                    </div>
                  )}
                </div>
              </div>

              {/* WIN RATE INDICATOR */}
              <div className="px-8 py-4 bg-slate-900/20 border-t border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <MdLocationCity className="text-slate-600" />
                   <span className="text-[9px] font-black text-slate-500 uppercase">Multi-District Dominance Level:</span>
                   <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-900 text-blue-200">
                     {camp.totalWins > 5 ? 'High Influence' : 'Emerging'}
                   </span>
                </div>
                <p className="text-[9px] font-bold text-slate-700 italic">SYNCED WITH CLOUD LEDGER</p>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { db } from "@/app/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { MdVerifiedUser, MdHistory, MdGavel, MdError, MdCloudDone } from "react-icons/md";

export default function SubmissionAuditReport() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Order by newest first for the Audit log
    const q = query(collection(db, "Jagaban_results"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResults(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- AUDIT LOGIC: VERIFICATION ENGINE ---
  const auditLogs = useMemo(() => {
    return results.map(entry => {
      const expectedTotal = Number(entry.totalOverallVotes || 0);
      const invalid = Number(entry.invalidVotes || 0);
      const candidateVotes = Number(entry.individualVotes || 0);
      
      // Verification: Candidate votes should NEVER exceed (Total - Invalid)
      const isVerified = candidateVotes <= (expectedTotal - invalid);
      const timestamp = entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleString() : "Just now";

      return { ...entry, isVerified, timestamp };
    });
  }, [results]);

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-blue-900 uppercase">Opening Audit Vault...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* 1. AUDIT OVERVIEW HEADER */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border-l-[12px] border-blue-900">
          <div className="flex items-center gap-5">
            <div className="bg-blue-900 p-4 rounded-3xl text-white shadow-lg">
                <MdGavel size={35} />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter">Submission & Audit Log</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                <MdCloudDone className="text-green-500" /> Real-Time Integrity Monitoring
              </p>
            </div>
          </div>
          <div className="flex gap-6 mt-6 md:mt-0">
             <div className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase">Verified Records</p>
                <p className="text-2xl font-black text-green-600">{auditLogs.filter(l => l.isVerified).length}</p>
             </div>
             <div className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase text-red-500">Flags / Discrepancies</p>
                <p className="text-2xl font-black text-red-600">{auditLogs.filter(l => !l.isVerified).length}</p>
             </div>
          </div>
        </header>

        {/* 2. REAL-TIME SUBMISSION FEED */}
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200">
          <div className="p-6 px-10 bg-slate-900 text-white flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <MdHistory size={18} className="text-blue-400" /> Live Data Stream
            </h3>
            <span className="text-[10px] font-bold bg-white/10 px-4 py-1 rounded-full">Last Updated: {new Date().toLocaleTimeString()}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
                  <th className="p-6">Submission Time</th>
                  <th className="p-6">Coordinator Identity</th>
                  <th className="p-6">Location (Const.)</th>
                  <th className="p-6">Data Point</th>
                  <th className="p-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log, idx) => (
                  <tr key={log.id || idx} className={`hover:bg-slate-50/50 transition duration-150 ${!log.isVerified ? 'bg-red-50/50' : ''}`}>
                    <td className="p-6">
                      <p className="text-xs font-black text-slate-800">{log.timestamp.split(',')[1]}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{log.timestamp.split(',')[0]}</p>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-[10px]">
                           {log.submittedBy?.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                           <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">{log.submittedBy}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase italic">Device: Web Portal</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black text-slate-600 uppercase border border-slate-200">
                        {log.constituency}
                      </span>
                    </td>
                    <td className="p-6">
                      <p className="text-xs font-bold text-blue-900 uppercase leading-none">{log.position}</p>
                      <p className="text-[9px] text-slate-400 mt-1 italic">Candidate: {log.name}</p>
                    </td>
                    <td className="p-6 text-center">
                      {log.isVerified ? (
                        <div className="flex flex-col items-center text-green-600">
                           <MdVerifiedUser size={20} />
                           <span className="text-[8px] font-black uppercase">Cleared</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-red-600 animate-pulse">
                           <MdError size={20} />
                           <span className="text-[8px] font-black uppercase">Math Error</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. VERIFICATION FOOTER */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-200">
                <h4 className="font-black uppercase text-blue-900 text-sm mb-4">Integrity Disclaimer</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    This audit trail tracks the logical consistency of votes entered. 
                    <b className="text-red-600 ml-1">"Math Error"</b> flags occur when the 
                    individual candidate votes reported exceed the net valid votes for that position. 
                    Administrators should verify receipts for flagged entries.
                </p>
            </div>
            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-lg flex items-center justify-between text-white">
                <div>
                   <h4 className="font-black uppercase text-yellow-400 text-sm italic">Audit Export</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Download CSV for external oversight</p>
                </div>
                <button className="bg-blue-600 hover:bg-white hover:text-blue-900 transition px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl">
                    Export Log
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}
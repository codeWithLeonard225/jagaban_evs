"use client";
//app/(main)/page.jsx
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/app/context/AuthContext";

export default function UnifiedLogin() {
  const [formData, setFormData] = useState({ fullName: "", accessCode: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const coordQuery = query(
        collection(db, "Jagaban_coordinators"),
        where("fullName", "==", formData.fullName),
        where("accessCode", "==", formData.accessCode)
      );
      const coordSnap = await getDocs(coordQuery);

      if (!coordSnap.empty) {
        const userData = { ...coordSnap.docs[0].data(), type: "coordinator" };
        const targetPath = login(userData);
        router.push(targetPath);
        return;
      }

      const adminQuery = query(
        collection(db, "Jagaban_admins"),
        where("fullName", "==", formData.fullName),
        where("accessCode", "==", formData.accessCode)
      );
      const adminSnap = await getDocs(adminQuery);

      if (!adminSnap.empty) {
        const adminData = { ...adminSnap.docs[0].data(), type: "admin" };
        const targetPath = login(adminData);
        router.push(targetPath);
        return;
      }

      setError("❌ Invalid Full Name or Access Code");
    } catch (err) {
      setError("⚠️ Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-10 relative border-b-8 border-red-600">
        
        {/* BRANDING HEADER WITH PHOTO */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-4">
            {/* The Ring/Glow behind the photo */}
            <div className="absolute inset-0 bg-blue-900 rounded-full blur-md opacity-20 scale-110 animate-pulse"></div>
            
            {/* Presidential Photo */}
            <div className="relative w-24 h-24 mx-auto rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-200">
                <img 
                    src="/images/jagaban.jpeg" 
                    alt="Jagaban" 
                    className="w-full h-full object-cover"
                />
            </div>
          </div>
          
          <h1 className="text-4xl font-black text-blue-900 uppercase tracking-tighter leading-none">
            Jagaban
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="h-[1px] w-8 bg-slate-200"></span>
            <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em]">
              Secure Access Portal
            </p>
            <span className="h-[1px] w-8 bg-slate-200"></span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-[11px] font-black rounded-2xl text-center border border-red-100 animate-bounce">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase ml-3 mb-1 block">Registered Name</label>
            <input
              name="fullName"
              type="text"
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full p-4 px-6 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-900 focus:bg-white focus:ring-0 transition-all font-bold text-slate-800"
              required
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase ml-3 mb-1 block">Passcode</label>
            <input
              name="accessCode"
              type="password"
              onChange={handleChange}
              placeholder="••••"
              className="w-full p-4 px-6 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-900 focus:bg-white focus:ring-0 transition-all font-bold text-slate-800"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 mt-4 rounded-2xl text-white font-black shadow-xl transition-all flex items-center justify-center gap-3 ${
              loading ? "bg-slate-400 cursor-not-allowed" : "bg-blue-900 hover:bg-black hover:-translate-y-1 active:translate-y-0"
            }`}
          >
            {loading ? (
                <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    VERIFYING...
                </>
            ) : "ENTER COMMAND CENTER"}
          </button>
        </form>

        <footer className="mt-10 text-center">
          <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">
            Identity verification required <br /> 
            <span className="text-slate-400">© 2026 Jagaban Multimedia Group</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
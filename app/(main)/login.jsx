"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function UnifiedLogin() {
  const [formData, setFormData] = useState({ fullName: "", accessCode: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Check if already logged in on mount
  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (session) {
      const user = JSON.parse(session);
      redirectUser(user);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(""); // Clear error when typing
  };

  const redirectUser = (user) => {
    if (user.type === "coordinator") {
      router.push("/ConstituencyForm");
    } else if (user.type === "admin") {
      switch (user.role?.toLowerCase()) {
        case "media":
          router.push("/dashboard/Media_Admin");
          break;
        case "coordinator":
          router.push("/dashboard/Cordinator_Admin");
          break;
        case "ceo":
          router.push("/dashboard/Ceo_admin");
          break;
        default:
          setError("⚠️ Admin role not recognized.");
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Check Jagaban_coordinators
      const coordQuery = query(
        collection(db, "Jagaban_coordinators"),
        where("fullName", "==", formData.fullName),
        where("accessCode", "==", formData.accessCode)
      );
      const coordSnap = await getDocs(coordQuery);

      // if (!coordSnap.empty) {
      //   const userData = coordSnap.docs[0].data();
      //   const sessionData = {
      //     fullName: userData.fullName,
      //     accessCode: userData.accessCode,
      //     district: userData.district,
      //     constituency: userData.constituency,
      //     photoUrl: userData.photoUrl,
      //     type: "coordinator",
      //   };
      //   localStorage.setItem("userSession", JSON.stringify(sessionData));
      //   router.push("/ConstituencyForm");
      //   return;
      // }

      if (!coordSnap.empty) {
  const userData = coordSnap.docs[0].data();
  const sessionData = {
    fullName: userData.fullName,
    accessCode: userData.accessCode,
    district: userData.district,
    constituency: userData.constituency,
    // EXPLICITLY MAP THE CLOUDINARY URL
    photoUrl: userData.photoUrl || "", 
    type: "coordinator",
  };
  localStorage.setItem("userSession", JSON.stringify(sessionData));
  router.push("/ConstituencyForm");
  return;
}

      // 2. Check Jagaban_admins
      const adminQuery = query(
        collection(db, "Jagaban_admins"),
        where("fullName", "==", formData.fullName),
        where("accessCode", "==", formData.accessCode)
      );
      const adminSnap = await getDocs(adminQuery);

      if (!adminSnap.empty) {
        const adminData = adminSnap.docs[0].data();
        const sessionData = { ...adminData, type: "admin" };
        localStorage.setItem("userSession", JSON.stringify(sessionData));
        redirectUser(sessionData);
        return;
      }

      setError("❌ Invalid Full Name or Access Code");
    } catch (err) {
      console.error("Login Error:", err);
      setError("⚠️ Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border-t-8 border-blue-900">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-blue-900 uppercase tracking-tighter">Jagaban</h1>
          <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em]">Secure Access Portal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Full Name</label>
            <input
              name="fullName"
              type="text"
              onChange={handleChange}
              placeholder="Enter Registered Name"
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-900 font-bold placeholder:text-gray-300"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Access Code</label>
            <input
              name="accessCode"
              type="password"
              onChange={handleChange}
              placeholder="••••"
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-900 font-bold placeholder:text-gray-300"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 rounded-2xl text-white font-black shadow-lg transition transform active:scale-95 ${
              loading ? "bg-gray-400" : "bg-blue-900 hover:bg-black"
            }`}
          >
            {loading ? "AUTHENTICATING..." : "SIGN IN"}
          </button>
        </form>

        <p className="mt-8 text-center text-[9px] text-gray-300 font-bold uppercase tracking-widest leading-loose">
          Authorized Personnel Only <br /> © 2026 Jagaban Multimedia
        </p>
      </div>
    </div>
  );
}
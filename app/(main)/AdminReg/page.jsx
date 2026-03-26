"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, where, getDocs } from "firebase/firestore";
import { uploadToCloudinary } from "@/app/lib/cloudinaryUpload";

export default function AdminRegistration() {
  const router = useRouter();
  
  // 1. STATE MANAGEMENT (Same as your Coordinator logic)
  const [formData, setFormData] = useState({
    fullName: "",
    accessCode: "",
    role: "Media",
    photo: null, // Stores the actual File object
  });
  
  const [preview, setPreview] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 2. FETCH ADMIN DIRECTORY (Real-time)
  useEffect(() => {
    const q = query(collection(db, "Jagaban_admins"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdmins(list);
    });
    return () => unsubscribe();
  }, []);

  // 3. HANDLERS
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, photo: file }));
      setPreview(URL.createObjectURL(file)); // Create UI preview
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.photo) return alert("⚠️ Please upload an admin portrait");
    
    setLoading(true);
    setError("");

    try {
      // Step A: Check for duplicate Name
      const checkQ = query(collection(db, "Jagaban_admins"), where("fullName", "==", formData.fullName));
      const checkSnap = await getDocs(checkQ);
      if (!checkSnap.empty) throw new Error("This Admin name already exists!");

      // Step B: Upload to Cloudinary (Using your helper)
      const photoUrl = await uploadToCloudinary(formData.photo);

      // Step C: Prepare Data (Remove File object, add URL)
      const { photo, ...textData } = formData;
      const finalData = {
        ...textData,
        photoUrl,
        createdAt: new Date(),
      };

      // Step D: Save to Firestore
      await addDoc(collection(db, "Jagaban_admins"), finalData);

      // Step E: Reset
      setFormData({ fullName: "", accessCode: "", role: "Media", photo: null });
      setPreview(null);
      alert("✅ Admin Access Granted Successfully!");
    } catch (err) {
      console.error(err);
      setError(err.message || "Connection Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT: REGISTRATION FORM */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border-t-8 border-blue-900">
          <header className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-black text-blue-900 uppercase tracking-tighter">Admin Registry</h2>
            <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">Jagaban Central Authority</p>
          </header>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-[10px] font-bold rounded-xl text-center border border-red-100">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* PHOTO UPLOAD BOX */}
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[2rem] p-6 bg-gray-50 group hover:border-blue-900 transition duration-300">
              {preview ? (
                <img src={preview} alt="Preview" className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg mb-3" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-3 font-black text-[10px] text-gray-400">ADMIN PIC</div>
              )}
              <label className="cursor-pointer bg-blue-900 text-white text-[10px] font-black px-6 py-2.5 rounded-full hover:bg-black transition active:scale-95 shadow-md">
                SELECT IMAGE
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            </div>

            <div className="space-y-4">
              <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Admin Full Name" className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-900 font-bold" required />
              
              <div className="grid grid-cols-2 gap-4">
                <input name="accessCode" value={formData.accessCode} onChange={handleChange} placeholder="Access Code" type="password" className="p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-900 font-bold" required />
                <select name="role" value={formData.role} onChange={handleChange} className="p-4 bg-gray-50 border-none rounded-2xl font-bold text-xs text-blue-900" required>
                  <option value="Media">Media Admin</option>
                  <option value="Coordinator">Coordinator Admin</option>
                  <option value="CEO">CEO Admin</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full text-white font-black py-5 rounded-2xl shadow-xl transition transform active:scale-95 ${loading ? 'bg-gray-400' : 'bg-red-700 hover:bg-black'}`}
            >
              {loading ? "SYNCHRONIZING..." : "GENERATE ADMIN ACCOUNT"}
            </button>
          </form>
        </div>

        {/* RIGHT: ADMIN DIRECTORY */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-blue-900 uppercase px-2 tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Management Hierarchy
          </h3>
          
          <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {admins.map((a) => (
              <div key={a.id} className="bg-white p-4 rounded-3xl shadow-sm flex items-center gap-4 border border-gray-100 hover:shadow-md transition">
                <div className="w-14 h-14 bg-gray-100 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                  {a.photoUrl && <img src={a.photoUrl} className="w-full h-full object-cover" alt="Admin" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 text-sm truncate uppercase">{a.fullName}</p>
                  <p className={`text-[9px] font-black px-2 py-0.5 rounded-full inline-block mt-1 ${
                    a.role === "CEO" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                  }`}>
                    {a.role} AUTHORITY
                  </p>
                  <p className="text-[9px] text-gray-400 mt-1">CODE: {a.accessCode}</p>
                </div>
                <button 
                  onClick={() => router.push("/")}
                  className="p-2 text-gray-300 hover:text-blue-900 transition"
                >
                  ➜
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
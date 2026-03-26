"use client";

import React, { useState, useMemo, useEffect } from "react";
import { db } from "@/app/lib/firebase"; // Adjust path as needed
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { uploadToCloudinary } from "@/app/lib/cloudinaryUpload";

export default function CoordinatorRegistration() {
  const districtMapping = {
    "Kailahun": { start: 1, end: 10 }, "Kenema": { start: 11, end: 21 },
    "Kono": { start: 22, end: 30 }, "Bombali": { start: 31, end: 38 },
    "Falaba": { start: 39, end: 42 }, "Koinadugu": { start: 43, end: 46 },
    "Tonkolili": { start: 47, end: 56 }, "Kambia": { start: 57, end: 62 },
    "Karene": { start: 63, end: 67 }, "Port Loko": { start: 68, end: 77 },
    "Bo": { start: 78, end: 88 }, "Bonthe": { start: 89, end: 92 },
    "Moyamba": { start: 93, end: 98 }, "Pujehun": { start: 99, end: 104 },
    "Rural District": { start: 105, end: 112 }, "East District": { start: 113, end: 123 },
    "West West": { start: 124, end: 132 },
  };

  const [formData, setFormData] = useState({
    fullName: "", tel: "", address: "", accessCode: "", district: "", constituency: "", photo: null,
  });
  
  const [preview, setPreview] = useState(null);
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- FETCH DATA FROM FIREBASE ---
  useEffect(() => {
    const q = query(collection(db, "Jagaban_coordinators"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCoordinators(staffList);
    });
    return () => unsubscribe();
  }, []);

  const filteredConstituencies = useMemo(() => {
    if (!formData.district) return [];
    const range = districtMapping[formData.district];
    const list = [];
    for (let i = range.start; i <= range.end; i++) {
      list.push(`Con ${i.toString().padStart(3, "0")}`);
    }
    return list;
  }, [formData.district]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "district") {
      setFormData((prev) => ({ ...prev, district: value, constituency: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, photo: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.photo) return alert("Please upload a photo");
    
    setLoading(true);
    try {
      // 1. Upload Photo to Cloudinary
      const photoUrl = await uploadToCloudinary(formData.photo);

      // 2. Prepare Data for Firestore (remove the File object)
      const { photo, ...textData } = formData;
      const finalData = {
        ...textData,
        photoUrl,
        createdAt: new Date(),
      };

      // 3. Save to Firebase
      await addDoc(collection(db, "Jagaban_coordinators"), finalData);

      // 4. Reset Form
      setFormData({ fullName: "", tel: "", address: "", accessCode: "", district: "", constituency: "", photo: null });
      setPreview(null);
      alert("✅ Coordinator Saved to Database!");
    } catch (error) {
      console.error(error);
      alert("❌ Error saving data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div className="bg-white p-8 rounded-3xl shadow-xl border-t-8 border-red-600">
          <header className="mb-6">
            <h2 className="text-2xl font-black text-gray-800 uppercase">Register Staff</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Cloud Database Sync Enabled</p>
          </header>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50">
              {preview ? (
                <img src={preview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-2" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-2 font-black text-[10px] text-gray-400">NO PHOTO</div>
              )}
              <label className="cursor-pointer bg-blue-900 text-white text-[10px] font-black px-4 py-2 rounded-full hover:bg-blue-800 transition">
                UPLOAD
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            </div>

            <div className="space-y-4">
              <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Full Name" className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-900" required />
              
              <div className="grid grid-cols-2 gap-4">
                <input name="tel" value={formData.tel} onChange={handleChange} placeholder="Telephone" type="tel" className="p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-900" required />
                <input name="accessCode" value={formData.accessCode} onChange={handleChange} placeholder="Access Code" type="password" className="p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-900" required />
              </div>

              <input name="address" value={formData.address} onChange={handleChange} placeholder="Residential Address" className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-900" required />

              <div className="grid grid-cols-2 gap-4">
                <select name="district" value={formData.district} onChange={handleChange} className="p-4 bg-gray-50 border-none rounded-2xl font-bold text-xs" required>
                  <option value="">District</option>
                  {Object.keys(districtMapping).map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <select name="constituency" value={formData.constituency} onChange={handleChange} disabled={!formData.district} className="p-4 bg-gray-50 border-none rounded-2xl font-bold text-xs disabled:opacity-50" required>
                  <option value="">Con</option>
                  {filteredConstituencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full text-white font-black py-4 rounded-2xl shadow-lg transition active:scale-95 ${loading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {loading ? "SAVING TO CLOUD..." : "REGISTER STAFF"}
            </button>
          </form>
        </div>

        {/* Directory View (Real-time from Firebase) */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-blue-900 uppercase px-2 tracking-widest">Active Directory</h3>
          <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {coordinators.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-4 border border-gray-100">
                <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                  {c.photoUrl && <img src={c.photoUrl} className="w-full h-full object-cover" alt="Staff" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{c.fullName}</p>
                  <p className="text-[10px] text-red-600 font-black">{c.district} — {c.constituency}</p>
                  <p className="text-[9px] text-gray-400 truncate">{c.tel}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                    <span className="font-bold text-gray-800 text-sm truncate">ID:{c.id.substring(0,5)}</span>
                    <span className="font-bold text-gray-800 text-sm truncate">Code:{c.accessCode}</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
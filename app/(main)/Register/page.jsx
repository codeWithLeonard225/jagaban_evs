"use client";

import React, { useState, useMemo, useEffect } from "react";
import { db } from "@/app/lib/firebase"; 
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { uploadToCloudinary } from "@/app/lib/cloudinaryUpload";
import { MdEdit, MdDelete, MdClose, MdCloudUpload } from "react-icons/md";

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

  const initialForm = { fullName: "", tel: "", address: "", accessCode: "", district: "", constituency: "", photo: null };
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null); // Track which staff is being updated
  const [preview, setPreview] = useState(null);
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // --- ACTIONS ---

  const handleEdit = (staff) => {
    setEditingId(staff.id);
    setFormData({ ...staff, photo: null }); // Don't reset photo unless user uploads new one
    setPreview(staff.photoUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this coordinator? This cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "Jagaban_coordinators", id));
        alert("Staff removed successfully");
      } catch (error) {
        alert("Error deleting record");
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData(initialForm);
    setPreview(null);
  };

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
    setLoading(true);
    try {
      let finalPhotoUrl = preview;

      // Only upload if a NEW photo was selected
      if (formData.photo) {
        finalPhotoUrl = await uploadToCloudinary(formData.photo);
      }

      const { photo, id, ...textData } = formData;
      const finalData = {
        ...textData,
        photoUrl: finalPhotoUrl,
        updatedAt: new Date(),
      };

      if (editingId) {
        // UPDATE MODE
        await updateDoc(doc(db, "Jagaban_coordinators", editingId), finalData);
        alert("✅ Coordinator Updated!");
      } else {
        // CREATE MODE
        if (!formData.photo) throw new Error("Photo required for new registration");
        await addDoc(collection(db, "Jagaban_coordinators"), { ...finalData, createdAt: new Date() });
        alert("✅ Coordinator Registered!");
      }

      handleCancel();
    } catch (error) {
      console.error(error);
      alert(error.message || "❌ Error saving data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* FORM SECTION */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border-t-8 border-red-600 h-fit sticky top-6">
          <header className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-gray-800 uppercase">
                {editingId ? "Update Staff" : "Register Staff"}
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                {editingId ? `Editing ID: ${editingId.substring(0,8)}` : "Cloud Database Sync Enabled"}
              </p>
            </div>
            {editingId && (
              <button onClick={handleCancel} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition">
                <MdClose size={20} className="text-gray-600" />
              </button>
            )}
          </header>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50 relative">
              {preview ? (
                <img src={preview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-2" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-2 font-black text-[10px] text-gray-400">NO PHOTO</div>
              )}
              <label className="cursor-pointer bg-blue-900 text-white text-[10px] font-black px-4 py-2 rounded-full hover:bg-blue-800 transition flex items-center gap-2">
                <MdCloudUpload /> {editingId ? "CHANGE" : "UPLOAD"}
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            </div>

            <div className="space-y-4">
              <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Full Name" className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-900" required />
              
              <div className="grid grid-cols-2 gap-4">
                <input name="tel" value={formData.tel} onChange={handleChange} placeholder="Telephone" type="tel" className="p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-900" required />
                <input name="accessCode" value={formData.accessCode} onChange={handleChange} placeholder="Access Code" type="text" className="p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-900" required />
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
              className={`w-full text-white font-black py-4 rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 ${loading ? 'bg-gray-400' : editingId ? 'bg-blue-900 hover:bg-blue-800' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {loading ? "PROCESSING..." : editingId ? "UPDATE RECORD" : "REGISTER STAFF"}
            </button>
          </form>
        </div>

        {/* DIRECTORY SECTION */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-blue-900 uppercase px-2 tracking-widest flex justify-between">
            Active Directory <span>({coordinators.length})</span>
          </h3>
          <div className="max-h-[750px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {coordinators.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-4 border border-gray-100 hover:border-blue-200 transition group">
                <div className="w-14 h-14 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                  {c.photoUrl && <img src={c.photoUrl} className="w-full h-full object-cover" alt="Staff" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{c.fullName}</p>
                  <p className="text-[10px] text-red-600 font-black uppercase tracking-tighter">{c.district} • {c.constituency}</p>
                  <p className="text-[10px] font-mono text-gray-400 mt-1">CODE: {c.accessCode}</p>
                </div>
                
                {/* CRUD ACTIONS */}
                <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(c)}
                      className="p-2 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                      title="Edit Profile"
                    >
                      <MdEdit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(c.id)}
                      className="p-2 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                      title="Delete Staff"
                    >
                      <MdDelete size={18} />
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
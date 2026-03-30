"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { collection, addDoc, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { uploadToCloudinary } from "@/app/lib/cloudinaryUpload"; // Ensure this is correctly exported
import { MdPhoto, MdVisibility } from "react-icons/md";

export default function ConstituencyForm() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const positionsList = [
    "Chairman", "Deputy Chairman", "Secretary", "Assistant Secretary",
    "Constituency Organising Secretary", "Deputy Organising Secretary",
    "Treasurer", "Assistant Treasurer", "PRO", "Deputy PRO",
    "Women's Leader", "Deputy Women's Leader", "Veteran's Leader",
    "Deputy Veteran's Leader", "Young Leader", "Deputy Young Leader",
    "Sitting APC MP", "Sitting APC Councilor - Ward 1",
    "Sitting APC Councilor - Ward 2", "Sitting APC Councilor - Ward 3",
    "Sitting APC Councilor - Ward 4",
  ];

  const [formData, setFormData] = useState({
    position: "", name: "", campName: "",
    totalOverallVotes: "", invalidVotes: "",
    individualVotes: "", remarks: "", photo: null,
  });

  const [results, setResults] = useState([]);

  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (!session) {
      router.push("/login");
      return;
    }
    const userData = JSON.parse(session);
    setUser(userData);

    const q = query(
      collection(db, "Jagaban_results"),
      where("constituency", "==", userData.constituency)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResults(data);
    });

    return () => unsubscribe();
  }, [router]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, photo: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const calculatePercentage = (individual, total, invalid) => {
    const valid = total - invalid;
    return valid > 0 ? ((individual / valid) * 100).toFixed(2) : "0.00";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const total = Number(formData.totalOverallVotes);
    const invalid = Number(formData.invalidVotes);
    const individual = Number(formData.individualVotes);

    if (individual > (total - invalid)) {
      alert("⚠️ Candidate votes cannot exceed valid votes!");
      return;
    }

    if (!formData.photo) {
      alert("⚠️ Please upload a photo of the result sheet!");
      return;
    }

    setLoading(true);
    try {
      // 1. Upload the photo first to get the URL
      const uploadedUrl = await uploadToCloudinary(formData.photo);

      // 2. Prepare the final entry with the fresh URL
      const { photo, ...otherData } = formData;
      const newEntry = {
        ...otherData,
        totalOverallVotes: total,
        invalidVotes: invalid,
        individualVotes: individual,
        percentage: calculatePercentage(individual, total, invalid),
        submittedBy: user.fullName,
        district: user.district,
        constituency: user.constituency,
        resultPhotoUrl: uploadedUrl, 
        createdAt: new Date(),
      };

      await addDoc(collection(db, "Jagaban_results"), newEntry);

      // 3. Reset everything
      setFormData({ position: "", name: "", campName: "", totalOverallVotes: "", invalidVotes: "", individualVotes: "", remarks: "", photo: null });
      setPreview(null);
      alert("✅ Result & Proof Synchronized Successfully");
    } catch (error) {
      console.error(error);
      alert("❌ Cloud sync or upload failed");
    } finally {
      setLoading(false);
    }
  };

  const grandTotals = useMemo(() => {
    return results.reduce((acc, item) => {
      const overall = Number(item.totalOverallVotes || 0);
      const invalid = Number(item.invalidVotes || 0);
      acc.overall += overall;
      acc.invalid += invalid;
      acc.valid += (overall - invalid);
      acc.votes += Number(item.individualVotes || 0);
      return acc;
    }, { overall: 0, invalid: 0, valid: 0, votes: 0 });
  }, [results]);

  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.position]) acc[item.position] = [];
    acc[item.position].push(item);
    return acc;
  }, {});

  if (!user) return <div className="p-20 text-center font-black animate-pulse">VERIFYING...</div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
        {/* HEADER NAV */}
      <nav className="bg-red-700 text-white p-4 shadow-xl flex justify-between items-center px-6 sticky top-0 z-50">
        {/* Replace your current nav profile section with this */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-md flex items-center justify-center">
            {user?.photoUrl ? (
              <img
                src={user.photoUrl}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=" + user.fullName; }}
              />
            ) : (
              <span className="text-gray-400 font-black text-xs">IMG</span>
            )}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase leading-none text-white">{user?.fullName}</p>
            <p className="text-[9px] text-red-200 font-bold uppercase mt-1">
              {user?.district} | {user?.constituency}
            </p>
          </div>
        </div>
        <button
          onClick={() => { localStorage.clear(); router.push("/"); }}
          className="text-[9px] bg-blue-800 px-3 py-1.5 rounded-lg font-black hover:bg-black transition"
        >
          LOGOUT
        </button>
      </nav>
      
      <div className="max-w-7xl mx-auto p-4 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* FORM SECTION */}
          <div className="lg:col-span-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-6 border-t-8 border-blue-700 space-y-4 sticky top-24">
              <h2 className="font-bold text-gray-700 border-b pb-2">Record Vote</h2>

              {/* PHOTO UPLOAD */}
              <div className="relative group">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50 cursor-pointer hover:bg-blue-50 transition">
                  {preview ? (
                    <div className="relative w-full h-32">
                        <img src={preview} alt="Result Preview" className="w-full h-full object-cover rounded-xl" />
                        <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <span className="text-white text-[10px] font-black uppercase">Change Photo</span>
                        </div>
                    </div>
                  ) : (
                    <>
                      <MdPhoto size={30} className="text-gray-300" />
                      <p className="text-[10px] font-black text-gray-400 uppercase mt-2">Upload Result Proof</p>
                    </>
                  )}
                  <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
                </label>
              </div>

              {/* ... Other input fields remain same ... */}
              <select name="position" value={formData.position} onChange={handleChange} className="w-full p-3 bg-gray-50 border rounded-xl font-bold" required>
                <option value="">-- Select Position --</option>
                {positionsList.map((p, i) => <option key={i} value={p}>{p}</option>)}
              </select>
              <input name="name" value={formData.name} onChange={handleChange} placeholder="Candidate Name" className="w-full p-3 border rounded-xl" required />
              <input name="campName" value={formData.campName} onChange={handleChange} placeholder="Camp Name" className="w-full p-3 border rounded-xl" required />

              <div className="grid grid-cols-2 gap-2 bg-blue-50 p-3 rounded-xl">
                <input type="number" name="totalOverallVotes" value={formData.totalOverallVotes} onChange={handleChange} placeholder="Total" className="p-2 rounded border text-center font-bold" required />
                <input type="number" name="invalidVotes" value={formData.invalidVotes} onChange={handleChange} placeholder="Invalid" className="p-2 rounded border text-center font-bold text-red-600" required />
                <div className="col-span-2">
                  <input type="number" name="individualVotes" value={formData.individualVotes} onChange={handleChange} placeholder="Candidate's Votes" className="w-full p-3 rounded border-2 border-blue-300 text-center text-xl font-black text-blue-700" required />
                </div>
              </div>
                <textarea name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Remarks..." className="w-full p-3 bg-gray-50 border rounded-xl text-xs italic" />

              <button
                disabled={loading}
                className={`w-full text-white font-black py-4 rounded-2xl shadow-lg transition ${loading ? 'bg-gray-400 animate-pulse' : 'bg-red-700 active:scale-95'}`}
              >
                {loading ? "PROCESSING UPLOAD..." : "SAVE TO REPORT"}
              </button>
            </form>
          </div>

          {/* REPORT SECTION */}
         {/* REPORT SECTION */}
<div className="lg:col-span-8">
  <div className="space-y-8">
    {Object.keys(groupedResults).map((posName) => {
      const positionData = groupedResults[posName];

      // --- CALCULATE TOTALS FOR THIS POSITION ---
      const posTotalOverall = positionData.reduce((sum, item) => sum + Number(item.totalOverallVotes || 0), 0);
      const posTotalInvalid = positionData.reduce((sum, item) => sum + Number(item.invalidVotes || 0), 0);
      const posTotalValid = posTotalOverall - posTotalInvalid;

      return (
        <div key={posName} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200">
          <div className="bg-blue-900 p-4 text-white font-black uppercase text-xs tracking-widest px-6 flex justify-between">
            <span>{posName}</span>
            <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded uppercase">Live Data</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[9px] uppercase text-gray-400 border-b">
                <tr>
                  <th className="p-4">Proof</th>
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Camp</th>
                  <th className="p-4 text-center bg-gray-100">Valid</th>
                  <th className="p-4 text-center text-red-400">Invalid</th>
                  <th className="p-4 text-center bg-blue-50">Total</th>
                  <th className="p-4 text-center">Votes</th>
                  <th className="p-4 text-center bg-yellow-50">%</th>
                  <th className="p-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {positionData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/50">
                    <td className="p-4">
                      {item.resultPhotoUrl ? (
                        <a href={item.resultPhotoUrl} target="_blank" rel="noreferrer" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border hover:border-blue-500 transition overflow-hidden">
                          <img src={item.resultPhotoUrl} className="w-full h-full object-cover" alt="Proof" />
                        </a>
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-[8px] text-gray-400 font-bold border-2 border-dashed">N/A</div>
                      )}
                    </td>
                    <td className="p-4 font-bold text-blue-900 truncate max-w-[120px]">{item.name}</td>
                    <td className="p-4 text-gray-500 uppercase font-bold text-[9px]">{item.campName}</td>
                    <td className="p-4 text-center font-medium bg-gray-50">{item.totalOverallVotes - item.invalidVotes}</td>
                    <td className="p-4 text-center text-red-500 font-medium">{item.invalidVotes}</td>
                    <td className="p-4 text-center font-medium bg-blue-50/50">{item.totalOverallVotes}</td>
                    <td className="p-4 text-center font-black text-gray-800">{item.individualVotes}</td>
                    <td className="p-4 text-center bg-yellow-50/50 font-black text-yellow-700">{item.percentage}%</td>
                    <td className="p-4 italic text-gray-400 text-[10px] truncate max-w-[80px]">{item.remarks || "---"}</td>
                  </tr>
                ))}
              </tbody>

              {/* --- ADDED FOOTER --- */}
              <tfoot className="bg-gray-900 text-white border-t-4 border-red-600">
                <tr>
                  <td colSpan="9" className="p-4 text-[10px]">
                    <div className="flex justify-between items-center">
                      <span className="font-black uppercase text-red-400 tracking-tighter">Verified Position Totals:</span>
                      <div className="flex gap-4">
                        <span>Valid: <b className="text-green-400">{posTotalValid}</b></span>
                        <span>Inv: <b className="text-red-400">{posTotalInvalid}</b></span>
                        <span className="bg-white/10 px-3 py-1 rounded-full">Total: <b className="text-white">{posTotalOverall}</b></span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>

            </table>
          </div>
        </div>
      );
    })}
  </div>
</div>

        </div>
      </div>
    </div>
  );
}
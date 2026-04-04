"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { collection, addDoc, onSnapshot, query, where } from "firebase/firestore";
import { uploadToCloudinary } from "@/app/lib/cloudinaryUpload";
import { MdPhoto, MdAdd, MdDelete } from "react-icons/md";

export default function ConstituencyForm() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const positionsList = [
    "Chairman", "Deputy Chairman", "Secretary", "Assistant Secretary",
    "Organising Secretary", "Deputy Organising Secretary",
    "Treasurer", "Assistant Treasurer", "PRO", "Deputy PRO",
    "Women's Leader", "Deputy Women's Leader", "Veteran's Leader",
    "Deputy Veteran's Leader", "Young Congress Leader", "Deputy Young Congress Leader",
   
  ];

  // Initial state for a single candidate row
  const emptyCandidate = { name: "", campName: "", individualVotes: "" };

  const [formData, setFormData] = useState({
    position: "",
    totalOverallVotes: "",
    invalidVotes: "",
    remarks: "",
    photo: null,
    candidates: [emptyCandidate], // Array of candidates
  });

  const [results, setResults] = useState([]);

  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (!session) { router.push("/login"); return; }
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

  // Handle Top-level inputs
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Handle Candidate array inputs
  const handleCandidateChange = (index, e) => {
    const newCandidates = [...formData.candidates];
    newCandidates[index][e.target.name] = e.target.value;
    setFormData({ ...formData, candidates: newCandidates });
  };

  const addCandidateRow = () => {
    setFormData({ ...formData, candidates: [...formData.candidates, { ...emptyCandidate }] });
  };

  const removeCandidateRow = (index) => {
    const newCandidates = formData.candidates.filter((_, i) => i !== index);
    setFormData({ ...formData, candidates: newCandidates });
  };

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
    const validVotes = total - invalid;

    // Validation
    if (!formData.photo) return alert("⚠️ Upload result proof!");
    if (formData.candidates.some(c => !c.name || !c.individualVotes)) return alert("⚠️ Fill all candidate details!");
    if (submittedPositions.includes(formData.position)) {
  alert("⚠️ This position has already been submitted!");
  return;
}

    const combinedCandidateVotes = formData.candidates.reduce((sum, c) => sum + Number(c.individualVotes), 0);
    if (combinedCandidateVotes > validVotes) return alert("⚠️ Total candidate votes exceed valid votes!");

    setLoading(true);
    try {
      const uploadedUrl = await uploadToCloudinary(formData.photo);

      // Loop through candidates and save each as a separate entry sharing the same meta-data
      const uploadPromises = formData.candidates.map((cand) => {
        const individual = Number(cand.individualVotes);
        const entry = {
          position: formData.position,
          name: cand.name,
          campName: cand.campName,
          totalOverallVotes: total,
          invalidVotes: invalid,
          individualVotes: individual,
          percentage: calculatePercentage(individual, total, invalid),
          remarks: formData.remarks,
          submittedBy: user.fullName,
          district: user.district,
          constituency: user.constituency,
          resultPhotoUrl: uploadedUrl,
          createdAt: new Date(),
        };
        return addDoc(collection(db, "Jagaban_results"), entry);
      });

      await Promise.all(uploadPromises);

      // Reset
      setFormData({ 
        position: "", totalOverallVotes: "", invalidVotes: "", 
        remarks: "", photo: null, candidates: [emptyCandidate] 
      });
      setPreview(null);
      alert("✅ All candidates for " + formData.position + " synchronized!");
    } catch (error) {
      console.error(error);
      alert("❌ Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.position]) acc[item.position] = [];
    acc[item.position].push(item);
    return acc;
  }, {});

  const submittedPositions = useMemo(() => {
  const unique = new Set();
  results.forEach(item => {
    if (item.position) {
      unique.add(item.position);
    }
  });
  return Array.from(unique);
}, [results]);

const availablePositions = useMemo(() => {
  return positionsList.filter(pos => !submittedPositions.includes(pos));
}, [positionsList, submittedPositions]);

  if (!user) return <div className="p-20 text-center font-black animate-pulse">VERIFYING...</div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      {/* NAV SECTION (Remains same as your code) */}
      <nav className="bg-red-700 text-white p-4 shadow-xl flex justify-between items-center px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black text-red-700 text-xs">
                {user.fullName.charAt(0)}
            </div>
            <div>
                <p className="text-[10px] font-black uppercase leading-none">{user.fullName}</p>
                <p className="text-[9px] text-red-200 font-bold uppercase">{user.district} | {user.constituency}</p>
            </div>
        </div>
        <button onClick={() => { localStorage.clear(); router.push("/"); }} className="text-[9px] bg-blue-800 px-3 py-1.5 rounded-lg font-black uppercase">LOGOUT</button>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* FORM SECTION */}
          <div className="lg:col-span-5">
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-6 border-t-8 border-blue-700 space-y-4 sticky top-24">
              <h2 className="font-black text-gray-700 border-b pb-2 uppercase text-sm tracking-tighter">Record Position Results</h2>

              <select name="position" value={formData.position} onChange={handleChange} className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm" required>
                <option value="">-- Select Position --</option>
               {availablePositions.length === 0 ? (
  <option value="">All positions submitted</option>
) : (
  availablePositions.map((p, i) => (
    <option key={i} value={p}>{p}</option>
  ))
)}
              </select>

              {/* SHARED TOTALS */}
              <div className="grid grid-cols-2 gap-4 bg-gray-900 p-4 rounded-2xl text-white">
                <div>
                    <label className="text-[9px] font-black uppercase text-gray-400 block mb-1">Total Votes Cast</label>
                    <input type="number" name="totalOverallVotes" value={formData.totalOverallVotes} onChange={handleChange} placeholder="0" className="w-full bg-white/10 p-2 rounded-lg font-black text-center" required />
                </div>
                <div>
                    <label className="text-[9px] font-black uppercase text-red-400 block mb-1">Invalid Votes</label>
                    <input type="number" name="invalidVotes" value={formData.invalidVotes} onChange={handleChange} placeholder="0" className="w-full bg-white/10 p-2 rounded-lg font-black text-center text-red-400" required />
                </div>
              </div>

              {/* CANDIDATE LIST */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-blue-700 uppercase">Candidates & Individual Votes</p>
                {formData.candidates.map((cand, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-2xl border border-blue-100 relative">
                    {formData.candidates.length > 1 && (
                      <button type="button" onClick={() => removeCandidateRow(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-lg">
                        <MdDelete size={14} />
                      </button>
                    )}
                    <div className="grid grid-cols-12 gap-2">
                        <input name="name" value={cand.name} onChange={(e) => handleCandidateChange(index, e)} placeholder="Name" className="col-span-5 p-2 rounded-lg text-xs font-bold border" required />
                        <input name="campName" value={cand.campName} onChange={(e) => handleCandidateChange(index, e)} placeholder="Camp" className="col-span-3 p-2 rounded-lg text-xs border uppercase" required />
                        <input type="number" name="individualVotes" value={cand.individualVotes} onChange={(e) => handleCandidateChange(index, e)} placeholder="Votes" className="col-span-4 p-2 rounded-lg text-sm font-black border-2 border-blue-400 text-center" required />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addCandidateRow} className="w-full py-2 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-blue-50">
                  <MdAdd size={16}/> Add Candidate
                </button>
              </div>

              {/* PROOF UPLOAD */}
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50 cursor-pointer transition">
                  {preview ? <img src={preview} className="w-full h-24 object-cover rounded-xl" /> : <><MdPhoto size={24} className="text-gray-300"/><p className="text-[9px] font-black text-gray-400 uppercase mt-1">Upload Result Proof</p></>}
                  <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
              </label>

              <textarea name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Remarks..." className="w-full p-3 bg-gray-50 border rounded-xl text-xs italic" />

              <button disabled={loading} className={`w-full text-white font-black py-4 rounded-2xl shadow-lg transition ${loading ? 'bg-gray-400' : 'bg-red-700 active:scale-95'}`}>
                {loading ? "UPLOADING ALL DATA..." : "SYNC POSITION REPORT"}
              </button>
            </form>
          </div>

         {/* REPORT SECTION */}
<div className="lg:col-span-7">
  <div className="space-y-8">
    {Object.keys(groupedResults).length > 0 ? (
      Object.keys(groupedResults).map((posName) => {
        const positionData = groupedResults[posName];

        // Since all candidates in this position share the same total/invalid 
        // from the same physical sheet, we pull from the first entry.
        const sharedTotal = positionData[0]?.totalOverallVotes || 0;
        const sharedInvalid = positionData[0]?.invalidVotes || 0;
        const sharedValid = sharedTotal - sharedInvalid;

        return (
          <div key={posName} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            {/* POSITION HEADER */}
            <div className="bg-gray-900 p-4 text-white flex justify-between items-center px-6">
              <div>
                <h3 className="font-black uppercase text-xs tracking-widest">{posName}</h3>
                <p className="text-[9px] text-gray-400 mt-1 uppercase">Constituency Results</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-green-400 block">VALID: {sharedValid}</span>
                <span className="text-[10px] font-black text-red-400 block">INVALID: {sharedInvalid}</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-[9px] uppercase text-gray-400 border-b">
                  <tr>
                    <th className="p-4">Proof</th>
                    <th className="p-4">Candidate</th>
                    <th className="p-4">Camp</th>
                    <th className="p-4 text-center">Votes</th>
                    <th className="p-4 text-center bg-yellow-50 text-yellow-700">% of Valid</th>
                    <th className="p-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {positionData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/50 transition">
                      <td className="p-4">
                        {item.resultPhotoUrl ? (
                          <a href={item.resultPhotoUrl} target="_blank" rel="noreferrer" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border hover:border-blue-500 overflow-hidden">
                            <img src={item.resultPhotoUrl} className="w-full h-full object-cover" alt="Proof" />
                          </a>
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-lg border-2 border-dashed" />
                        )}
                      </td>
                      <td className="p-4 font-black text-blue-900">{item.name}</td>
                      <td className="p-4 text-gray-500 uppercase font-bold text-[9px]">{item.campName}</td>
                      <td className="p-4 text-center font-black text-lg text-gray-800">{item.individualVotes}</td>
                      <td className="p-4 text-center bg-yellow-50/30 font-black text-yellow-700">{item.percentage}%</td>
                      <td className="p-4 italic text-gray-400 text-[10px] truncate max-w-[100px]">{item.remarks || "---"}</td>
                    </tr>
                  ))}
                </tbody>
                
                {/* POSITION FOOTER SUMMARY */}
                <tfoot className="bg-blue-50 border-t-2 border-blue-200">
                  <tr>
                    <td colSpan="6" className="p-3">
                        <div className="flex justify-between items-center px-2">
                            <p className="text-[9px] font-black text-blue-800 uppercase">Sheet Total Recorded:</p>
                            <p className="text-[11px] font-black text-blue-900">{sharedTotal} <span className="text-gray-400 font-normal">Votes Cast</span></p>
                        </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })
    ) : (
      <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-gray-200 text-center">
        <p className="text-gray-400 font-black uppercase text-xs tracking-tighter">No results synchronized for this constituency yet.</p>
      </div>
    )}
  </div>
</div>
        </div>
      </div>
    </div>
  );
}
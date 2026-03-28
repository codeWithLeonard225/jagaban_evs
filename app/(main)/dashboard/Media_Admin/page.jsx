"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { MdDashboard, MdLibraryBooks, MdKeyboardArrowDown, MdMenu, MdClose } from "react-icons/md";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import DeleteDataPage from "./DeleteData/page";
import NationalResultsLedger from "../../Reports/NationalResultsLedger/page";
import CampDominance from "../../Reports/CampDominance/page";
import District from "../../Reports/District/page";
import VoterIntegrityReport from "../../Reports/VoterIntegrityReport/page";
import CandidatePerformanceReport from "../../Reports/CandidatePerformanceReport/page";
import PositionLevelReport from "../../Reports/PositionLevelReport/page";
import CoordinatorRegistration from "../../Register/page";
import ConstituencyLevelReport from "../../Reports/ConstituencyLevelReport/page";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: <MdDashboard /> },
  {
    key: "system",
    label: "System",
    icon: <MdDashboard />,
    children: [
      { key: "Register", label: "Register" },
      { key: "Delete", label: "Delete" }
    ],
    
  },
  {
    key: "reports",
    label: "Reports",
    icon: <MdLibraryBooks />,
    children: [
      { key: "District", label: "District" },
      { key: "ConstituencyLevelReport", label: "Constituency Level" },
      { key: "CampDominance", label: "Camp Dominance" },
      { key: "VoterIntegrityReport", label: "Voter Integrity" },
      { key: "CandidatePerformanceReport", label: "Candidate Performance" },
      { key: "PositionLevelReport", label: "Position Level" },
    ],
  },
];

const Button = ({ variant = "default", onClick, className = "", children }) => {
  let baseStyles = "inline-flex items-center justify-start whitespace-nowrap rounded-md text-sm font-medium transition-colors p-2 w-full";
  let variantStyles = variant === "default"
    ? "bg-indigo-600 text-white shadow"
    : "hover:bg-indigo-100 text-gray-700";
  return <button onClick={onClick} className={`${baseStyles} ${variantStyles} ${className}`}>{children}</button>;
};

export default function AdminLedger() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    if (!loading) {
      const allowedRoles = ["admin", "media", "ceo", "coordinator_admin"];
      if (!user || !allowedRoles.includes(user?.role?.toLowerCase())) {
        router.replace("/");
      }
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  const ownerName = user.data?.fullName || user.data?.username || "Admin";
  const initials = ownerName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  // Helper to handle tab changes and close sidebar on mobile
  const handleTabChange = (key) => {
    setActiveTab(key);
    setSidebarOpen(false); // Closes sidebar on mobile/tablet after selection
  };

  const renderNavItems = (items) =>
    items.map((item) => (
      <div key={item.key} className="mb-1">
        {item.children ? (
          <>
            <Button
              variant={openDropdown === item.key ? "default" : "ghost"}
              onClick={() => setOpenDropdown(openDropdown === item.key ? null : item.key)}
              className="justify-between"
            >
              <div className="flex items-center gap-2">{item.icon} {item.label}</div>
              <MdKeyboardArrowDown className={`transition-transform ${openDropdown === item.key ? "rotate-180" : ""}`} />
            </Button>
            {openDropdown === item.key && (
              <div className="pl-6 mt-1 space-y-1">
                {item.children.map(child => (
                  <Button
                    key={child.key}
                    variant={activeTab === child.key ? "default" : "ghost"}
                    onClick={() => handleTabChange(child.key)}
                  >
                    {child.label}
                  </Button>
                ))}
              </div>
            )}
          </>
        ) : (
          <Button
            variant={activeTab === item.key ? "default" : "ghost"}
            onClick={() => { handleTabChange(item.key); setOpenDropdown(null); }}
            className="gap-2"
          >
            {item.icon} {item.label}
          </Button>
        )}
      </div>
    ));

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <NationalResultsLedger />;
      case "Delete":
        return <DeleteDataPage />;
      case "Register":
        return <CoordinatorRegistration />;
      case "District":
        return <District />;
      case "CampDominance":
        return <CampDominance />;
      case "VoterIntegrityReport":
        return <VoterIntegrityReport />;
      case "CandidatePerformanceReport":
        return <CandidatePerformanceReport />;
      case "PositionLevelReport":
        return <PositionLevelReport />;
      case "ConstituencyLevelReport":
        return <ConstituencyLevelReport />;
      default:
        return (
          <div className="p-6 bg-white rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-gray-700">Content for: {activeTab.toUpperCase()}</h2>
            <p className="mt-2 text-gray-500 italic uppercase text-xs">Module under construction...</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans relative overflow-hidden">
      
      {/* 1. MOBILE OVERLAY (Clicking empty space closes sidebar) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white p-5 border-r shadow-2xl transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static`}>
        
        <div className="flex items-center justify-between mb-8 md:mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-lg font-black text-white shadow-lg shadow-indigo-200">
               {initials}
             </div>
             <div>
               <p className="text-sm font-black text-gray-800 leading-none truncate w-32">{ownerName}</p>
               <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-tighter mt-1">{user.role}</p>
             </div>
          </div>
          {/* Close button only on mobile */}
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-red-500">
            <MdClose size={24}/>
          </button>
        </div>

        <div className="space-y-2">
          {renderNavItems(NAV_ITEMS)}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* TOP BAR FOR MOBILE */}
        <header className="bg-white border-b p-4 flex items-center justify-between md:hidden shadow-sm">
          <h1 className="font-black text-indigo-900 uppercase tracking-tighter text-xl">Jagaban</h1>
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg active:scale-95 transition"
          >
            <MdMenu size={24} />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-gray-50/50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
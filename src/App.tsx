import React, { useState, useEffect } from "react";
import { database, seedFirestoreIfEmpty } from "./lib/firebase";
import { Listing, Client, Task, SignatureRequest } from "./types";
import ListingCard from "./components/ListingCard";
import TaskTracker from "./components/TaskTracker";
import EmailCenter from "./components/EmailCenter";
import DocManager from "./components/DocManager";
import MobileDashboard from "./components/MobileDashboard";
import SignaturePortal from "./components/SignaturePortal";
import { 
  Building2, 
  CalendarCheck, 
  Mail, 
  FolderLock, 
  Smartphone, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  UserCheck, 
  Award,
  Bell,
  Fingerprint,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeView, setActiveView] = useState<"listings" | "tasks" | "email" | "documents" | "mobile">("listings");
  
  // Master Synced Database States
  const [listings, setListings] = useState<Listing[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [signatureRequests, setSignatureRequests] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Signer Portal Simulation State
  const [activeSigRoomId, setActiveSigRoomId] = useState<string | null>(null);

  // Live Agent Clock
  const [localTime, setLocalTime] = useState(new Date());

  useEffect(() => {
    // Check if URL has a signature room invite parameter (sigRoomId)
    const urlParams = new URLSearchParams(window.location.search);
    const sigRoomParam = urlParams.get("sigRoomId");
    if (sigRoomParam) {
      setActiveSigRoomId(sigRoomParam);
    }

    // Seed database and load values
    initializeWorkspace();

    // Clock Interval
    const timer = setInterval(() => setLocalTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const initializeWorkspace = async () => {
    setLoading(true);
    // Seed Firestore collections if starting fresh
    await seedFirestoreIfEmpty();
    await loadWorkspaceData();
    setLoading(false);
  };

  const loadWorkspaceData = async () => {
    const listData = await database.getListings();
    const clientData = await database.getClients();
    const taskData = await database.getTasks();
    const sigs = await database.getSignatureRequests();

    setListings(listData);
    setClients(clientData);
    setTasks(taskData);
    setSignatureRequests(sigs);
  };

  // Callback whenever any child modifies the database
  const handleDataRefresh = () => {
    loadWorkspaceData();
  };

  const triggerSignerDemo = (sigId: string) => {
    setActiveSigRoomId(sigId);
  };

  // Render the Guest Client Signature Portal if active
  if (activeSigRoomId) {
    return (
      <SignaturePortal
        signatureRequestId={activeSigRoomId}
        onSignatureSuccess={() => {
          handleDataRefresh();
        }}
        onExitPortal={() => {
          // Clear query parameter and exit room
          const url = new URL(window.location.href);
          url.searchParams.delete("sigRoomId");
          window.history.pushState({}, "", url.toString());
          setActiveSigRoomId(null);
          handleDataRefresh();
        }}
      />
    );
  }

  // Dashboard Stats Helper
  const pendingSignaturesCount = signatureRequests.filter(s => s.status === "Pending").length;
  const overdueTasksCount = tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length;

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* Upper header banner */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gray-950 text-white flex items-center justify-center shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-gray-900">Signature Realty Office</h1>
            <p className="text-xs text-gray-400 font-medium">Real Estate Transaction Management Suite</p>
          </div>
        </div>

        {/* Live Clock & Agent Profile */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-mono text-gray-600 font-semibold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>{localTime.toLocaleTimeString()}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shadow-sm">
              SJ
            </div>
            <div className="hidden lg:block text-left leading-tight">
              <p className="text-xs font-bold text-gray-900">Sarah Jenkins</p>
              <p className="text-[10px] text-gray-400 font-medium">Broker Coordinator</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-grow flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 lg:gap-8 items-stretch">
        
        {/* Navigation Sidebar */}
        <nav className="w-full lg:w-64 flex flex-row lg:flex-col gap-1 flex-shrink-0 lg:border-r lg:border-gray-100 lg:pr-6 pb-4 lg:pb-0 mb-6 lg:mb-0 overflow-x-auto lg:overflow-x-visible">
          
          {/* Section title */}
          <p className="hidden lg:block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 select-none">Agent Command Center</p>
          
          <button
            onClick={() => setActiveView("listings")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer whitespace-nowrap ${
              activeView === "listings"
                ? "bg-gray-950 text-white shadow-sm"
                : "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Building2 className="w-4 h-4 flex-shrink-0" />
            Property Portfolios
          </button>

          <button
            onClick={() => setActiveView("tasks")}
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer whitespace-nowrap ${
              activeView === "tasks"
                ? "bg-gray-950 text-white shadow-sm"
                : "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <CalendarCheck className="w-4 h-4 flex-shrink-0" />
              Agenda & Key Dates
            </div>
            {overdueTasksCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${activeView === "tasks" ? "bg-red-500 text-white" : "bg-red-50 text-red-600"}`}>
                {overdueTasksCount} overdue
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView("email")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer whitespace-nowrap ${
              activeView === "email"
                ? "bg-gray-950 text-white shadow-sm"
                : "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Mail className="w-4 h-4 flex-shrink-0" />
            AI Email Composer
          </button>

          <button
            onClick={() => setActiveView("documents")}
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer whitespace-nowrap ${
              activeView === "documents"
                ? "bg-gray-950 text-white shadow-sm"
                : "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderLock className="w-4 h-4 flex-shrink-0" />
              Document Vault
            </div>
            {pendingSignaturesCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${activeView === "documents" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-600"}`}>
                {pendingSignaturesCount} pending
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView("mobile")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer whitespace-nowrap ${
              activeView === "mobile"
                ? "bg-gray-950 text-white shadow-sm"
                : "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Smartphone className="w-4 h-4 flex-shrink-0" />
            Mobile App View
          </button>

          {/* Sandbox helper board */}
          <div className="hidden lg:block border-t border-gray-100 pt-6 mt-6 space-y-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest select-none">Sandbox Compliance Testing</p>
            
            {signatureRequests.filter(s => s.status === "Pending").slice(0, 1).map(req => (
              <div key={req.id} className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100/60 space-y-2.5">
                <p className="text-[10px] font-bold text-indigo-900 flex items-center gap-1 leading-normal">
                  <Fingerprint className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  Test Client Signer Portal
                </p>
                <p className="text-[10px] text-indigo-600 leading-normal">
                  Simulate client signing instantly. Draw or type terms to close.
                </p>
                <button
                  onClick={() => triggerSignerDemo(req.id)}
                  className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[9px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  Open Signer Room
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

        </nav>

        {/* Content View Container */}
        <div className="flex-grow min-w-0 bg-transparent">
          {loading ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center text-gray-400 space-y-2">
              <RefreshCw className="w-6 h-6 text-gray-300 animate-spin" />
              <p className="text-xs font-semibold tracking-wide">Broker Workspace synchronizing...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Highlight Notification Banner for Pending Escrows */}
              {activeView !== "mobile" && pendingSignaturesCount > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-100/80 text-amber-700 mt-0.5 md:mt-0 flex-shrink-0">
                      <Bell className="w-4 h-4 animate-swing" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">Outstanding Signature Requests</h4>
                      <p className="text-[11px] text-amber-700 leading-relaxed mt-0.5">
                        You have {pendingSignaturesCount} document(s) waiting on signatures in Escrow. Follow up with your clients or copy the signing portal link from the Document Vault.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveView("documents")}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-[10px] font-bold text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer"
                  >
                    Manage Signatures
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* View Switcher Panel */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  {activeView === "listings" && (
                    <ListingCard 
                      listings={listings} 
                      onListingsChanged={handleDataRefresh} 
                      onRefresh={handleDataRefresh}
                    />
                  )}
                  {activeView === "tasks" && (
                    <TaskTracker 
                      listings={listings} 
                      clients={clients} 
                      onTasksChanged={handleDataRefresh} 
                    />
                  )}
                  {activeView === "email" && (
                    <EmailCenter 
                      clients={clients} 
                      listings={listings} 
                      onCommunicationsChanged={handleDataRefresh} 
                    />
                  )}
                  {activeView === "documents" && (
                    <DocManager 
                      listings={listings} 
                      onDocumentsChanged={handleDataRefresh} 
                      onNavigateToSignatures={() => setActiveView("documents")}
                      onCreateSignatureRequest={handleDataRefresh}
                    />
                  )}
                  {activeView === "mobile" && (
                    <MobileDashboard 
                      listings={listings} 
                      clients={clients} 
                      tasks={tasks}
                      onRefresh={handleDataRefresh}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

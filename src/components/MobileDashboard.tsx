import React, { useState, useEffect } from "react";
import { database } from "../lib/firebase";
import { Listing, Client, Task, Communication } from "../types";
import { Phone, MessageSquare, AlertCircle, TrendingUp, Compass, Calendar, CheckSquare, Plus, CheckCircle2, ChevronRight, RefreshCw, Send } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MobileDashboardProps {
  listings: Listing[];
  clients: Client[];
  tasks: Task[];
  onRefresh: () => void;
}

export default function MobileDashboard({ listings, clients, tasks, onRefresh }: MobileDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [recentComms, setRecentComms] = useState<Communication[]>([]);
  const [selectedMobileClient, setSelectedMobileClient] = useState("");
  const [mobileCallNote, setMobileCallNote] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);

  useEffect(() => {
    loadRecentComms();
  }, [listings, clients]);

  const loadRecentComms = async () => {
    const data = await database.getCommunications();
    const sorted = [...data]
      .filter(c => c.type === "Phone")
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    setRecentComms(sorted.slice(0, 5));
  };

  const handleQuickPhoneLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMobileClient || !mobileCallNote) return;

    setIsLogging(true);
    const targetClient = clients.find(c => c.id === selectedMobileClient);

    const newComm: Communication = {
      id: "comm_" + Math.random().toString(36).substring(2, 9),
      clientId: selectedMobileClient,
      type: "Phone",
      body: `Mobile Phone Log: ${mobileCallNote}`,
      sentAt: new Date().toISOString(),
      status: "Logged",
      agentId: "agent_sarah"
    };

    await database.saveCommunication(newComm);
    setMobileCallNote("");
    setSelectedMobileClient("");
    setIsLogging(false);
    setLogSuccess(true);
    
    onRefresh();
    await loadRecentComms();
    setTimeout(() => setLogSuccess(false), 3000);
  };

  // Mobile statistics counts
  const activeListings = listings.filter(l => l.status === "Active").length;
  const pendingListings = listings.filter(l => l.status === "Pending").length;
  const incompleteTasks = tasks.filter(t => !t.completed).length;

  return (
    <div id="mobile_sim_container" className="flex items-center justify-center py-6 bg-gray-50/50">
      {/* Phone device mockup casing */}
      <div className="w-[380px] h-[780px] bg-slate-900 rounded-[50px] p-4 shadow-2xl border-[8px] border-slate-800 flex flex-col relative overflow-hidden ring-1 ring-slate-700">
        
        {/* Notch / Speaker bar */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-36 bg-slate-900 rounded-b-2xl z-40 flex items-center justify-center">
          <div className="w-12 h-1 bg-slate-800 rounded-full mb-1" />
        </div>

        {/* Screen layout container */}
        <div className="flex-grow bg-slate-50 rounded-[38px] overflow-hidden flex flex-col relative pt-8 font-sans">
          
          {/* Header Mobile status bar */}
          <div className="flex items-center justify-between px-6 py-2 bg-slate-900 text-white text-[11px] font-mono select-none">
            <span>AgentMobile App</span>
            <div className="flex items-center gap-1">
              <span>5G</span>
              <div className="w-5 h-2.5 border border-white/50 rounded-sm p-0.5 flex items-center">
                <div className="w-full h-full bg-white rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Top header navigation */}
          <div className="bg-slate-900 px-5 pb-5 pt-2 text-white flex items-center justify-between flex-shrink-0">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Active Session</p>
              <h4 className="font-bold text-sm tracking-tight text-white">Sarah Jenkins</h4>
            </div>
            <button
              onClick={() => { onRefresh(); loadRecentComms(); }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Main content inside the smartphone viewport */}
          <div className="flex-grow overflow-y-auto px-4 py-4 space-y-4">
            
            {/* Quick Metrics grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 bg-white rounded-xl border border-gray-150 text-center shadow-sm">
                <p className="text-[18px] font-extrabold text-blue-600">{activeListings}</p>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tight mt-0.5">Active</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-gray-150 text-center shadow-sm">
                <p className="text-[18px] font-extrabold text-amber-500">{pendingListings}</p>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tight mt-0.5">Pending</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-gray-150 text-center shadow-sm">
                <p className="text-[18px] font-extrabold text-red-500">{incompleteTasks}</p>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tight mt-0.5">To Do</p>
              </div>
            </div>

            {/* Direct Mobile communication tracking form */}
            <div id="mobile_call_log_form" className="bg-white rounded-xl border border-gray-150 p-4 shadow-sm space-y-3">
              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-green-500" />
                Real-Time Phone Logger
              </h5>
              
              <form onSubmit={handleQuickPhoneLog} className="space-y-2.5">
                <div>
                  <select
                    required
                    value={selectedMobileClient}
                    onChange={e => setSelectedMobileClient(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none bg-slate-50 text-slate-700"
                  >
                    <option value="">-- Target Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={mobileCallNote}
                    onChange={e => setMobileCallNote(e.target.value)}
                    placeholder="e.g. Left voicemail to check inspection status"
                    className="flex-grow px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none bg-slate-50"
                  />
                  <button
                    type="submit"
                    disabled={isLogging}
                    className="p-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              <AnimatePresence>
                {logSuccess && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] text-green-600 font-bold text-center"
                  >
                    ✓ Mobile phone follow-up synced to pipeline database!
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Key dates action feed */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-500" />
                Live Feed
              </h5>

              <div className="space-y-2">
                {listings.map(l => {
                  if (l.keyDates?.inspectionDeadline && l.status !== "Closed") {
                    return (
                      <div key={l.id} className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs flex items-start gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-bold text-gray-900 leading-tight">Inspection Deadline Approaching</p>
                          <p className="text-[9px] text-gray-500 font-medium">{l.address}</p>
                          <p className="text-[9px] font-mono text-amber-600 font-semibold">{new Date(l.keyDates.inspectionDeadline).toLocaleDateString()}</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            {/* Recent Mobile Calls Log */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-green-600" />
                Recent Mobile Log History
              </h5>

              <div className="space-y-2">
                {recentComms.length === 0 ? (
                  <p className="text-[10px] text-gray-400 italic text-center py-2 bg-white rounded-xl border border-gray-100">No calls logged recently.</p>
                ) : (
                  recentComms.map(comm => {
                    const clientRef = clients.find(c => c.id === comm.clientId);
                    return (
                      <div key={comm.id} className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-[9px] text-gray-400">
                          <span className="font-bold text-green-600">PHONE CONNECTED</span>
                          <span>{new Date(comm.sentAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-900">{clientRef ? clientRef.name : "Client"}</p>
                        <p className="text-[10px] text-gray-600 leading-normal italic">"{comm.body.replace("Mobile Phone Log: ", "")}"</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Simulated navigation bar */}
          <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-around flex-shrink-0 select-none">
            <div className="flex flex-col items-center text-blue-600 cursor-pointer">
              <Compass className="w-5 h-5" />
              <span className="text-[8px] font-bold mt-1 uppercase tracking-wider">Feed</span>
            </div>
            <div className="flex flex-col items-center text-gray-400 cursor-pointer">
              <Phone className="w-5 h-5" />
              <span className="text-[8px] font-bold mt-1 uppercase tracking-wider">Calls</span>
            </div>
            <div className="flex flex-col items-center text-gray-400 cursor-pointer">
              <Calendar className="w-5 h-5" />
              <span className="text-[8px] font-bold mt-1 uppercase tracking-wider">Dates</span>
            </div>
          </div>

          {/* Virtual Home indicator pill */}
          <div className="bg-white py-1.5 flex justify-center flex-shrink-0 select-none">
            <div className="w-28 h-1 bg-gray-300 rounded-full" />
          </div>

        </div>
      </div>
    </div>
  );
}

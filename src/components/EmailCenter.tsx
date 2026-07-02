import React, { useState, useEffect } from "react";
import { database } from "../lib/firebase";
import { Client, Listing, Communication } from "../types";
import { Mail, Send, Sparkles, CheckCircle, Clock, Trash2, Calendar, FileText, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface EmailCenterProps {
  clients: Client[];
  listings: Listing[];
  onCommunicationsChanged?: () => void;
}

export default function EmailCenter({ clients, listings, onCommunicationsChanged }: EmailCenterProps) {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);

  // Email Composer State
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedListingId, setSelectedListingId] = useState("");
  const [emailType, setEmailType] = useState<"inspection" | "closing" | "default">("default");
  const [customDirectives, setCustomDirectives] = useState("");
  const [emailText, setEmailText] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadCommunications();
  }, []);

  const loadCommunications = async () => {
    setLoading(true);
    const data = await database.getCommunications();
    const sorted = [...data].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    setCommunications(sorted);
    setLoading(false);
  };

  const handleAiDraft = async () => {
    if (!selectedClientId) {
      alert("Please select a target client first to customize the email draft!");
      return;
    }

    setIsDrafting(true);
    const targetClient = clients.find(c => c.id === selectedClientId);
    const targetListing = listings.find(l => l.id === selectedListingId);

    try {
      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: targetClient?.name,
          propertyAddress: targetListing?.address,
          type: emailType,
          extraPrompt: customDirectives
        })
      });

      if (response.ok) {
        const data = await response.json();
        setEmailText(data.text);
      } else {
        console.error("Failed to generate AI email draft.");
      }
    } catch (e) {
      console.error("Network error during AI email generation.", e);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedClientId || !emailText) {
      alert("Please ensure a client is selected and the email draft is not empty.");
      return;
    }

    setIsSending(true);
    
    // Extract subject line from drafted text if possible
    let subject = "Real Estate Transaction Update";
    const subjectMatch = emailText.match(/Subject:\s*(.*)/i);
    if (subjectMatch && subjectMatch[1]) {
      subject = subjectMatch[1].trim();
    }

    // Prepare body content by stripping subject line if present
    const cleanBody = emailText.replace(/Subject:\s*.*\n*/i, "").trim();

    const newComm: Communication = {
      id: "comm_" + Math.random().toString(36).substring(2, 9),
      clientId: selectedClientId,
      type: "Email",
      subject,
      body: cleanBody,
      sentAt: new Date().toISOString(),
      status: "Sent",
      agentId: "agent_sarah"
    };

    await database.saveCommunication(newComm);
    setSuccessMessage("🚀 Professional Email successfully dispatched!");
    setEmailText("");
    setCustomDirectives("");
    
    await loadCommunications();
    if (onCommunicationsChanged) onCommunicationsChanged();
    
    setIsSending(false);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleDeleteComm = async (id: string) => {
    // Standard simulation delete from state/local
    try {
      const dbInstance = await import("../lib/firebase");
      await dbInstance.db; // verify db
      // We can remove it locally or from Firestore if allowed
      // In our helper we let database handle updates.
      // Let's implement local delete or ignore for communications logs
      const local = localStorage.getItem("re_communications");
      if (local) {
        const list = JSON.parse(local) as Communication[];
        const filtered = list.filter(c => c.id !== id);
        localStorage.setItem("re_communications", JSON.stringify(filtered));
      }
      await loadCommunications();
    } catch (e) {
      console.warn("Delete comm failed.");
    }
  };

  return (
    <div id="email_center_root" className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Email Composer Panel */}
      <div className="xl:col-span-2 space-y-6">
        <div id="email_composer_card" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-900 tracking-tight">AI Email Coordinator</h3>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Gemini Integration
            </span>
          </div>

          {/* Form Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Target Client *</label>
              <select
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40 text-gray-700"
              >
                <option value="">-- Choose Client --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Link to Property</label>
              <select
                value={selectedListingId}
                onChange={e => setSelectedListingId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40 text-gray-700"
              >
                <option value="">-- Choose Listing --</option>
                {listings.map(l => (
                  <option key={l.id} value={l.id}>{l.address}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email Category</label>
              <select
                value={emailType}
                onChange={e => setEmailType(e.target.value as "inspection" | "closing" | "default")}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40 text-gray-700"
              >
                <option value="default">General Relationship Follow-Up</option>
                <option value="inspection">Upcoming Inspection Reminder</option>
                <option value="closing">Closing Checklist & Wire Details</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Special Directives for Gemini (Optional)</label>
            <input
              type="text"
              value={customDirectives}
              onChange={e => setCustomDirectives(e.target.value)}
              placeholder="e.g. Mention that inspection is scheduled on Friday at 10 AM, ask client to bring IDs."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAiDraft}
              disabled={isDrafting}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {isDrafting ? "Drafting with Gemini..." : "Draft Email with AI"}
            </button>
          </div>

          {/* Text Editor area */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Draft Content (Editable)</label>
            <textarea
              value={emailText}
              onChange={e => setEmailText(e.target.value)}
              placeholder="Your drafted email text will generate here. You can manually tweak or write your message before sending."
              rows={12}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/20 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <AnimatePresence>
              {successMessage && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-green-600 font-semibold flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  {successMessage}
                </motion.span>
              )}
            </AnimatePresence>

            <button
              onClick={handleSendEmail}
              disabled={isSending || !emailText}
              className="ml-auto flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-950 text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-all text-sm shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {isSending ? "Dispatched..." : "Send Client Email"}
            </button>
          </div>
        </div>
      </div>

      {/* Communications Log Timeline */}
      <div className="xl:col-span-1 space-y-6">
        <div id="communications_log_card" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col h-[650px]">
          <div className="border-b border-gray-50 pb-4 mb-4 flex-shrink-0">
            <h3 className="font-bold text-gray-950 text-base">Communication Timeline</h3>
            <p className="text-gray-500 text-xs mt-0.5">Real-time log of sent client emails & follow-ups.</p>
          </div>

          {loading ? (
            <div className="flex-grow flex items-center justify-center text-gray-400 text-sm">Loading logs...</div>
          ) : communications.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-150 rounded-xl">
              <Clock className="w-6 h-6 text-gray-300 mb-2" />
              <p className="text-gray-900 font-medium text-xs">No communications logged</p>
              <p className="text-gray-500 text-[10px] mt-1">Sent emails are recorded automatically.</p>
            </div>
          ) : (
            <div className="flex-grow overflow-y-auto space-y-4 pr-1">
              {communications.map(comm => {
                const targetClient = clients.find(c => c.id === comm.clientId);
                return (
                  <div key={comm.id} className="p-3.5 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-gray-200 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        {comm.type}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {new Date(comm.sentAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-900">
                        {comm.subject || "Follow-up notes"}
                      </p>
                      <p className="text-[10px] text-gray-500 font-medium">
                        To: {targetClient ? targetClient.name : "Unknown Client"} ({targetClient?.email})
                      </p>
                    </div>

                    <p className="text-[11px] text-gray-600 line-clamp-3 leading-relaxed border-t border-gray-100 pt-2 whitespace-pre-line">
                      {comm.body}
                    </p>

                    <div className="flex items-center justify-end pt-1">
                      <button
                        onClick={() => handleDeleteComm(comm.id)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

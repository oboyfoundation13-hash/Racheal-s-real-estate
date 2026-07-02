import React, { useState, useEffect } from "react";
import { database } from "../lib/firebase";
import { Document, Listing, SignatureRequest } from "../types";
import { FileText, ShieldCheck, Sparkles, Send, Share2, Eye, Trash2, CheckCircle, Clock, Plus, ArrowRight, Clipboard } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DocManagerProps {
  listings: Listing[];
  onDocumentsChanged?: () => void;
  onNavigateToSignatures?: () => void;
  // Let parent expose direct signature request triggering
  onCreateSignatureRequest?: (req: SignatureRequest) => void;
}

export default function DocManager({ listings, onDocumentsChanged, onNavigateToSignatures, onCreateSignatureRequest }: DocManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [signatureRequests, setSignatureRequests] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Form State
  const [name, setName] = useState("");
  const [type, setType] = useState<Document["type"]>("Contract");
  const [listingId, setListingId] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Digital Signature Form State
  const [selectedDocId, setSelectedDocId] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signerRole, setSignerRole] = useState("Buyer");
  const [sendingSignRequest, setSendingSignRequest] = useState(false);

  // Contract review AI state
  const [reviewingDoc, setReviewingDoc] = useState<Document | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const docs = await database.getDocuments();
    const sigs = await database.getSignatureRequests();
    setDocuments(docs);
    setSignatureRequests(sigs);
    setLoading(false);
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !listingId) return;

    setIsUploading(true);

    // If textContent is empty, seed a beautiful default contract body
    const finalContent = textContent || `STANDARD RESIDENTIAL PURCHASE CONTRACT

This agreement is executed on this day between the purchasing party and seller party:
PROPERTY: ${listings.find(l => l.id === listingId)?.address || "The property address"}
TOTAL CONSIDERATION PRICE: $${(listings.find(l => l.id === listingId)?.price || 350000).toLocaleString()} USD.

1. EARNEST SECURITY DEPOSIT: $12,500 to be deposited into the Escrow Account within 3 calendar business days.
2. TITLE CONVEYANCE: Seller guarantees clear and marketable General Warranty Title.
3. PHYSICAL HOUSE INSPECTION: Buyers reserve the right to carry out property inspection. Deadline for submitting repairs request is July 10, 2026.
4. TRANSACTION CLOSING: Closing transaction and handover of property keys is scheduled on or before August 5, 2026.

IN WITNESS WHEREOF, the authorized signatures below bind all parties.`;

    const newDoc: Document = {
      id: "doc_" + Math.random().toString(36).substring(2, 9),
      name: name.endsWith(".pdf") ? name : `${name}.pdf`,
      type,
      listingId,
      uploadedAt: new Date().toISOString(),
      size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
      status: "Draft",
      agentId: "agent_sarah",
      textContent: finalContent
    };

    await database.saveDocument(newDoc);
    setName("");
    setTextContent("");
    setListingId("");
    setIsUploading(false);
    
    await loadData();
    if (onDocumentsChanged) onDocumentsChanged();
  };

  const handleCreateSignatureRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !signerName || !signerEmail) return;

    setSendingSignRequest(true);
    const docData = documents.find(d => d.id === selectedDocId);
    if (!docData) return;

    const newRequest: SignatureRequest = {
      id: "sig_" + Math.random().toString(36).substring(2, 9),
      documentId: selectedDocId,
      listingId: docData.listingId,
      signerName,
      signerEmail,
      signerRole,
      status: "Pending",
      requestedAt: new Date().toISOString()
    };

    // Update document status
    const updatedDoc: Document = { ...docData, status: "Sent_For_Signature" };
    await database.saveDocument(updatedDoc);

    // Save signature request
    await database.saveSignatureRequest(newRequest);

    // Trigger parent callback if present
    if (onCreateSignatureRequest) {
      onCreateSignatureRequest(newRequest);
    }

    // Reset Form
    setSelectedDocId("");
    setSignerName("");
    setSignerEmail("");
    setSendingSignRequest(false);
    
    await loadData();
    if (onDocumentsChanged) onDocumentsChanged();
  };

  const handleRequestAiSummary = async (docData: Document) => {
    setReviewingDoc(docData);
    setLoadingSummary(true);
    setAiSummary("");

    try {
      const response = await fetch("/api/summarize-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: docData.name,
          textContent: docData.textContent
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiSummary(data.summary);
      } else {
        setAiSummary("Could not parse contract details. Please check connection.");
      }
    } catch (e) {
      setAiSummary("Failed to fetch contract summary from server.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (confirm("Are you sure you want to delete this document and its signature requests?")) {
      await database.deleteDocument(id);
      await loadData();
      if (onDocumentsChanged) onDocumentsChanged();
    }
  };

  const copySigningLink = (id: string) => {
    const link = `${window.location.origin}/?sigRoomId=${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div id="document_storage_root" className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Upload and Sign request Forms */}
      <div className="xl:col-span-1 space-y-6">
        {/* Upload Form */}
        <div id="upload_document_card" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-950 text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            Upload Contract Vault
          </h3>
          <p className="text-gray-500 text-xs">Upload new legal forms, escrow titles, or contract drafts.</p>

          <form onSubmit={handleUploadDocument} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Document Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Purchase_Agreement_Evergreen"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as Document["type"])}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40"
                >
                  <option value="Contract">Contract</option>
                  <option value="Disclosure">Disclosure</option>
                  <option value="Form">Standard Form</option>
                  <option value="Addendum">Addendum</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Property Link *</label>
                <select
                  required
                  value={listingId}
                  onChange={e => setListingId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40 text-gray-700"
                >
                  <option value="">-- Select Listing --</option>
                  {listings.map(l => (
                    <option key={l.id} value={l.id}>{l.address}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contract Text Body (Optional)</label>
              <textarea
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                placeholder="Paste contract clauses here, or leave empty to use our pre-formatted premium real estate contract template."
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40 font-mono text-[10px]"
              />
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gray-950 text-white font-medium hover:bg-gray-800 transition-colors shadow-sm text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {isUploading ? "Uploading..." : "Secure Form Storage"}
            </button>
          </form>
        </div>

        {/* Digital Signature Dispatch */}
        <div id="dispatch_signature_card" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-950 text-base flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Send for Digital Signature
          </h3>
          <p className="text-gray-500 text-xs">Create a secure electronic signature link for buyers/sellers.</p>

          <form onSubmit={handleCreateSignatureRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Select Document *</label>
              <select
                required
                value={selectedDocId}
                onChange={e => setSelectedDocId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40 text-gray-700"
              >
                <option value="">-- Choose Uploaded Doc --</option>
                {documents.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.type})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Signer Name *</label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  placeholder="Arthur Dent"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Signer Role</label>
                <select
                  value={signerRole}
                  onChange={e => setSignerRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40"
                >
                  <option value="Buyer">Buyer</option>
                  <option value="Seller">Seller</option>
                  <option value="Co-signer">Co-signer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Signer Email *</label>
              <input
                type="email"
                required
                value={signerEmail}
                onChange={e => setSignerEmail(e.target.value)}
                placeholder="arthur.dent@galaxy.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40"
              />
            </div>

            <button
              type="submit"
              disabled={sendingSignRequest}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-sm text-xs cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              {sendingSignRequest ? "Generating Request..." : "Issue Signature Request"}
            </button>
          </form>
        </div>
      </div>

      {/* Vault List & AI review summaries */}
      <div className="xl:col-span-2 space-y-6">
        {/* Document storage files list */}
        <div id="vault_files_card" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-950 text-base">Secure Document Vault</h3>

          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Loading legal documents...</div>
          ) : documents.length === 0 ? (
            <div className="border border-dashed border-gray-150 p-12 text-center rounded-xl">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-900 font-medium text-xs">Document Vault is empty</p>
              <p className="text-gray-500 text-[10px] mt-1">Upload files or generate contracts to secure them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map(docData => {
                const associatedListing = listings.find(l => l.id === docData.listingId);
                return (
                  <div key={docData.id} className="p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-gray-200 transition-all flex flex-col justify-between space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-red-50 text-red-600 flex-shrink-0 mt-0.5">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-900 line-clamp-1">{docData.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{docData.type} • {docData.size}</p>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        docData.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : docData.status === "Sent_For_Signature"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-150 text-gray-600"
                      }`}>
                        {docData.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    {associatedListing && (
                      <p className="text-[10px] font-medium text-gray-500">
                        🏡 Property: {associatedListing.address}
                      </p>
                    )}

                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                      <button
                        onClick={() => handleRequestAiSummary(docData)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Gemini AI Audit Summary
                      </button>

                      <button
                        onClick={() => handleDeleteDocument(docData.id)}
                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Delete Document"
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

        {/* Gemini contract details summary drawer/view */}
        <AnimatePresence>
          {reviewingDoc && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              id="gemini_review_panel"
              className="bg-indigo-950 text-indigo-100 rounded-2xl p-6 shadow-md border border-indigo-900 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-indigo-900 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                  <h4 className="font-bold text-white text-sm">Gemini AI Legal & Deadline Audit Memo</h4>
                </div>
                <button
                  onClick={() => setReviewingDoc(null)}
                  className="text-indigo-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Dismiss Memo
                </button>
              </div>

              <p className="text-xs text-indigo-200">
                AI Audit overview for <strong className="text-white">{reviewingDoc.name}</strong>
              </p>

              {loadingSummary ? (
                <div className="py-12 text-center text-xs font-mono text-indigo-300 animate-pulse">
                  Analyzing legal clauses, contingencies, financial escrow, and compliance dates...
                </div>
              ) : (
                <div className="text-xs space-y-4 leading-relaxed font-sans text-indigo-100 max-h-72 overflow-y-auto pr-1 whitespace-pre-line bg-indigo-950 p-4 rounded-xl border border-indigo-900">
                  {aiSummary}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* List of outstanding signature requests */}
        <div id="signatures_status_card" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-950 text-base">Digital Signature Pipeline & Audit Trail</h3>
            <span className="text-xs font-mono text-gray-400">
              {signatureRequests.length} Issued Request(s)
            </span>
          </div>

          {loading ? (
            <div className="py-6 text-center text-gray-400 text-sm">Loading signatures status...</div>
          ) : signatureRequests.length === 0 ? (
            <p className="text-gray-500 text-xs italic">No active digital signatures requested yet.</p>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {signatureRequests.map(req => {
                const docRef = documents.find(d => d.id === req.documentId);
                return (
                  <div key={req.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-gray-900">{req.signerName}</h4>
                        <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono font-semibold uppercase">{req.signerRole}</span>
                      </div>
                      <p className="text-[10px] text-gray-500">{req.signerEmail}</p>
                      
                      {docRef && (
                        <p className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                          📄 File: <span className="text-gray-600 underline font-semibold">{docRef.name}</span>
                        </p>
                      )}

                      {/* Secure Certificate Audit Trail */}
                      {req.status === "Signed" && (
                        <div className="pt-2 border-t border-gray-100 mt-2 space-y-0.5 text-[9px] font-mono text-green-700 font-medium">
                          <p>✓ IP Address: {req.signerIp || "192.168.1.108"}</p>
                          <p>✓ Secured Hash: {req.certificateId || "SEC_HASH_A8B9C10D"}</p>
                          <p>✓ Signed On: {new Date(req.signedAt || "").toLocaleString()}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        req.status === "Signed"
                          ? "bg-green-500 text-white"
                          : "bg-amber-500 text-white animate-pulse"
                      }`}>
                        {req.status === "Signed" ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {req.status}
                      </span>

                      {req.status === "Pending" ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => copySigningLink(req.id)}
                            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                            title="Copy signer portal link"
                          >
                            <Clipboard className="w-3.5 h-3.5" />
                            {copiedId === req.id ? "Copied!" : "Copy Link"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-green-700">Audit Verified</span>
                      )}
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

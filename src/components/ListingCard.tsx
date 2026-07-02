import React, { useState, useEffect } from "react";
import { Listing } from "../types";
import { database } from "../lib/firebase";
import { Home, Key, Calendar, Plus, Trash2, Edit3, DollarSign, Layers, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ListingCardProps {
  onListingsChanged?: () => void;
  listings: Listing[];
  onRefresh: () => void;
}

export default function ListingCard({ listings, onListingsChanged, onRefresh }: ListingCardProps) {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<Listing | null>(null);

  // Listing Form State
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [status, setStatus] = useState<"Active" | "Pending" | "Closed">("Active");
  const [bedrooms, setBedrooms] = useState<number>(3);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  // Key Dates
  const [listingDate, setListingDate] = useState("");
  const [escrowOpenDate, setEscrowOpenDate] = useState("");
  const [inspectionDeadline, setInspectionDeadline] = useState("");
  const [closingDate, setClosingDate] = useState("");

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !price) return;

    const defaultImg = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";

    const newListing: Listing = {
      id: "listing_" + Math.random().toString(36).substring(2, 9),
      address,
      price: Number(price),
      status,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      description,
      imageUrl: imageUrl || defaultImg,
      agentId: "agent_sarah",
      keyDates: {
        listingDate: listingDate ? new Date(listingDate).toISOString() : new Date().toISOString(),
        escrowOpenDate: escrowOpenDate ? new Date(escrowOpenDate).toISOString() : undefined,
        inspectionDeadline: inspectionDeadline ? new Date(inspectionDeadline).toISOString() : undefined,
        closingDate: closingDate ? new Date(closingDate).toISOString() : undefined
      }
    };

    await database.saveListing(newListing);
    resetForm();
    setIsAdding(false);
    onRefresh();
    if (onListingsChanged) onListingsChanged();
  };

  const handleEditListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing || !address || !price) return;

    const updatedListing: Listing = {
      ...isEditing,
      address,
      price: Number(price),
      status,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      description,
      imageUrl: imageUrl || isEditing.imageUrl,
      keyDates: {
        listingDate: listingDate ? new Date(listingDate).toISOString() : isEditing.keyDates.listingDate,
        escrowOpenDate: escrowOpenDate ? new Date(escrowOpenDate).toISOString() : undefined,
        inspectionDeadline: inspectionDeadline ? new Date(inspectionDeadline).toISOString() : undefined,
        closingDate: closingDate ? new Date(closingDate).toISOString() : undefined
      }
    };

    await database.saveListing(updatedListing);
    resetForm();
    setIsEditing(null);
    onRefresh();
    if (onListingsChanged) onListingsChanged();
  };

  const handleDeleteListing = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this listing? All associated tasks will remain but detached.")) {
      await database.deleteListing(id);
      setSelectedListing(null);
      onRefresh();
      if (onListingsChanged) onListingsChanged();
    }
  };

  const openEdit = (listing: Listing, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(listing);
    setAddress(listing.address);
    setPrice(listing.price);
    setStatus(listing.status);
    setBedrooms(listing.bedrooms);
    setBathrooms(listing.bathrooms);
    setDescription(listing.description);
    setImageUrl(listing.imageUrl);
    
    // Parse key dates to yyyy-MM-dd format for input values
    const toYMD = (isoStr?: string) => isoStr ? isoStr.substring(0, 10) : "";
    setListingDate(toYMD(listing.keyDates?.listingDate));
    setEscrowOpenDate(toYMD(listing.keyDates?.escrowOpenDate));
    setInspectionDeadline(toYMD(listing.keyDates?.inspectionDeadline));
    setClosingDate(toYMD(listing.keyDates?.closingDate));
  };

  const resetForm = () => {
    setAddress("");
    setPrice(0);
    setStatus("Active");
    setBedrooms(3);
    setBathrooms(2);
    setDescription("");
    setImageUrl("");
    setListingDate("");
    setEscrowOpenDate("");
    setInspectionDeadline("");
    setClosingDate("");
  };

  const getStatusPercent = (status: Listing["status"]) => {
    if (status === "Active") return 33;
    if (status === "Pending") return 66;
    return 100;
  };

  return (
    <div id="listings_root" className="space-y-6">
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Property Listings</h2>
          <p className="text-xs text-gray-500 mt-0.5">Track property milestones, purchase terms, and deadlines.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAdding(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-950 text-white font-medium hover:bg-gray-800 transition-colors shadow-sm text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Property
        </button>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <div
            key={listing.id}
            id={`listing_card_${listing.id}`}
            onClick={() => setSelectedListing(listing)}
            className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col h-full"
          >
            {/* Property Image & Status Badge */}
            <div className="relative h-48 bg-gray-100 overflow-hidden">
              <img
                src={listing.imageUrl}
                alt={listing.address}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-sm ${
                  listing.status === "Active"
                    ? "bg-green-500 text-white"
                    : listing.status === "Pending"
                    ? "bg-amber-500 text-white"
                    : "bg-gray-700 text-white"
                }`}>
                  {listing.status}
                </span>
              </div>
              <div className="absolute bottom-4 right-4 bg-gray-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-white font-bold text-sm shadow-sm flex items-center">
                ${listing.price.toLocaleString()}
              </div>
            </div>

            {/* Info contents */}
            <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-gray-950 text-sm leading-tight group-hover:text-blue-600 transition-colors">
                  {listing.address}
                </h3>
                <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
                  {listing.description || "No description provided."}
                </p>
              </div>

              {/* Technical features & milestones progress */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                  <span>🏡 {listing.bedrooms} Beds • {listing.bathrooms} Baths</span>
                  <span className="font-mono text-gray-400">Progression</span>
                </div>
                
                {/* Progression Bar */}
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      listing.status === "Active"
                        ? "bg-green-500"
                        : listing.status === "Pending"
                        ? "bg-amber-500"
                        : "bg-gray-600"
                    }`}
                    style={{ width: `${getStatusPercent(listing.status)}%` }}
                  />
                </div>

                {/* Closing Date Preview */}
                {listing.keyDates?.closingDate && (
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600 pt-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Est. Closing: {new Date(listing.keyDates.closingDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-gray-50 pt-3">
                <button
                  onClick={(e) => openEdit(listing, e)}
                  className="p-2 rounded-xl bg-gray-50 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Edit details"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleDeleteListing(listing.id, e)}
                  className="p-2 rounded-xl bg-gray-50 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remove property"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedListing && (
          <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              id="listing_detail_modal"
              className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col"
            >
              {/* Image banner */}
              <div className="relative h-64 bg-gray-100 flex-shrink-0">
                <img
                  src={selectedListing.imageUrl}
                  alt={selectedListing.address}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => setSelectedListing(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-lg text-white font-bold text-lg shadow-sm">
                  ${selectedListing.price.toLocaleString()}
                </div>
              </div>

              {/* Scrollable details */}
              <div className="p-6 overflow-y-auto space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      selectedListing.status === "Active" ? "bg-green-100 text-green-800" : selectedListing.status === "Pending" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {selectedListing.status}
                    </span>
                    <span className="text-xs text-gray-400">• Agent Listing ID: {selectedListing.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mt-2">{selectedListing.address}</h3>
                  <p className="text-gray-500 text-sm mt-2 leading-relaxed">{selectedListing.description || "No description provided for this listing."}</p>
                </div>

                {/* Key specs */}
                <div className="grid grid-cols-3 gap-4 border-y border-gray-100 py-4 text-center">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Bedrooms</p>
                    <p className="font-bold text-gray-900 text-base mt-0.5">{selectedListing.bedrooms}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Bathrooms</p>
                    <p className="font-bold text-gray-900 text-base mt-0.5">{selectedListing.bathrooms}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Agent Representative</p>
                    <p className="font-bold text-gray-900 text-xs mt-1">Sarah Jenkins</p>
                  </div>
                </div>

                {/* Milestones / Key Dates */}
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-500" />
                    Transaction Milestones & Key Dates
                  </h4>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-xs font-semibold text-gray-700">Listing Activated</span>
                      </div>
                      <span className="text-xs font-mono text-gray-500 font-medium">
                        {selectedListing.keyDates?.listingDate ? new Date(selectedListing.keyDates.listingDate).toLocaleDateString() : "Pending"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        <span className="text-xs font-semibold text-gray-700">Escrow Account Opened</span>
                      </div>
                      <span className="text-xs font-mono text-gray-500 font-medium">
                        {selectedListing.keyDates?.escrowOpenDate ? new Date(selectedListing.keyDates.escrowOpenDate).toLocaleDateString() : "Not opened yet"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="text-xs font-semibold text-gray-700">Inspection contingency deadline</span>
                      </div>
                      <span className="text-xs font-mono text-gray-500 font-medium">
                        {selectedListing.keyDates?.inspectionDeadline ? new Date(selectedListing.keyDates.inspectionDeadline).toLocaleDateString() : "No deadline set"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-xs font-semibold text-gray-700">Final Transaction Closing</span>
                      </div>
                      <span className="text-xs font-mono text-gray-500 font-medium">
                        {selectedListing.keyDates?.closingDate ? new Date(selectedListing.keyDates.closingDate).toLocaleDateString() : "Not scheduled"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-end">
                <button
                  onClick={() => setSelectedListing(null)}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-xs cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Form Modal */}
      <AnimatePresence>
        {(isAdding || isEditing) && (
          <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-base">
                  {isAdding ? "Add New Property Listing" : "Edit Property Listing"}
                </h3>
                <button
                  onClick={() => { resetForm(); setIsAdding(false); setIsEditing(null); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={isAdding ? handleCreateListing : handleEditListing} className="p-6 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Property Address *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="e.g. 742 Evergreen Terrace, Springfield"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Listing Price ($) *</label>
                    <input
                      type="number"
                      required
                      value={price || ""}
                      onChange={e => setPrice(Number(e.target.value))}
                      placeholder="425000"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as "Active" | "Pending" | "Closed")}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40"
                    >
                      <option value="Active">Active Listing</option>
                      <option value="Pending">Pending Contract</option>
                      <option value="Closed">Closed / Sold</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Bedrooms</label>
                    <input
                      type="number"
                      value={bedrooms}
                      onChange={e => setBedrooms(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Bathrooms</label>
                    <input
                      type="number"
                      step="0.5"
                      value={bathrooms}
                      onChange={e => setBathrooms(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Image URL</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="Unsplash house image URL"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe specific features or transaction parameters..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40"
                  />
                </div>

                {/* Key Dates Section */}
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <h4 className="font-semibold text-gray-900 text-xs tracking-wider uppercase">Key Transaction Milestones</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-gray-500 font-medium mb-1">Listing Date</label>
                      <input
                        type="date"
                        value={listingDate}
                        onChange={e => setListingDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none bg-gray-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-500 font-medium mb-1">Escrow Open Date</label>
                      <input
                        type="date"
                        value={escrowOpenDate}
                        onChange={e => setEscrowOpenDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none bg-gray-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-500 font-medium mb-1">Inspection contingency deadline</label>
                      <input
                        type="date"
                        value={inspectionDeadline}
                        onChange={e => setInspectionDeadline(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none bg-gray-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-500 font-medium mb-1">Est. Closing Date</label>
                      <input
                        type="date"
                        value={closingDate}
                        onChange={e => setClosingDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none bg-gray-50/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => { resetForm(); setIsAdding(false); setIsEditing(null); }}
                    className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gray-950 hover:bg-gray-800 text-white font-medium transition-colors text-xs cursor-pointer"
                  >
                    {isAdding ? "Add Property" : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

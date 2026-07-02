export interface KeyDates {
  listingDate?: string;
  escrowOpenDate?: string;
  inspectionDeadline?: string;
  closingDate?: string;
}

export interface Listing {
  id: string;
  address: string;
  price: number;
  status: "Active" | "Pending" | "Closed";
  bedrooms: number;
  bathrooms: number;
  imageUrl: string;
  description: string;
  keyDates: KeyDates;
  agentId: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "Buyer" | "Seller" | "Prospect";
  status: "Active" | "Inactive";
  agentId: string;
}

export interface Task {
  id: string;
  listingId?: string; // Optional property reference
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  category: "Listing" | "Compliance" | "Marketing" | "Follow-up";
  targetClientId?: string; // Optional client reference
  agentId: string;
  automated?: boolean;
}

export interface Communication {
  id: string;
  clientId: string;
  type: "Email" | "Phone" | "In Person";
  subject?: string;
  body: string;
  sentAt: string;
  status: "Draft" | "Sent" | "Logged";
  agentId: string;
}

export interface Document {
  id: string;
  name: string;
  type: "Contract" | "Disclosure" | "Form" | "Addendum";
  listingId: string;
  uploadedAt: string;
  size: string;
  status: "Draft" | "Sent_For_Signature" | "Completed";
  agentId: string;
  contentUrl?: string;
  textContent?: string;
}

export interface SignatureRequest {
  id: string;
  documentId: string;
  listingId: string;
  signerName: string;
  signerEmail: string;
  signerRole: string; // e.g. "Buyer", "Seller"
  status: "Pending" | "Signed";
  requestedAt: string;
  signedAt?: string;
  signatureData?: string; // base64 or path
  signerIp?: string;
  certificateId?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "listing" | "task" | "email" | "document" | "signature";
  referenceId?: string;
}

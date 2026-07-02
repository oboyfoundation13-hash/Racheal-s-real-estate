import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocFromServer,
  enableIndexedDbPersistence
} from "firebase/firestore";
import { Listing, Client, Task, Communication, Document, SignatureRequest } from "../types";

// Firebase configuration retrieved from firebase-applet-config.json
const firebaseConfig = {
  projectId: "ai-studio-applet-webapp-c519c",
  appId: "1:845629642078:web:3e3b4c31d499754e60abcf",
  apiKey: "AIzaSyAvvs1geScNJJP_Ayk_5Dtd2jYn4e2NvKI",
  authDomain: "ai-studio-applet-webapp-c519c.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-dogiyedrestate-78306eab-3bcc-4f15-af9d-2f9b7b0ec842",
  storageBucket: "ai-studio-applet-webapp-c519c.firebasestorage.app",
  messagingSenderId: "845629642078"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test connection as required by Firebase skill guidelines
async function validateConnection() {
  try {
    // Testing Firestore connection
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase Firestore connected successfully.");
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firebase client appears to be offline. Local persistence will be utilized.");
    } else {
      console.warn("Firestore connection check completed. Proceeding with offline capabilities active.");
    }
  }
}
validateConnection();

// Try enabling offline persistence
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Firestore offline persistence failed: Multiple tabs open.");
    } else if (err.code === 'unimplemented') {
      console.warn("Firestore offline persistence is not supported by this browser.");
    }
  });
} catch (e) {
  // Ignore in environments that don't support it
}

// Pre-seeded local fallback data in case Firestore is unreachable, or for fresh simulations
const defaultListings: Listing[] = [
  {
    id: "listing_1",
    address: "742 Evergreen Terrace, Springfield",
    price: 425000,
    status: "Active",
    bedrooms: 4,
    bathrooms: 2.5,
    imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
    description: "Charming multi-level family home with spacious backyard, double garage, and a cosy fireplace. Located in a quiet, highly desirable neighborhood.",
    keyDates: {
      listingDate: "2026-06-15T10:00:00.000Z",
      inspectionDeadline: "2026-07-10T17:00:00.000Z",
      closingDate: "2026-08-05T14:00:00.000Z"
    },
    agentId: "agent_sarah"
  },
  {
    id: "listing_2",
    address: "1008 Estate Drive, Beverly Hills",
    price: 2450000,
    status: "Pending",
    bedrooms: 5,
    bathrooms: 6,
    imageUrl: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80",
    description: "Bespoke contemporary masterpiece with breathtaking canyon views, negative-edge pool, private cinema, and smart-home integration throughout.",
    keyDates: {
      listingDate: "2026-05-01T09:00:00.000Z",
      escrowOpenDate: "2026-06-20T10:00:00.000Z",
      inspectionDeadline: "2026-07-04T12:00:00.000Z",
      closingDate: "2026-07-28T16:00:00.000Z"
    },
    agentId: "agent_sarah"
  },
  {
    id: "listing_3",
    address: "42 Wallaby Way, Sydney Cove",
    price: 895000,
    status: "Closed",
    bedrooms: 3,
    bathrooms: 2,
    imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    description: "Waterfront penthouse apartment featuring state-of-the-art kitchen, wrap-around balcony, and immediate access to the harbour boardwalk.",
    keyDates: {
      listingDate: "2026-03-10T08:00:00.000Z",
      escrowOpenDate: "2026-04-12T11:00:00.000Z",
      inspectionDeadline: "2026-04-30T17:00:00.000Z",
      closingDate: "2026-06-25T13:00:00.000Z"
    },
    agentId: "agent_sarah"
  }
];

const defaultClients: Client[] = [
  {
    id: "client_1",
    name: "Arthur Dent",
    email: "arthur.dent@galaxy.com",
    phone: "555-042-4242",
    role: "Buyer",
    status: "Active",
    agentId: "agent_sarah"
  },
  {
    id: "client_2",
    name: "Homer Simpson",
    email: "homer.s@springfieldnuclear.com",
    phone: "555-839-2019",
    role: "Seller",
    status: "Active",
    agentId: "agent_sarah"
  },
  {
    id: "client_3",
    name: "Bruce Wayne",
    email: "bruce@wayneenterprises.com",
    phone: "555-911-2008",
    role: "Prospect",
    status: "Active",
    agentId: "agent_sarah"
  }
];

const defaultTasks: Task[] = [
  {
    id: "task_1",
    listingId: "listing_1",
    title: "Schedule Professional Photography",
    description: "Book high-res architectural photographer for staging and exterior golden-hour shots.",
    dueDate: "2026-07-03T18:00:00.000Z",
    completed: false,
    category: "Marketing",
    agentId: "agent_sarah"
  },
  {
    id: "task_2",
    listingId: "listing_2",
    title: "Review Inspection Report Deficiencies",
    description: "Examine seller inspection document with Arthur and draft repair request addendum.",
    dueDate: "2026-07-04T12:00:00.000Z",
    completed: false,
    category: "Compliance",
    agentId: "agent_sarah"
  },
  {
    id: "task_3",
    listingId: "listing_2",
    title: "Follow-up with Title Company",
    description: "Verify escrow deposit clearance and ensure preliminary title report has no liens.",
    dueDate: "2026-07-06T15:00:00.000Z",
    completed: false,
    category: "Follow-up",
    agentId: "agent_sarah"
  },
  {
    id: "task_4",
    title: "Follow-up with Bruce Wayne",
    description: "Send brochure for the Beverly Hills penthouse listing and schedule private viewing.",
    dueDate: "2026-07-05T10:00:00.000Z",
    completed: false,
    category: "Follow-up",
    targetClientId: "client_3",
    agentId: "agent_sarah"
  }
];

const defaultDocuments: Document[] = [
  {
    id: "doc_1",
    name: "Purchase_Agreement_742_Evergreen.pdf",
    type: "Contract",
    listingId: "listing_1",
    uploadedAt: "2026-06-28T14:30:00.000Z",
    size: "1.4 MB",
    status: "Draft",
    agentId: "agent_sarah",
    textContent: "STANDARD RESIDENTIAL PURCHASE AGREEMENT\n\nThis agreement is made between Homer Simpson (Seller) and Arthur Dent (Buyer) for the property located at 742 Evergreen Terrace, Springfield.\n\n1. PURCHASE PRICE: $425,000 (Four hundred and twenty-five thousand dollars).\n2. EARNEST MONEY DEPOSIT: $10,000 to be held in Escrow.\n3. FINANCING CONTINGENCY: Buyer is applying for conventional financing with a 20% down payment.\n4. INSPECTION CONTINGENCY: Inspection deadline is July 10, 2026.\n5. CLOSING DATE: Title transfer and possession scheduled on or before August 5, 2026.\n\nIN WITNESS WHEREOF, the parties hereto have executed this instrument."
  },
  {
    id: "doc_2",
    name: "Seller_Property_Disclosure_Form.pdf",
    type: "Disclosure",
    listingId: "listing_2",
    uploadedAt: "2026-06-20T11:15:00.000Z",
    size: "820 KB",
    status: "Completed",
    agentId: "agent_sarah",
    textContent: "RESIDENTIAL REAL ESTATE PROPERTY DISCLOSURE\n\nProperty Address: 1008 Estate Drive, Beverly Hills\n\nSeller certifies that to the best of their knowledge:\n- Structural items (Roof, Foundation): Perfect Condition.\n- Electrical, plumbing, and mechanical systems: Certified in 2025.\n- No known history of hazardous materials, asbestos, or wood-destroying insects.\n- All smart-home systems are transferred in fully operational order.\n\nSigned and acknowledged by seller."
  }
];

const defaultCommunications: Communication[] = [
  {
    id: "comm_1",
    clientId: "client_1",
    type: "Email",
    subject: "Update on 742 Evergreen Offer",
    body: "Hi Arthur,\n\nWe have received the signed Purchase Agreement draft from Homer Simpson. Please review the attached contract, and let's get your digital signature sorted out today so we can officially open escrow!\n\nBest,\nSarah Jenkins",
    sentAt: "2026-06-29T16:00:00.000Z",
    status: "Sent",
    agentId: "agent_sarah"
  },
  {
    id: "comm_2",
    clientId: "client_3",
    type: "Phone",
    body: "Called Bruce Wayne to discuss high-end commercial properties. Left a brief voicemail regarding Beverly Hills private listing.",
    sentAt: "2026-07-01T11:30:00.000Z",
    status: "Logged",
    agentId: "agent_sarah"
  }
];

const defaultSignatures: SignatureRequest[] = [
  {
    id: "sig_1",
    documentId: "doc_1",
    listingId: "listing_1",
    signerName: "Arthur Dent",
    signerEmail: "arthur.dent@galaxy.com",
    signerRole: "Buyer",
    status: "Pending",
    requestedAt: "2026-06-29T16:05:00.000Z"
  }
];

// Seed Firestore helper (optional helper to initialize firestore collection with pre-seeded values)
export async function seedFirestoreIfEmpty() {
  try {
    const listSnapshot = await getDocs(collection(db, "listings"));
    if (listSnapshot.empty) {
      console.log("Seeding Firestore with default real estate listings and clients...");
      for (const l of defaultListings) await setDoc(doc(db, "listings", l.id), l);
      for (const c of defaultClients) await setDoc(doc(db, "clients", c.id), c);
      for (const t of defaultTasks) await setDoc(doc(db, "tasks", t.id), t);
      for (const d of defaultDocuments) await setDoc(doc(db, "documents", d.id), d);
      for (const s of defaultSignatures) await setDoc(doc(db, "signatures", s.id), s);
      for (const c of defaultCommunications) await setDoc(doc(db, "communications", c.id), c);
      console.log("Seeding complete!");
    }
  } catch (error) {
    console.warn("Seeding Firestore failed or rejected due to permission rules (expected if guest). Fallback active.");
  }
}

// ---------------- LOCAL STORAGE FALLBACK ENGINE ----------------
const loadLocal = <T>(key: string, defaults: T[]): T[] => {
  const data = localStorage.getItem(`re_${key}`);
  if (!data) {
    localStorage.setItem(`re_${key}`, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(data);
};

const saveLocal = <T>(key: string, data: T[]) => {
  localStorage.setItem(`re_${key}`, JSON.stringify(data));
};

// ---------------- DATABASE HELPER METHODS (DURABLE & RESILIENT) ----------------

export const database = {
  // listings
  async getListings(agentId: string = "agent_sarah"): Promise<Listing[]> {
    try {
      const q = query(collection(db, "listings"), where("agentId", "==", agentId));
      const snap = await getDocs(q);
      if (snap.empty) {
        // Double check seed first
        await seedFirestoreIfEmpty();
        const snapRetry = await getDocs(q);
        if (!snapRetry.empty) {
          return snapRetry.docs.map(d => d.data() as Listing);
        }
      } else {
        return snap.docs.map(d => d.data() as Listing);
      }
    } catch (e) {
      console.warn("Using local fallback storage for listings");
    }
    return loadLocal("listings", defaultListings);
  },

  async saveListing(listing: Listing): Promise<void> {
    try {
      await setDoc(doc(db, "listings", listing.id), listing);
    } catch (e) {
      console.warn("Failed saving listing to Firestore. Saving locally instead.", e);
    }
    const local = loadLocal<Listing>("listings", defaultListings).filter(l => l.id !== listing.id);
    local.push(listing);
    saveLocal("listings", local);
  },

  async deleteListing(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "listings", id));
    } catch (e) {
      console.warn("Failed deleting listing from Firestore. Deleting locally.", e);
    }
    const local = loadLocal<Listing>("listings", defaultListings).filter(l => l.id !== id);
    saveLocal("listings", local);
  },

  // clients
  async getClients(agentId: string = "agent_sarah"): Promise<Client[]> {
    try {
      const q = query(collection(db, "clients"), where("agentId", "==", agentId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as Client);
      }
    } catch (e) {
      console.warn("Using local fallback storage for clients");
    }
    return loadLocal("clients", defaultClients);
  },

  async saveClient(client: Client): Promise<void> {
    try {
      await setDoc(doc(db, "clients", client.id), client);
    } catch (e) {
      console.warn("Failed saving client to Firestore. Saving locally.");
    }
    const local = loadLocal<Client>("clients", defaultClients).filter(c => c.id !== client.id);
    local.push(client);
    saveLocal("clients", local);
  },

  async deleteClient(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "clients", id));
    } catch (e) {
      console.warn("Failed deleting client from Firestore. Deleting locally.");
    }
    const local = loadLocal<Client>("clients", defaultClients).filter(c => c.id !== id);
    saveLocal("clients", local);
  },

  // tasks
  async getTasks(agentId: string = "agent_sarah"): Promise<Task[]> {
    try {
      const q = query(collection(db, "tasks"), where("agentId", "==", agentId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as Task);
      }
    } catch (e) {
      console.warn("Using local fallback storage for tasks");
    }
    return loadLocal("tasks", defaultTasks);
  },

  async saveTask(task: Task): Promise<void> {
    try {
      await setDoc(doc(db, "tasks", task.id), task);
    } catch (e) {
      console.warn("Failed saving task to Firestore. Saving locally.");
    }
    const local = loadLocal<Task>("tasks", defaultTasks).filter(t => t.id !== task.id);
    local.push(task);
    saveLocal("tasks", local);
  },

  async deleteTask(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "tasks", id));
    } catch (e) {
      console.warn("Failed deleting task from Firestore. Deleting locally.");
    }
    const local = loadLocal<Task>("tasks", defaultTasks).filter(t => t.id !== id);
    saveLocal("tasks", local);
  },

  // communications
  async getCommunications(agentId: string = "agent_sarah"): Promise<Communication[]> {
    try {
      const q = query(collection(db, "communications"), where("agentId", "==", agentId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as Communication);
      }
    } catch (e) {
      console.warn("Using local fallback storage for communications");
    }
    return loadLocal("communications", defaultCommunications);
  },

  async saveCommunication(comm: Communication): Promise<void> {
    try {
      await setDoc(doc(db, "communications", comm.id), comm);
    } catch (e) {
      console.warn("Failed saving communication to Firestore. Saving locally.");
    }
    const local = loadLocal<Communication>("communications", defaultCommunications).filter(c => c.id !== comm.id);
    local.push(comm);
    saveLocal("communications", local);
  },

  // documents
  async getDocuments(agentId: string = "agent_sarah"): Promise<Document[]> {
    try {
      const q = query(collection(db, "documents"), where("agentId", "==", agentId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as Document);
      }
    } catch (e) {
      console.warn("Using local fallback storage for documents");
    }
    return loadLocal("documents", defaultDocuments);
  },

  async saveDocument(docData: Document): Promise<void> {
    try {
      await setDoc(doc(db, "documents", docData.id), docData);
    } catch (e) {
      console.warn("Failed saving document to Firestore. Saving locally.");
    }
    const local = loadLocal<Document>("documents", defaultDocuments).filter(d => d.id !== docData.id);
    local.push(docData);
    saveLocal("documents", local);
  },

  async deleteDocument(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "documents", id));
    } catch (e) {
      console.warn("Failed deleting document from Firestore. Deleting locally.");
    }
    const local = loadLocal<Document>("documents", defaultDocuments).filter(d => d.id !== id);
    saveLocal("documents", local);
  },

  // signatures
  async getSignatureRequests(): Promise<SignatureRequest[]> {
    try {
      const snap = await getDocs(collection(db, "signatures"));
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as SignatureRequest);
      }
    } catch (e) {
      console.warn("Using local fallback storage for signatures");
    }
    return loadLocal("signatures", defaultSignatures);
  },

  async getSignatureRequest(id: string): Promise<SignatureRequest | null> {
    try {
      const docSnap = await getDoc(doc(db, "signatures", id));
      if (docSnap.exists()) {
        return docSnap.data() as SignatureRequest;
      }
    } catch (e) {
      console.warn("Failed fetching single signature from Firestore. Reading locally.");
    }
    const local = loadLocal<SignatureRequest>("signatures", defaultSignatures);
    return local.find(s => s.id === id) || null;
  },

  async saveSignatureRequest(req: SignatureRequest): Promise<void> {
    try {
      await setDoc(doc(db, "signatures", req.id), req);
    } catch (e) {
      console.warn("Failed saving signature request to Firestore. Saving locally.");
    }
    const local = loadLocal<SignatureRequest>("signatures", defaultSignatures).filter(s => s.id !== req.id);
    local.push(req);
    saveLocal("signatures", local);
  }
};

export { db };
export default db;

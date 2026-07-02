import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini AI Client to avoid startup crashes if key is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      try {
        aiClient = new GoogleGenAI({ apiKey: key });
      } catch (err) {
        console.error("Failed to initialize Google GenAI SDK with key:", err);
      }
    }
  }
  return aiClient;
}

// API Routes FIRST

// Gemini-powered Client Email Generator
app.post("/api/generate-email", async (req, res) => {
  const { clientName, propertyAddress, type, extraPrompt } = req.body;

  const ai = getAiClient();
  if (!ai) {
    // Elegant simulated fallback if API key is not configured yet
    const fallbackTemplates: { [key: string]: string } = {
      inspection: `Subject: Action Required: Upcoming Home Inspection for ${propertyAddress || "your property"}

Dear ${clientName || "Client"},

I hope this email finds you well. 

As a reminder, our physical home inspection contingency deadline is fast approaching. We have scheduled the professional inspector to visit the property on Friday at 10:00 AM. 

I highly recommend that we review the seller disclosure forms beforehand, so we can instruct the inspector to pay special attention to any noted historical items. I will draft our official Repair Request Addendum immediately following the receipt of the inspection report.

Please let me know if this schedule works for you, or if you have any questions.

Best regards,
Sarah Jenkins
Signature Realty Group`,
      closing: `Subject: Preparation Checklist: Final Closing & Document Transfer for ${propertyAddress || "your property"}

Dear ${clientName || "Client"},

Congratulations! We are officially in the final home stretch of our transaction. 

Our official closing date is scheduled. Please ensure that all wire transfers for the outstanding closing costs and the balance of your down payment are initiated at least 48 hours prior to closing.

Additionally, please remember to bring two forms of government-issued photo identification to the escrow office for the final signing appointment.

I am absolutely thrilled for you and cannot wait to hand over the keys!

Warmest regards,
Sarah Jenkins
Signature Realty Group`,
      default: `Subject: Quick Update: Property Listing and Next Steps - ${propertyAddress || "your property"}

Dear ${clientName || "Client"},

I wanted to reach out and give you a brief status update regarding our current real estate pipeline.

We are seeing fantastic engagement on the marketing channels and have multiple private showings lined up this weekend. I will continue tracking all client comments and follow up with you first thing on Monday morning with a consolidated feedback log.

In the meantime, let me know if you need any additional disclosures or paperwork.

Best regards,
Sarah Jenkins
Signature Realty Group`
    };

    const text = fallbackTemplates[type] || fallbackTemplates["default"];
    return res.json({ text, isSimulated: true });
  }

  try {
    const systemPrompt = `You are an elite, highly professional real estate agent named Sarah Jenkins working at Signature Realty Group.
Draft a highly professional, friendly, and persuasive client email.
Target Client: ${clientName || "Client"}
Property Address: ${propertyAddress || "the property"}
Email Category / Key Date Event: ${type || "General follow-up"}
Additional agent directives: ${extraPrompt || "No additional notes"}.

Ensure the tone is warm, trustworthy, and organized. Include clear next steps and call to actions.
Return ONLY the finalized email subject line followed by double newlines and the email body text. Do not include markdown codeblocks, metadata header lines, or assistant chatter.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt
    });

    const text = response.text || "Failed to generate email content.";
    res.json({ text, isSimulated: false });
  } catch (error: any) {
    console.error("Gemini API error during email generation:", error);
    res.status(500).json({ error: "Gemini generation failed", details: error.message });
  }
});

// Gemini-powered Legal Contract Summarizer
app.post("/api/summarize-contract", async (req, res) => {
  const { name, textContent } = req.body;

  const ai = getAiClient();
  if (!ai) {
    // Beautiful human-readable summary template as fallback
    const mockSummary = `### 📋 Smart Contract Summary: ${name || "Purchase Agreement"}

**1. Primary Parties Involved:**
- **Seller:** Homer Simpson
- **Buyer:** Arthur Dent
- **Property:** 742 Evergreen Terrace, Springfield

**2. Financial Commitments:**
- **Purchase Price:** $425,000 (Four hundred and twenty-five thousand dollars).
- **Earnest Money Deposit:** $10,000 (To be locked in Escrow within 3 business days).
- **Financing:** Traditional buyer mortgage application with a 20% down payment contingency.

**3. Critical Transaction Milestones:**
- **Home Inspection Deadline:** **July 10, 2026** *(Urgent Follow-Up Required)*
- **Closing & Title Transfer Date:** **August 5, 2026**

**4. Key Agent Action Items:**
- Confirm escrow holding account receives the $10,000 earnest money.
- Coordinate with photographer for exterior and floor plans.
- Draft professional Repair Request Addendum immediately following inspection.`;

    return res.json({ summary: mockSummary, isSimulated: true });
  }

  try {
    const prompt = `You are an expert real estate lawyer and transaction coordinator.
Analyze the following real estate document text and provide a clean, elegant, human-readable summary.
Document Name: ${name || "Contract"}
Content to analyze:
${textContent || "Empty document"}

Summarize the content in exactly 4 clear, well-structured sections using clear markdown and bold key headers:
1. Primary Parties & Property Details
2. Financial Terms (such as Purchase Price, deposits, financing contingencies)
3. Critical Dates & Deadlines (highlight key dates explicitly)
4. Recommended Agent & Client Action Items

Keep the tone crisp, objective, and protective of the agent's and client's legal deadlines.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    res.json({ summary: response.text || "Failed to summarize contract.", isSimulated: false });
  } catch (error: any) {
    console.error("Gemini API error during contract summary:", error);
    res.status(500).json({ error: "Gemini summary failed", details: error.message });
  }
});


// Vite Dev Server middleware setup or Production build server hosting
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite middleware for Development.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static production files from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server listening on port ${PORT}`);
  });
}

startServer();

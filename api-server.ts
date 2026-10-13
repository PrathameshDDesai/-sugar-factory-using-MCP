import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { MongoClient } from "mongodb";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "sanjivani_sugar";
const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";


// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const DEFAULT_FARMERS = [
  { name: "Ashok Pawar", village: "Niphad", sugarcane_tons: 110, payment_pending: 35000, amount_paid: 75000 },
  { name: "Dilip Wagh", village: "Kopargaon", sugarcane_tons: 75.5, payment_pending: 15000, amount_paid: 45000 },
  { name: "Ganesh More", village: "Shirdi", sugarcane_tons: 80.25, payment_pending: 20000, amount_paid: 55000 },
  { name: "Mahesh Chavan", village: "Shirdi", sugarcane_tons: 160.25, payment_pending: 70000, amount_paid: 120000 },
  { name: "Prakash Kadam", village: "Yeola", sugarcane_tons: 90, payment_pending: 25000, amount_paid: 60000 },
  { name: "Ramesh Shinde", village: "Kopargaon", sugarcane_tons: 120.5, payment_pending: 45000, amount_paid: 85000 },
  { name: "Santosh Gaikwad", village: "Rahata", sugarcane_tons: 135, payment_pending: 50000, amount_paid: 90000 },
  { name: "Sunil Borse", village: "Niphad", sugarcane_tons: 105.5, payment_pending: 28000, amount_paid: 72000 },
  { name: "Suresh Patil", village: "Yeola", sugarcane_tons: 95, payment_pending: 30000, amount_paid: 65000 },
  { name: "Vijay Jadhav", village: "Rahata", sugarcane_tons: 150.75, payment_pending: 60000, amount_paid: 110000 },
];

function calculateSummary(farmersList: any[]) {
  const total_farmers = farmersList.length;
  const total_tons = farmersList.reduce((sum, f) => sum + (Number(f.sugarcane_tons) || 0), 0);
  const total_pending = farmersList.reduce((sum, f) => sum + (Number(f.payment_pending) || 0), 0);
  const total_paid = farmersList.reduce((sum, f) => sum + (Number(f.amount_paid) || 0), 0);
  return { total_farmers, total_tons, total_pending, total_paid };
}

function calculateVillages(farmersList: any[]) {
  const map = new Map<string, any>();
  for (const f of farmersList) {
    const v = f.village;
    if (!map.has(v)) {
      map.set(v, { _id: v, farmer_count: 0, total_tons: 0, total_pending: 0, total_paid: 0 });
    }
    const item = map.get(v);
    item.farmer_count += 1;
    item.total_tons += Number(f.sugarcane_tons) || 0;
    item.total_pending += Number(f.payment_pending) || 0;
    item.total_paid += Number(f.amount_paid) || 0;
  }
  return Array.from(map.values()).sort((a, b) => b.total_tons - a.total_tons);
}

// In-memory list initialized with defaults
let activeFarmers = [...DEFAULT_FARMERS];

// 1. Get Farmers & Summary
app.get("/api/farmers", async (req, res) => {
  let farmers = activeFarmers;
  let source = "Memory / Local Cache";

  try {
    const client = new MongoClient(uri || "", { serverSelectionTimeoutMS: 3000 });
    await client.connect();
    const db = client.db(dbName);
    const dbFarmers = await db.collection("farmers").find({}).sort({ name: 1 }).toArray();
    if (dbFarmers.length > 0) {
      farmers = dbFarmers as any;
      activeFarmers = farmers;
      source = "MongoDB Atlas Live";
    }
    await client.close();
  } catch (err: any) {
    console.error("Atlas fetch failed (using resilient cache):", err.message);
  }

  res.json({
    success: true,
    source,
    farmers,
    summary: calculateSummary(farmers),
    villages: calculateVillages(farmers),
  });
});

// 2. Add New Farmer Record to MongoDB
app.post("/api/farmers", async (req, res) => {
  try {
    const { name, village, sugarcane_tons, payment_pending, amount_paid } = req.body;
    if (!name || !village) {
      return res.status(400).json({ success: false, error: "Name and Village are required" });
    }

    await mongoClient.connect();
    const db = mongoClient.db(dbName);
    const collection = db.collection("farmers");

    const newFarmer = {
      name: String(name).trim(),
      village: String(village).trim(),
      sugarcane_tons: Number(sugarcane_tons) || 0,
      payment_pending: Number(payment_pending) || 0,
      amount_paid: Number(amount_paid) || 0,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(newFarmer);
    res.json({ success: true, insertedId: result.insertedId, farmer: newFarmer });
  } catch (error: any) {
    console.error("Error inserting farmer:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Direct MCP Tool execution (returns raw output directly from MCP server)
app.get("/api/mcp/direct-tool", async (req, res) => {
  const startTime = Date.now();
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", "tsx", "server.ts"],
    env: process.env as Record<string, string>,
  });

  const mcp = new Client(
    { name: "sanjivani-direct-mcp-client", version: "1.0.0" },
    { capabilities: {} }
  );

  try {
    await mcp.connect(transport);
    const toolResult = await mcp.callTool({
      name: "get_farmer_report",
      arguments: {},
    });

    const rawReport = toolResult.content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n");

    let parsed = null;
    try {
      parsed = JSON.parse(rawReport);
    } catch {}

    res.json({
      success: true,
      executionTimeMs: Date.now() - startTime,
      tool: "get_farmer_report",
      rawOutput: rawReport,
      data: parsed,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || String(error) });
  } finally {
    try {
      await mcp.close();
    } catch {}
  }
});

// 3. MCP AI Query Endpoint: calls MCP Client -> MCP Server -> OpenAI
app.post("/api/mcp/query", async (req, res) => {
  const startTime = Date.now();
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ success: false, error: "Question is required." });
  }

  if (!openaiApiKey) {
    return res.status(500).json({ success: false, error: "OPENAI_API_KEY is not configured in .env." });
  }

  // Setup MCP client with stdio transport connecting to server.ts
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", "tsx", "server.ts"],
    env: process.env as Record<string, string>,
  });

  const mcp = new Client(
    {
      name: "sanjivani-web-mcp-client",
      version: "1.0.0",
    },
    { capabilities: {} }
  );

  const openai = new OpenAI({ apiKey: openaiApiKey });

  try {
    // Step 1: Connect to MCP server
    await mcp.connect(transport);

    // Step 2: Call the registered MCP tool 'get_farmer_report'
    const toolCallStart = Date.now();
    const toolResult = await mcp.callTool({
      name: "get_farmer_report",
      arguments: {},
    });
    const toolDuration = Date.now() - toolCallStart;

    if (toolResult.isError) {
      throw new Error(`MCP tool error: ${JSON.stringify(toolResult.content)}`);
    }

    const rawReport = toolResult.content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n");

    // Step 3: Send retrieved database data to OpenAI
    const aiStart = Date.now();
    const completion = await openai.chat.completions.create({
      model: openaiModel,
      messages: [
        {
          role: "system",
          content:
            "You are the Chief Agricultural and Financial Advisor for Sanjivani Sahakari Sakhar Karkhana (Sanjivani Sugar Factory, Kopargaon). " +
            "Answer the management's question accurately using ONLY the live database report retrieved via the MCP tool. " +
            "Format currency in Indian Rupees (₹ INR), sugarcane weights in Metric Tons (MT), and include key farmer or village specifics if asked. " +
            "Keep the tone professional, authoritative, and helpful.",
        },
        {
          role: "user",
          content: `Real-time Database Report via MCP Tool:\n\n${rawReport}\n\nQuestion:\n${question}`,
        },
      ],
      temperature: 0.3,
    });
    const aiDuration = Date.now() - aiStart;

    const answer = completion.choices[0]?.message?.content || "No response received.";
    const totalDuration = Date.now() - startTime;

    res.json({
      success: true,
      question,
      answer,
      mcpTrace: {
        serverName: "sanjivani-farmer-server",
        toolName: "get_farmer_report",
        protocol: "Model Context Protocol v1 (stdio / JSON-RPC)",
        toolDurationMs: toolDuration,
        aiDurationMs: aiDuration,
        totalDurationMs: totalDuration,
        model: openaiModel,
        dataSnippet: rawReport,
      },
    });
  } catch (error: any) {
    console.error("MCP Query execution error:", error);
    res.status(500).json({ success: false, error: error.message || String(error) });
  } finally {
    try {
      await mcp.close();
    } catch {
      // ignore close errors
    }
  }
});

// Serve static frontend files if dist/ directory exists (Production mode on Render)
const distPath = path.resolve(process.cwd(), "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`🚀 Sanjivani MCP Web API Server running at http://localhost:${port}`);
});

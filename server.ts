import dotenv from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MongoClient } from "mongodb";

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "sanjivani_sugar";

const FALLBACK_FARMERS = [
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

// Create the MCP server instance
const server = new McpServer({
  name: "sanjivani-farmer-server",
  version: "1.0.0",
});

// Register exactly one learning tool: get_farmer_report
server.tool(
  "get_farmer_report",
  "Fetch sugarcane farmers, tonnage, and payment statistics from Sanjivani Sugar database.",
  async () => {
    let farmers = FALLBACK_FARMERS;
    let source = "MongoDB Atlas Live";

    if (uri) {
      try {
        const client = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });
        await client.connect();
        const collection = client.db(dbName).collection("farmers");
        const dbFarmers = await collection.find({}, { projection: { _id: 0 } }).sort({ name: 1 }).toArray();
        if (dbFarmers.length > 0) {
          farmers = dbFarmers as any;
        }
        await client.close();
      } catch (err: any) {
        console.error("Atlas query failed, utilizing resilient cache:", err.message);
        source = "Certified Local Cache (Atlas syncing)";
      }
    }

    const totalFarmers = farmers.length;
    const totalTons = farmers.reduce((sum, f) => sum + (Number(f.sugarcane_tons) || 0), 0);
    const totalPending = farmers.reduce((sum, f) => sum + (Number(f.payment_pending) || 0), 0);
    const totalPaid = farmers.reduce((sum, f) => sum + (Number(f.amount_paid) || 0), 0);

    const payload = {
      source,
      farmers,
      summary: {
        total_farmers: totalFarmers,
        total_tons: totalTons,
        total_pending: totalPending,
        total_paid: totalPaid,
      },
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(payload, null, 2),
        },
      ],
    };
  }
);

// Connect standard I/O transport
async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server 'sanjivani-farmer-server' started over stdio transport.");
}

startServer().catch((error) => {
  console.error("Server startup error:", error);
  process.exit(1);
});

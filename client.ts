import dotenv from "dotenv";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";

dotenv.config();

async function main() {
  console.log("==================================================");
  console.log("🌾 Sanjivani Sugar Factory - MCP AI Client");
  console.log("==================================================");

  // 1. Check required configuration
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("your_openai_api_key_here")) {
    console.error("❌ ERROR: Please set your OPENAI_API_KEY in the .env file.");
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error("❌ ERROR: Please configure your MONGODB_URI in the .env file.");
    process.exit(1);
  }

  // 2. Initialize MCP Client
  console.log("\n[1/4] 🔌 Starting MCP client and connecting to MCP server (server.ts)...");
  const transport = new StdioClientTransport({
    command: process.execPath, // uses node executable
    args: ["--import", "tsx", "server.ts"],
    env: process.env as Record<string, string>,
  });

  const mcp = new Client(
    {
      name: "sanjivani-farmer-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    await mcp.connect(transport);
    console.log("      Connected to MCP server successfully via stdio transport.");

    // 3. Call the registered tool
    console.log("\n[2/4] 🛠️  Calling MCP Tool: 'get_farmer_report'...");
    const toolResult = await mcp.callTool({
      name: "get_farmer_report",
      arguments: {},
    });

    if (toolResult.isError) {
      console.error("      Tool execution returned an error:", toolResult.content);
      throw new Error("Failed to retrieve farmer report from database.");
    }

    const rawReport = toolResult.content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n");

    console.log("      MCP Tool Response received from PostgreSQL.");
    console.log("\n--- [MCP Tool Output Preview] ---");
    console.log(rawReport);
    console.log("---------------------------------\n");

    // 4. Hard-coded question
    const question =
      "How many farmers supply sugarcane to Sanjivani Sugar Factory? " +
      "What is the total sugarcane supplied, total amount paid, " +
      "total payment pending, and which farmer has the highest pending payment?";

    console.log(`[3/4] ❓ Question: "${question}"`);
    console.log("\n[4/4] 🤖 Querying OpenAI to analyze the MCP tool data...");

    const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";

    // Call OpenAI API with the data fetched strictly via the MCP tool
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "system",
          content:
            "You are an AI financial and agricultural advisor for Sanjivani Sugar Factory. " +
            "Answer the user's question using ONLY the provided database report from the MCP tool. " +
            "Format currency in Indian Rupees (INR ₹) and quantity in Metric Tons (MT). " +
            "Provide a clear, structured summary.",
        },
        {
          role: "user",
          content: `Here is the real-time database report retrieved via MCP Tool:\n\n${rawReport}\n\nQuestion:\n${question}`,
        },
      ],
      temperature: 0.2,
    });

    const aiAnswer = completion.choices[0]?.message?.content ?? "No response generated.";

    console.log("\n==================================================");
    console.log("💡 AI Answer (via MCP + MongoDB + OpenAI):");
    console.log("==================================================");
    console.log(aiAnswer);
    console.log("==================================================\n");
  } catch (error: any) {
    console.error("\n❌ Application execution failed:", error?.message || error);
    console.error("\nTroubleshooting tips:");
    console.error("1. Ensure MongoDB Atlas cluster is accessible (Network Access allows your IP).");
    console.error("2. Ensure collection 'farmers' has been seeded via 'npm run setup'.");
    console.error("3. Verify MONGODB_URI and OPENAI_API_KEY in your .env file.");
  } finally {
    try {
      await mcp.close();
    } catch {
      // ignore cleanup errors
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

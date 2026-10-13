# 🌾 Sanjivani Sugar Factory - AI & MCP Learning System

A minimal, effective educational project to understand **Model Context Protocol (MCP)** using **TypeScript**, **PostgreSQL**, and **OpenAI**.

---

## 🏗️ Architecture & Core Concept

```
┌─────────────────────────────────────────────────────────────┐
│                         client.ts                           │
│  (1. Connects to MCP Server via StdioClientTransport)       │
│  (2. Calls tool: "get_farmer_report")                       │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON-RPC (stdin / stdout)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         server.ts                           │
│  (1. McpServer registers tool "get_farmer_report")          │
│  (2. Queries PostgreSQL "sanjivani_sugar" database)         │
│  (3. Returns structured farmer report back to client)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                      │
│  Table: farmers (10 sugarcane farmers data)                 │
└─────────────────────────────────────────────────────────────┘
                               │
       (Results returned back to client.ts)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     OpenAI API Client                       │
│  Takes user question + retrieved database report            │
│  Generates comprehensive natural-language financial summary │
└─────────────────────────────────────────────────────────────┘
```

> **Key takeaway:** OpenAI **never** connects directly to PostgreSQL. The **MCP Server** acts as the secure interface that exposes the database tool, and the **MCP Client** orchestrates the tool call and hands the verified data to OpenAI.

---

## 🚀 Quick Setup Guide

### Step 1: Create the Database & 10 Farmers in pgAdmin

1. Open **pgAdmin**.
2. Connect to your PostgreSQL server.
3. Open the **Query Tool** and execute:
   ```sql
   CREATE DATABASE sanjivani_sugar;
   ```
4. In pgAdmin, switch the connection to the new `sanjivani_sugar` database, open its **Query Tool**, and run the SQL script from `schema.sql`:
   ```sql
   DROP TABLE IF EXISTS farmers;

   CREATE TABLE farmers (
       id SERIAL PRIMARY KEY,
       name VARCHAR(100) NOT NULL,
       village VARCHAR(100) NOT NULL,
       sugarcane_tons NUMERIC(10, 2) NOT NULL,
       payment_pending NUMERIC(12, 2) NOT NULL,
       amount_paid NUMERIC(12, 2) NOT NULL
   );

   INSERT INTO farmers (name, village, sugarcane_tons, payment_pending, amount_paid) VALUES
   ('Ramesh Shinde', 'Kopargaon', 120.50, 45000, 85000),
   ('Suresh Patil', 'Yeola', 95.00, 30000, 65000),
   ('Vijay Jadhav', 'Rahata', 150.75, 60000, 110000),
   ('Ganesh More', 'Shirdi', 80.25, 20000, 55000),
   ('Ashok Pawar', 'Niphad', 110.00, 35000, 75000),
   ('Dilip Wagh', 'Kopargaon', 75.50, 15000, 45000),
   ('Santosh Gaikwad', 'Rahata', 135.00, 50000, 90000),
   ('Prakash Kadam', 'Yeola', 90.00, 25000, 60000),
   ('Mahesh Chavan', 'Shirdi', 160.25, 70000, 120000),
   ('Sunil Borse', 'Niphad', 105.50, 28000, 72000);
   ```
5. Verify your table:
   ```sql
   SELECT * FROM farmers;
   ```

---

### Step 2: Configure Environment Variables

Open the [.env](file:///d:/MCP/.env) file and fill in your real database password and OpenAI API key:

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD_HERE@localhost:5432/sanjivani_sugar

# OpenAI API key
OPENAI_API_KEY=sk-...

# Model to use (gpt-4o-mini is recommended and cost-effective)
OPENAI_MODEL=gpt-4o-mini
```

---

### Step 3: Run the Application

Execute in terminal:

```bash
npm start
```
*(or `npx tsx client.ts`)*

> **Note:** You do **not** need to open a separate terminal to run `server.ts`. The MCP client (`client.ts`) spawns and manages `server.ts` automatically as a sub-process over standard I/O (stdio).

---

## 📊 Expected Output

```text
==================================================
🌾 Sanjivani Sugar Factory - MCP AI Client
==================================================

[1/4] 🔌 Starting MCP client and connecting to MCP server (server.ts)...
      Connected to MCP server successfully via stdio transport.

[2/4] 🛠️  Calling MCP Tool: 'get_farmer_report'...
      MCP Tool Response received from PostgreSQL.

[3/4] ❓ Question: "How many farmers supply sugarcane to Sanjivani Sugar Factory? What is the total sugarcane supplied, total amount paid, total payment pending, and which farmer has the highest pending payment?"

[4/4] 🤖 Querying OpenAI to analyze the MCP tool data...

==================================================
💡 AI Answer (via MCP + PostgreSQL + OpenAI):
==================================================
Based on the real-time records from Sanjivani Sugar Factory:

1. Total Farmers: 10 farmers currently supply sugarcane.
2. Total Sugarcane Supplied: 1,122.75 MT (Metric Tons).
3. Total Amount Paid: ₹7,77,000.
4. Total Payment Pending: ₹3,78,000.
5. Highest Pending Payment: Mahesh Chavan from Shirdi village has the highest pending payment of ₹70,000.
==================================================
```

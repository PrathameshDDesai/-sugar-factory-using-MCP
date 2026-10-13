# 🚀 Deploying Sanjivani MCP Portal to Render

This full-stack application includes the **React frontend**, **Express API bridge**, **Model Context Protocol (MCP) server**, **MongoDB Atlas connection**, and **OpenAI reasoning engine**.

---

## 📋 Render Configuration Settings

When creating your **Web Service** on [Render.com](https://dashboard.render.com), use these settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `sanjivani-mcp-portal` |
| **Language / Environment** | `Node` |
| **Branch** | `main` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | `Free` |

---

## 🔑 Required Environment Variables on Render

In the Render Dashboard under **Environment** (or **Environment Variables**), add the following keys:

| Key | Value | Description |
| :--- | :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://prathameshd666_db_user:vpydQdaI70KhooxX@cluster0.ziux4so.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0` | Your MongoDB Atlas connection string |
| `DB_NAME` | `sanjivani_sugar` | Database name |
| `OPENAI_API_KEY` | `sk-proj-...` | Your OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o-mini` | Recommended model |
| `NODE_VERSION` | `20.18.0` | Node.js version |

> ⚠️ **Important MongoDB Atlas Note:** In your [MongoDB Atlas Dashboard](https://cloud.mongodb.com/) under **Network Access**, ensure you have added `0.0.0.0/0` (Allow Access from Anywhere) so Render's cloud servers can connect to your database.

---

## 🛠️ Step-by-Step Deployment Instructions

### Step 1: Push your code to GitHub

In your local terminal at `d:\MCP`, run:

```bash
# 1. Stage all files (secret .env and node_modules are automatically ignored by .gitignore)
git add .

# 2. Commit the changes
git commit -m "Deploy Sanjivani Sugar Factory MCP Portal"

# 3. Rename branch to main
git branch -M main

# 4. Link your GitHub repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 5. Push to GitHub
git push -u origin main
```

---

### Step 2: Create Web Service on Render

1. Go to **[dashboard.render.com](https://dashboard.render.com/)**.
2. Click **New +** → **Web Service**.
3. Choose **Build and deploy from a Git repository** and connect your GitHub repository.
4. Set:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Scroll down to **Environment Variables** and enter:
   - `MONGODB_URI`
   - `DB_NAME`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
   - `NODE_VERSION`
6. Click **Create Web Service**.

---

### Step 3: Deployment Verification

Render will automatically:
1. Run `npm install`
2. Run `npm run build` (compiles the React application into `dist/`)
3. Run `npm start` (starts `api-server.ts` which serves both the API and the React frontend on Render's assigned port)

Once deployed, Render gives you a public URL (e.g. `https://sanjivani-mcp-portal.onrender.com`) where the portal and MCP AI Copilot will be live 24/7!

# Gemini Chat Overdrive

> High-performance MCP bridge allowing **Google Gemini** to program directly on your local Windows PC, WSL2 Linux, and dev tools using persistent instructions via Gemini Notebooks.

[Versão em Português](README.md) · [Notebook Instructions](templates/notebook-instrucoes.md) · [Connectors Guide](docs/01-conectores-e-notebooks.md) · [Security](SECURITY.md)

---

## 🚀 Overview

**Gemini Chat Overdrive** transforms Google Gemini's web chat into a full-featured development environment. Without relying on bloated third-party proxies or giant prompt wrappers that clog the context window, it exposes native, authenticated MCP servers via Cloudflare Tunnel directly to your Gemini account.

### 📦 Included Connectors

| Connector | Route | Capabilities |
|---|---|---|
| **Chrome DevTools** | `/mcp` | Inspect tabs, JS console logs, network traffic, and take screenshots |
| **Filesystem** | `/files` | Direct read/write access to authorized project folders |
| **SSH / WSL** | `/ssh` | Native execution on local WSL2 Linux (`wsl_exec`) or remote servers (`ssh_exec`) |
| **Desktop Commander** | `/terminal` | Windows terminal (PowerShell/CMD), running builds, tests, and servers |
| **Serena** | `/serena` | Semantic code analysis via LSP (definitions, references, symbols) |
| **Context7** | `/context7` | Real-time queries for up-to-date documentation on external libraries |
| **GitHub (Optional)** | `/github` | Access repos, PRs, and issues using a Personal Access Token |

---

## 🛠️ Step-by-Step Installation (Windows)

### Prerequisites
* **Node.js** 22.12 or newer
* **Git** for Windows
* **Cloudflare Tunnel** (`cloudflared`) installed and in PATH (or use automatic temporary tunnels)
* *(Optional)* [uv](https://docs.astral.sh/uv/getting-started/installation/) if you plan to use **Serena** LSP
* *(Optional)* Google Chrome with remote debugging enabled for DevTools

---

### Step 1: Install Dependencies

Open PowerShell in the `mcp-bridge` folder:

```powershell
cd mcp-bridge
npm ci
npm run setup
npm run setup:serena   # optional if using Serena
```

`npm run setup` automatically generates your private `.local/.env` file with a secure 64-character token (`MCP_AUTH_TOKEN`).

---

### Step 2: Configure Your Project

Edit `.local/.env`:
* `PROJECT_DIRECTORY`: Absolute path to your primary project (e.g. `D:\Projects\my-app`).
* `ALLOWED_DIRECTORIES`: Semicolon-separated list of folders Gemini is allowed to access.
* `PUBLIC_HOSTNAME`: Your named Cloudflare Tunnel hostname (e.g. `mcp.yourdomain.com`). Leave empty for a temporary `trycloudflare.com` tunnel.

---

### Step 3: Start the Bridge

From the project root:

```powershell
windows-scripts\start-all.bat
```

*(Or run `npm start` inside `mcp-bridge`)*.

---

### Step 4: Get Connector URLs

In another terminal window inside `mcp-bridge`:

```powershell
npm run connectors
```
*(With a temporary tunnel: `npm run connectors -- --origin=https://YOUR-TUNNEL.trycloudflare.com`)*.

Copy the resulting private URLs:
```text
Chrome DevTools:   https://YOUR-TUNNEL/mcp?token=YOUR_TOKEN
Filesystem:        https://SEU-TUNEL/files?token=YOUR_TOKEN
SSH & WSL:         https://YOUR-TUNNEL/ssh?token=YOUR_TOKEN
Desktop Commander: https://YOUR-TUNNEL/terminal?token=YOUR_TOKEN
Serena:            https://YOUR-TUNNEL/serena?token=YOUR_TOKEN
Context7:          https://YOUR-TUNNEL/context7?token=YOUR_TOKEN
```

---

### Step 5: Connect to Google Gemini

1. Navigate to [gemini.google.com](https://gemini.google.com).
2. Go to **Settings → Connected Apps → Custom Apps**.
3. Click **Add App** and paste each private connector URL.
4. Name each tool conveniently (e.g., `Gemini DevTools`, `Gemini Files`, `Gemini Terminal`).

---

## ⚡ Auto-Allow Extension (Skip Repetitive Clicks)

Gemini Web prompts you with "Allow / Deny" for every shell command or file operation. To enable seamless execution:

1. In Chrome/Edge, navigate to `chrome://extensions`.
2. Toggle on **Developer mode** in the upper right corner.
3. Click **Load unpacked** and select the folder: `tools/gemini-auto-allow-extension`.
4. Refresh the Gemini tab. A green badge **`⚡ MCP Auto-Allow: ACTIVE`** will appear in the bottom right corner.
*(Tampermonkey users can alternatively install `tools/gemini-mcp-auto-allow.user.js`)*.

---

## 👥 Using with Multiple Gemini Accounts

You can connect the same running bridge to **multiple Google/Gemini accounts** (work, personal, secondary):

1. **Keep the bridge running once:** The local server and Cloudflare tunnel are active and reachable.
2. **In your second account:**
   * Sign in to [gemini.google.com](https://gemini.google.com) on the other account.
   * Go to **Connected Apps → Custom Apps**.
   * Add the exact same connector endpoints and token.
3. **Install the Auto-Allow extension** in that browser profile.
4. **Import the Notebook instructions** into that account.

Both accounts can seamlessly access your PC development environment.

---

## 🔒 Security & Privacy

* **Clean Separation:** Local configuration and tokens reside exclusively in `.local/` which is ignored by Git.
* **Token Authentication:** Every request requires your private query parameter `?token=...`. Unauthenticated requests receive `401 Unauthorized`.
* **Scoped Filesystem:** Paths outside `ALLOWED_DIRECTORIES` are strictly denied.
* **Release Verification:** `npm run release:check` audits all files to prevent credential leakage before distributing packages.

---

## 📄 License

MIT License. Dependencies and MCP servers retain their respective open-source licenses.

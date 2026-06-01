<div align="center">

# 🧾 AI Slip Manager

### *Intelligent Bank Slip OCR & Transaction Management System*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_&_Auth-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_2.5_Flash_OCR-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)

---

**AI Slip Manager** is a full-stack web application that uses **Google Gemini AI** to automatically extract structured data from Thai bank transfer slips (e-slips). Simply upload a slip image, and the AI reads it — no manual data entry needed.

[Features](#-key-features) · [Tech Stack](#-tech-stack) · [Architecture](#-system-architecture) · [Getting Started](#-getting-started) · [Environment Variables](#-environment-variables)

</div>

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI-Powered OCR** | Upload a bank slip image and **Gemini 2.5 Flash** extracts amount, date, time, sender/receiver bank, and reference number automatically |
| 🔐 **Google OAuth Login** | Secure authentication via **Supabase Auth** with Google OAuth — one-click sign-in |
| 🛡️ **Row-Level Security (RLS)** | Each user can only access their **own** transaction data, enforced at the database level |
| 📊 **Interactive Dashboard** | Real-time revenue charts and summary statistics powered by **Recharts** |
| 📋 **Transaction History** | Full searchable table of all extracted records with inline filtering |
| 📥 **CSV Export** | Export filtered transaction data to **CSV** with one click — UTF-8 BOM encoded for Excel compatibility |
| 🎨 **Modern Dark UI** | Sleek dark theme with glassmorphism effects, gradient accents, and smooth **Framer Motion** animations |
| 📱 **Fully Responsive** | Optimized layout for desktop, tablet, and mobile screens |

---

## 🛠️ Tech Stack

<table>
  <tr>
    <th align="left">Layer</th>
    <th align="left">Technology</th>
  </tr>
  <tr>
    <td><strong>Frontend</strong></td>
    <td>React 19 · Vite · Tailwind CSS · Framer Motion · Recharts · Lucide Icons</td>
  </tr>
  <tr>
    <td><strong>Backend</strong></td>
    <td>Node.js · Express 5 · Multer (file upload handling)</td>
  </tr>
  <tr>
    <td><strong>AI / OCR</strong></td>
    <td>Google Gemini 2.5 Flash via <code>@google/generative-ai</code> SDK</td>
  </tr>
  <tr>
    <td><strong>Database</strong></td>
    <td>Supabase (PostgreSQL) with Row-Level Security</td>
  </tr>
  <tr>
    <td><strong>Authentication</strong></td>
    <td>Supabase Auth · Google OAuth 2.0</td>
  </tr>
</table>

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                     │
│                                                             │
│   React 19 + Vite + Tailwind CSS                            │
│   ┌───────────┐  ┌────────────┐  ┌──────────────────────┐   │
│   │  Login    │  │  Upload    │  │  Transaction History │   │
│   │  (OAuth)  │  │  Slip Page │  │  + CSV Export        │   │
│   └─────┬─────┘  └─────┬──────┘  └──────────┬───────────┘   │
│         │              │                    │               │
│         ▼              ▼                    ▼               │
│   ┌─────────────────────────────────────────────────────┐   │
│   │             Supabase Client SDK (Auth + DB)         │   │
│   └─────────────────────┬───────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼                               ▼
┌──────────────────┐           ┌──────────────────────┐
│   Supabase       │           │  Backend API Server  │
│   (PostgreSQL)   │           │  (Express + Node.js) │
│                  │           │                      │
│  • transactions  │◄──────────│  POST /api/upload    │
│  • RLS policies  │           │  GET  /api/dashboard │
│  • Auth (Google) │           │  GET  /api/transactions│
└──────────────────┘           └──────────┬───────────┘
                                          │
                                          ▼
                               ┌──────────────────────┐
                               │  Google Gemini 2.5   │
                               │  Flash (AI OCR)      │
                               │                      │
                               │  Image → JSON data   │
                               └──────────────────────┘
```

**Flow:**
1. User signs in with **Google OAuth** through Supabase Auth
2. User uploads a bank slip image on the **Upload** page
3. The backend sends the image to **Gemini AI** for OCR extraction
4. Extracted data (amount, date, sender, etc.) is stored in **Supabase PostgreSQL**
5. The **Dashboard** displays aggregated stats & revenue charts
6. **Transaction History** lets users search, browse, and **export to CSV**

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **Supabase** project ([create one free](https://supabase.com/))
- A **Google Gemini API Key** ([get one here](https://aistudio.google.com/apikey))
- **Google OAuth** configured in your Supabase project dashboard

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/korawan006/ai-slip-manager.git
cd ai-slip-manager

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install
```

### 🔑 Environment Variables

You need to create **two** `.env` files:

#### `backend/.env`

```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here
```

#### `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

> [!NOTE]
> The backend uses the **service role key** for server-side operations, while the frontend uses the **anon key** with RLS enforcing user-level access control.

### 🗄️ Supabase Database Setup

Create a `transactions` table with the following columns:

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key, auto-generated |
| `user_id` | `uuid` | References `auth.users(id)` |
| `name` | `text` | Sender name |
| `date` | `text` | Transaction date |
| `time` | `text` | Transaction time |
| `amount` | `numeric` | Transfer amount |
| `sender_bank` | `text` | Sender bank name |
| `receiver_bank` | `text` | Receiver bank name |
| `reference_no` | `text` | Reference / tracking number |
| `created_at` | `timestamptz` | Auto-generated timestamp |

**Enable Row-Level Security (RLS)** and add a policy:

```sql
-- Users can only read their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### ▶️ Run the Application

```bash
# Terminal 1 — Start the backend
cd backend
npm run dev       # Runs on http://localhost:5000

# Terminal 2 — Start the frontend
cd frontend
npm run dev       # Runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser and sign in with Google!

---

## 📂 Project Structure

```text
ai-slip-manager/
├── backend/
│   ├── services/
│   │   ├── gemini.service.js       # Gemini AI OCR extraction
│   │   └── supabase.service.js     # Supabase DB operations
│   ├── index.js                    # Express server & API routes
│   ├── package.json
│   └── .env                        # Backend environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx          # App shell with sidebar
│   │   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   │   └── Card.jsx            # Reusable card component
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Auth state & Google OAuth
│   │   ├── lib/
│   │   │   └── supabase.js         # Supabase client instance
│   │   ├── pages/
│   │   │   ├── Login.jsx           # Google OAuth login page
│   │   │   ├── Dashboard.jsx       # Revenue stats & charts
│   │   │   ├── UploadSlip.jsx      # Slip upload with drag & drop
│   │   │   └── TransactionHistory.jsx  # Searchable table + CSV export
│   │   ├── App.jsx                 # Routes & route guards
│   │   └── main.jsx                # React entry point
│   ├── package.json
│   └── .env                        # Frontend environment variables
│
└── README.md
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

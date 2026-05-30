<div align="center">

# 🧾 AI Slip Manager

### *Intelligent Bank Slip OCR & Transaction Management System*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_&_Auth-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_2.5_Flash_OCR-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)

---

**AI Slip Manager** is a full-stack web application that uses **Google Gemini AI** to automatically extract structured data from Thai bank transfer slips (e-slips). Simply upload a slip image, and the AI reads it — no manual data entry needed.


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

# AI-Interview-Website

A complete, production-grade, end-to-end Web Platform (Admin and Candidate portals) built for the next generation of AI-driven recruitment and automated interviewing. 

This platform eliminates the mobile application dependency entirely, providing a web-first experience for candidates (selfie capture, audio recording/calibration, live proctored interview room) and admin managers (dashboards, live candidate monitoring via Socket.IO, role configuration, templates, audit log, and reporting).

## 🚀 Key Features

*   **Admin Portal**:
    *   **Real-time Dashboard**: Overview of candidate funnel, completion rate, invitations status, and integrity risks.
    *   **Candidate Management**: Add candidates, invite via email/code, track stages.
    *   **Job Roles**: Define required skills, experience levels, and assessment duration.
    *   **Live Proctoring Monitor**: Real-time Socket.IO stream monitoring candidate state (speaking, listening, tab switches, focus losses).
    *   **AI Report & Evaluation**: Multi-dimensional grading (Technical, Communication, Resume match, HR, Aptitude) and AI review release control.
    *   **Audit Logging**: Chronological record of administrative events.
*   **Candidate Portal**:
    *   **Checklist Flow**: Quick profile validation, resume parsing, identity selfie capture, system check (mic/camera permissions), and audio calibration.
    *   **Proctored Interview Room**: Fullscreen mode constraints, tab-switch monitoring, and interactive AI interviewer dialog with real-time waveform states.
    *   **Results Viewer**: View final performance scores once released by the Admin.

---

## 🛠️ Stack & Architecture

*   **Frontend**: React (Vite), React Router v6, Axios, Socket.io-client, Lucide-React, React-Webcam.
*   **Backend**: Node.js, Express, Socket.IO, Mongoose.
*   **Database**: MongoDB (via Mongoose). Operates with **MongoMemoryServer** automatic fallback if local MongoDB server is not running.
*   **AI Integration**: Orchestrated LLM interface (defaulting to Mock LLM provider for rapid development / zero API key constraints).

---

## 🏃 Run Instructions

### 1. Pre-requisites
*   [Node.js](https://nodejs.org/) (v18+ recommended)
*   NPM (v9+)

### 2. Start Backend Server
```bash
cd backend
npm install
npm run dev
```
*The server will automatically fall back to MongoMemoryServer and seed the initial admin account, default job roles, templates, and campaigns.*

*   **API URL**: `http://localhost:4000`
*   **Health Check**: `http://localhost:4000/api/health`

### 3. Start Frontend App
```bash
cd frontend
npm install
npm run dev
```
*   **Frontend URL**: `http://localhost:5173`

---

## 🔑 Login & Test Credentials

### Admin Login
*   **URL**: `http://localhost:5173/admin/login`
*   **Email**: `admin@aiinterview.com`
*   **Password**: `AdminPassword123!`

### Candidate Flow
1. Login to the **Admin Portal** using the credentials above.
2. Go to **Candidates** -> click **Add Candidate**.
3. Select a Job Role (e.g. `Software Engineer (Frontend)`) and submit.
4. Copy the generated **Invitation Code** (e.g. `AIP-XXXX-XXXX`) or **Secure Link**.
5. Log out or open a private window, go to `http://localhost:5173/interview`, enter the code, and walk through the candidate verification and live interview room.
# AI_Interview_Platform

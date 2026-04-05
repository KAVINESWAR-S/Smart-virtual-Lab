# 🔬 Smart Virtual Lab

A comprehensive full-stack web platform that digitises science laboratory education. Teachers create virtual circuit experiments with quizzes, students build and simulate circuits on a drag-and-drop canvas, and administrators manage the entire ecosystem — all through a single, modern web application.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Live Architecture](#-live-architecture)
- [Complete Feature List](#-complete-feature-list)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Models](#-database-models)
- [API Reference](#-api-reference)
- [Circuit Simulator Engine](#-circuit-simulator-engine)
- [Authentication & Security](#-authentication--security)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Scripts](#-scripts)
- [Contributing](#-contributing)

---

## 🌟 Overview

Smart Virtual Lab bridges the gap between physical lab sessions and remote learning. The platform revolves around **three user roles** — *Student*, *Teacher*, and *Admin* — each with a dedicated dashboard and tailored capabilities.

### Core Workflow

1. **Admin** creates Teacher accounts and manages the platform.
2. **Teacher** creates a Classroom (experiment) with aim, procedure, components, quiz, and optional simulation.
3. **Student** joins a classroom via a unique 6-character code, performs the experiment, takes the quiz, and submits their work.
4. **Teacher** reviews submissions, views circuit metrics, and grades student work with feedback.

---

## 🏗 Live Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                    │
│  ┌──────────┐ ┌──────────────┐ ┌───────────┐ ┌─────────────┐  │
│  │  Login/  │ │   Student    │ │  Teacher  │ │    Admin    │  │
│  │ Register │ │  Dashboard   │ │ Dashboard │ │  Dashboard  │  │
│  └──────────┘ └──────────────┘ └───────────┘ └─────────────┘  │
│  ┌──────────────────┐ ┌──────────────┐ ┌───────────────────┐  │
│  │  Experiment Page  │ │Free Simulator│ │  Share Circuit    │  │
│  │ (Aim/Proc/Sim/Q) │ │  Playground  │ │  (Read-only View) │  │
│  └──────────────────┘ └──────────────┘ └───────────────────┘  │
│                 Simulation Engine (Client-side)                 │
└───────────────────────────┬────────────────────────────────────┘
                            │  REST API (Axios)
┌───────────────────────────▼────────────────────────────────────┐
│                Backend (Node.js + Express)                      │
│  ┌────────┐ ┌─────────┐ ┌───────────┐ ┌──────────┐ ┌────────┐│
│  │  Auth  │ │  Admin  │ │ Classroom │ │Submission│ │Circuit ││
│  │ Routes │ │ Routes  │ │  Routes   │ │  Routes  │ │ Routes ││
│  └────────┘ └─────────┘ └───────────┘ └──────────┘ └────────┘│
│  ┌────────────────────┐ ┌──────────────────────────────────┐  │
│  │  Auth Middleware    │ │  Circuit Metrics Engine          │  │
│  │ (JWT + Role Guards)│ │  (Server-side DFS Evaluation)    │  │
│  └────────────────────┘ └──────────────────────────────────┘  │
└───────────────────────────┬────────────────────────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │   MongoDB Atlas   │
                  │  (5 Collections)  │
                  └───────────────────┘
```

---

## ✨ Complete Feature List

### 🔐 Authentication & Account Management

| Feature | Description |
|---|---|
| **Student Self-Registration** | Students register with name, email, password, department, and year. Role is auto-set to `student`. |
| **Login with JWT** | Email/password login returning a JSON Web Token valid for 30 days. |
| **Role-Based Access Control** | Four middleware guards: `protect`, `teacherOnly`, `adminOnly`, `adminOrTeacher`. |
| **Protected Routes (Frontend)** | `ProtectedRoute` component checks authentication and role before rendering any page. |
| **First-Login Password Change** | Admin-created accounts are flagged `isFirstLogin: true`. Users must change password on first login. |
| **Change Password** | Authenticated users can change their password with current password verification. |
| **Password Reset Request** | Students can submit a password reset request to the admin (one pending request at a time). |
| **Admin Password Reset** | Admin can force-reset any user's password. |
| **Password Request Workflow** | Full lifecycle: `pending` → `approved` / `rejected` → `resolved`. |

---

### 👨‍🎓 Student Features

| Feature | Description |
|---|---|
| **Student Dashboard** | Personalized view showing joined classrooms, experiments, and submission history. |
| **Join Classroom** | Enter a unique 6-character classroom code to join an experiment. |
| **Experiment Page** | Tabbed interface with **Aim**, **Components Required**, **Procedure**, **Simulation**, and **Quiz** sections. |
| **Drag-and-Drop Circuit Simulator** | Build circuits using ReactFlow with a palette of electronic components. |
| **Real-Time Circuit Simulation** | Client-side simulation engine computes voltage, current, resistance, LED states, and detects faults. |
| **Interactive Switches** | Toggle switches on/off to observe circuit behavior changes in real time. |
| **Adjustable Battery Voltage** | Dynamic voltage slider to change supply voltage and see effects on current/LED brightness. |
| **LED Brightness Physics** | LEDs render with intensity proportional to current. Three states: `off`, `on` (with variable brightness), `blast` (over-current). |
| **Ammeter & Voltmeter Readings** | Virtual instruments display real-time current / voltage measurements. |
| **Quiz Attempt** | MCQ quiz with score tracking. Quiz scores stored per submission. |
| **Attempt Limiting** | Teachers can set `attemptLimit`. System tracks `attemptsUsed` and blocks re-submissions beyond the limit. |
| **Export Lab Report as PDF** | Generate a complete PDF lab report (jsPDF) with experiment details, circuit data, and submission info. |
| **Free Simulator Playground** | Open-ended circuit simulator independent of any classroom assignment. |
| **Save / Load Circuits** | Persist circuit states to the database. Load previously saved circuits from a dropdown. |
| **Share Circuits** | Generate a unique shareable URL (base64url). Link copies to clipboard automatically. |
| **View Shared Circuits** | Public read-only view at `/share/circuit/:shareId` — no login required. |
| **View Grades & Feedback** | See teacher-provided grades and feedback on each submission. |

---

### 👨‍🏫 Teacher Features

| Feature | Description |
|---|---|
| **Teacher Dashboard** | Overview of classrooms created, student enrollments, and submission stats. |
| **Create Classroom (Experiment)** | Define experiment with: name, aim, procedure (step-by-step), components list, quiz questions, due date, attempt limit, grading rubric, and simulation toggle. |
| **Auto-Generated Classroom Code** | Unique 6-character alphanumeric code generated per classroom. |
| **PDF Upload for Experiment** | Upload a PDF to auto-extract Aim, Components, and Procedure using regex-based text parsing (`pdf-parse` + `multer`). |
| **Add Quiz Questions** | Create multiple-choice quiz questions with options and correct answer. Delete individual questions. |
| **Set Due Date** | Calendar date picker for experiment submission deadline. |
| **Set Attempt Limit** | Restrict how many times a student can resubmit. |
| **Grading Rubric** | Define custom grading criteria stored as a JSON object. |
| **Toggle Simulation** | Enable or disable the circuit simulation tab per experiment. |
| **View Student Submissions** | Browse all student submissions for any classroom, with filtering by classroom or experiment title. |
| **View Individual Submission** | Inspect a student's circuit data, quiz score, metrics snapshot, and attempt history. |
| **Grade Submission** | Assign a numerical grade and write text feedback for each submission. |
| **View Circuit Metrics** | Server-side circuit analysis (DFS path finding) generates metrics snapshot for each submission: total resistance, current, voltage drops, closed loop detection, short circuit detection. |
| **View Student List** | See all students enrolled in each classroom. |

---

### 🛡️ Admin Features

| Feature | Description |
|---|---|
| **Admin Dashboard** | Platform-wide management panel with tabs for users and password requests. |
| **Create Teacher / Admin Accounts** | Onboard teachers or additional admins with forced first-login password change. |
| **View All Users** | List of every user in the system (excluding passwords). |
| **Delete User** | Remove any user account from the platform. |
| **Force Password Reset** | Directly set a new password for any user. |
| **Password Reset Requests** | View all pending student password reset requests (filtered to students only). |
| **Approve / Reject Requests** | Update request status to `approved` (student sees prompt to change password) or `rejected`. |
| **View All Classrooms** | Admin sees every classroom across all teachers. |
| **View All Submissions** | Full access to every submission on the platform. |

---

### ⚡ Circuit Simulator — Supported Components

| Component | Type | Behavior |
|---|---|---|
| **Battery** | Power Source | Configurable voltage (default 9V). Positive & Negative terminals. |
| **Resistor** | Passive | Configurable resistance (default 350Ω). V = IR drop computed. |
| **Rheostat** | Variable Passive | Adjustable resistance (default 500Ω). |
| **LED** | Output | 2V or 5V forward voltage. Brightness tracks current (off / on / blast). |
| **Switch** | Control | Toggle on/off. Open switch breaks circuit path. |
| **Diode** | Passive | Forward voltage drop (default 0.7V). Blocks reverse current. Polarity-aware. |
| **Capacitor** | Reactive | Blocks DC current in simulator (open circuit in DC analysis). |
| **Inductor** | Reactive | Ideal behavior (0Ω resistance in DC). |
| **Ammeter** | Instrument | Displays total current (amperes) through its branch. Ideal (0Ω). |
| **Voltmeter** | Instrument | Displays voltage difference across two connected nodes. |
| **AND Gate** | Logic | Digital output = A AND B. |
| **OR Gate** | Logic | Digital output = A OR B. |
| **NOT Gate** | Logic | Digital output = NOT Input. |

---

### 🔧 Simulation Engine Details

The client-side simulation engine (`simulationEngine.js`, ~380 lines) runs entirely in the browser:

1. **Digital Logic Propagation** — Iterative signal propagation (up to 15 iterations) through logic gates and passive components until stable state.
2. **Analog Circuit Analysis (DFS)** — Finds all closed-loop paths from Battery(+) → components → Battery(−). Computes:
   - Total resistance per path
   - Current per path (V = IR, with LED and diode voltage drops)
   - Short circuit detection (zero resistance with positive voltage)
   - Open switch detection (path termination)
   - Diode polarity validation (reverse-biased ⇒ zero current)
   - Capacitor DC-blocking behavior
3. **Node Voltage Estimation** — Tracks voltage at each node along each path. Feeds voltmeter readings.
4. **LED State Computation** — Three states based on current:
   - `off`: current ≤ 1mA
   - `on`: 1mA < current ≤ 40mA (brightness proportional to current)
   - `blast`: current > 40mA (overcurrent warning)
5. **Ammeter Current Summation** — Aggregates current from all paths passing through the ammeter.
6. **Voltmeter Reading** — Computes voltage difference between its two connection points.
7. **Hybrid Digital/Analog** — Backward tracing determines if an LED's input came from a logic gate (digital) or a battery circuit (analog), preventing false illumination from unconnected analog signals.

**Server-Side Metrics** (`circuitMetrics.js`) mirrors the analog DFS analysis to compute a `metricsSnapshot` for grading purposes on every submission. Also includes a `gradeCircuit()` function with scoring criteria:
- Closed loop: 5 pts
- No short circuit: 2 pts
- Has resistor: 1 pt
- Has LED: 1 pt
- Current within target range: 1 pt

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | ^19.2.0 | UI framework |
| Vite | ^7.2.4 | Build tool & dev server |
| React Router DOM | ^7.13.0 | Client-side routing |
| Tailwind CSS | ^3.4.17 | Utility-first styling |
| Framer Motion | ^12.30.0 | Page transitions & animations |
| ReactFlow | ^11.11.4 | Drag-and-drop circuit canvas |
| Axios | ^1.13.4 | HTTP client for API calls |
| React Hook Form | ^7.71.1 | Form state management & validation |
| React Hot Toast | ^2.6.0 | Notification toasts |
| jsPDF | ^4.2.0 | PDF generation (lab reports) |
| jsPDF-AutoTable | ^5.0.7 | Table formatting in PDFs |
| pdfjs-dist | ^5.5.207 | Client-side PDF text extraction |
| React Icons | ^5.5.0 | Icon library (FontAwesome etc.) |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js + Express | ^4.22.1 | REST API server |
| MongoDB + Mongoose | ^8.23.0 | NoSQL database & ODM |
| JSON Web Tokens | ^9.0.3 | Stateless authentication |
| bcryptjs | ^2.4.3 | Password hashing (10 salt rounds) |
| Multer | ^2.1.1 | Multipart file upload handling |
| pdf-parse | ^2.4.5 | Server-side PDF text extraction |
| dotenv | ^16.6.1 | Environment variable management |
| Nodemon | ^3.1.14 | Auto-restart during development |

---

## 📁 Project Structure

```
Smart-virtual-Lab/
│
├── Backend/
│   ├── config/                      # Database / app configuration
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT verify, role guards (protect, teacherOnly, adminOnly, adminOrTeacher)
│   ├── models/
│   │   ├── User.js                  # User schema (student/teacher/admin), password hashing
│   │   ├── Classroom.js             # Experiment definition, quiz, components, procedure
│   │   ├── Submission.js            # Student submissions with circuit data, quiz score, grades
│   │   ├── Circuit.js               # Saved/shared circuit states (ReactFlow JSON)
│   │   └── PasswordRequest.js       # Password reset request lifecycle
│   ├── routes/
│   │   ├── auth.js                  # Register, login, profile, password change, password requests
│   │   ├── admin.js                 # User CRUD, password force-reset, request management
│   │   ├── classroom.js             # Classroom CRUD, join, PDF extraction
│   │   ├── submission.js            # Submit, grade, list, filter submissions
│   │   └── circuit.js               # Save, load, list, share circuits
│   ├── utils/
│   │   └── circuitMetrics.js        # Server-side DFS circuit analysis & grading
│   └── server.js                    # Express entry point, MongoDB connection, route mounting
│
├── Front-end/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js            # Axios instance & auth header helper
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx        # Glassmorphism login page
│   │   │   │   └── Register.jsx     # Matching registration page
│   │   │   ├── common/
│   │   │   │   └── Navbar.jsx       # Top navigation bar
│   │   │   ├── dashboard/
│   │   │   │   ├── AdminDashboard.jsx    # Admin panel (users, password requests)
│   │   │   │   ├── TeacherDashboard.jsx  # Teacher panel (classrooms, submissions, grading)
│   │   │   │   └── StudentDashboard.jsx  # Student panel (joined classrooms, experiments)
│   │   │   ├── experiment/
│   │   │   │   ├── Aim.jsx               # Experiment aim display
│   │   │   │   ├── ComponentsRequired.jsx # Components list display
│   │   │   │   ├── Procedure.jsx         # Step-by-step procedure display
│   │   │   │   ├── Simulation.jsx        # Simulation wrapper (runs engine, shows metrics)
│   │   │   │   ├── Quiz.jsx              # MCQ quiz with scoring & submission
│   │   │   │   └── Simulator/
│   │   │   │       ├── Simulator.jsx     # ReactFlow canvas + save/load/share logic
│   │   │   │       ├── CustomNodes.jsx   # Visual definitions for all circuit components
│   │   │   │       └── ComponentPalette.jsx # Draggable component toolbox
│   │   │   ├── profile/                  # User profile & security settings
│   │   │   ├── Header.jsx                # Page header
│   │   │   ├── Sidebar.jsx               # Experiment page tab navigation
│   │   │   └── ExperimentCard.jsx        # Card component for experiment listings
│   │   ├── context/
│   │   │   └── AuthContext.jsx           # React context for auth state (login, logout, user)
│   │   ├── data/                         # Static/seed data
│   │   ├── pages/
│   │   │   ├── ExperimentPage.jsx        # Full experiment view (Aim → Simulation → Quiz → PDF)
│   │   │   ├── FreeSimulator.jsx         # Standalone circuit playground (save/load/share)
│   │   │   └── ShareCircuit.jsx          # Public read-only shared circuit view
│   │   ├── utils/
│   │   │   ├── simulationEngine.js       # Client-side analog + digital circuit solver (~380 LOC)
│   │   │   └── labReportPdf.js           # PDF lab report generator (jsPDF)
│   │   ├── Styles/                       # Custom CSS styles
│   │   ├── App.jsx                       # Route definitions & ProtectedRoute
│   │   ├── main.jsx                      # React entry point
│   │   └── index.css                     # Global styles
│   ├── index.html                        # HTML entry point
│   ├── vite.config.js                    # Vite configuration
│   ├── tailwind.config.js                # Tailwind CSS configuration
│   ├── postcss.config.js                 # PostCSS configuration
│   ├── eslint.config.js                  # ESLint configuration
│   └── vercel.json                       # SPA rewrite rules for Vercel deployment
│
└── package.json                          # Root-level dependencies (optional)
```

---

## 🗄 Database Models

### User
| Field | Type | Description |
|---|---|---|
| `name` | String | Full name (required) |
| `email` | String | Unique email (required) |
| `password` | String | Bcrypt-hashed password (required) |
| `role` | Enum | `student` / `teacher` / `admin` (default: `student`) |
| `department` | String | Academic department |
| `year` | String | Year of study |
| `studentClass` | String | Class identifier |
| `isFirstLogin` | Boolean | Forces password change on first login |
| `classroomsJoined` | [ObjectId] | References to joined classrooms |

### Classroom (Experiment)
| Field | Type | Description |
|---|---|---|
| `name` | String | Experiment / classroom name (required) |
| `teacher` | ObjectId → User | Creator of the classroom |
| `students` | [ObjectId → User] | Enrolled student list |
| `code` | String | Unique 6-char join code |
| `aim` | String | Experiment objective |
| `procedure` | [String] | Step-by-step instructions |
| `components` | [String] | Required component names |
| `quiz` | [{question, options[], answer}] | MCQ quiz questions |
| `dueAt` | Date | Submission deadline |
| `attemptLimit` | Number | Max resubmission count (null = unlimited) |
| `gradingRubric` | Object | Custom grading criteria (JSON) |
| `simulationEnabled` | Boolean | Show/hide simulation tab |

### Submission
| Field | Type | Description |
|---|---|---|
| `student` | ObjectId → User | Submitting student |
| `classroom` | ObjectId → Classroom | Associated classroom |
| `experimentTitle` | String | Experiment name |
| `circuitData` | Object | ReactFlow JSON (nodes + edges) |
| `quizScore` | Number | Quiz mark |
| `grade` | Number | Teacher-assigned grade |
| `feedback` | String | Teacher feedback text |
| `metricsSnapshot` | Object | Server-generated circuit analysis |
| `attemptsUsed` | Number | Total resubmission count |
| `lastAttemptAt` | Date | Timestamp of last attempt |

### Circuit
| Field | Type | Description |
|---|---|---|
| `owner` | ObjectId → User | Circuit owner |
| `title` | String | Circuit name |
| `circuitData` | Object | ReactFlow JSON (nodes + edges) |
| `isPublic` | Boolean | Whether circuit is shareable |
| `shareId` | String | Unique URL-safe share identifier |

### PasswordRequest
| Field | Type | Description |
|---|---|---|
| `user` | ObjectId → User | Requesting user |
| `status` | Enum | `pending` → `approved` / `rejected` → `resolved` |

---

## 📡 API Reference

Base URL: `/api`

### Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register a new student account |
| `POST` | `/login` | Public | Login and receive JWT (30-day expiry) |
| `GET` | `/me` | Private | Get current user profile (no password) |
| `POST` | `/change-password` | Private | Verify current password and set new one. Clears `isFirstLogin` flag. Resolves approved password requests. |
| `POST` | `/password-request` | Private | Create a password reset request (blocks duplicates) |
| `GET` | `/password-request/status` | Private | Check if there's an active pending/approved request |

### Admin — `/api/admin`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/users` | Admin | List all users (no passwords) |
| `POST` | `/users` | Admin | Create teacher or admin account (sets `isFirstLogin`) |
| `DELETE` | `/users/:id` | Admin | Delete a user |
| `PUT` | `/users/:id/password` | Admin | Force-reset a user's password |
| `GET` | `/password-requests` | Admin | List all pending student password reset requests |
| `PUT` | `/password-requests/:id` | Admin | Update request status (approve/reject) |

### Classrooms — `/api/classrooms`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/` | Teacher | Create experiment with aim, procedure, components, quiz, due date, attempt limit, grading rubric |
| `GET` | `/` | Private | List classrooms (admin: all, teacher: own, student: joined) |
| `POST` | `/join` | Student | Join a classroom via 6-char code |
| `GET` | `/:id` | Private | Get classroom details (with access verification). Populates student and teacher names. |
| `POST` | `/extract-pdf` | Teacher | Upload PDF → extract aim, components, procedure via regex parsing |

### Submissions — `/api/submissions`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/` | Student | Submit circuit data and/or quiz score. Supports upsert: updates existing submission or creates new. Enforces attempt limits. Computes server-side circuit metrics. |
| `GET` | `/my` | Student | List own submissions (newest first) |
| `GET` | `/student/:studentId` | Teacher | List submissions by a specific student |
| `GET` | `/` | Teacher/Admin | List all submissions (filterable by `classroomId` or `experimentTitle`) |
| `GET` | `/:id` | Private | Get single submission (students can only view their own) |
| `PUT` | `/:id/grade` | Teacher | Assign grade and feedback to a submission |

### Circuits — `/api/circuits`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/` | Private | Save a new circuit (title + ReactFlow JSON) |
| `GET` | `/my` | Private | List own saved circuits (newest first) |
| `GET` | `/:id` | Private | Load a specific circuit (owner only) |
| `GET` | `/share/:shareId` | **Public** | Load a shared circuit (read-only, no auth needed) |
| `POST` | `/:id/share` | Private | Enable sharing: generates a unique `shareId`. Supports `rotate` (new link) and `enabled: false` (disable). |

---

## 🔐 Authentication & Security

| Layer | Implementation |
|---|---|
| **Password Storage** | `bcryptjs` with 10 salt rounds. Automatic hashing via Mongoose `pre('save')` hook. |
| **Token Format** | `Bearer <JWT>` in `Authorization` header. |
| **Token Lifetime** | 30 days. |
| **Token Payload** | `{ id: userId }` signed with `JWT_SECRET`. |
| **Middleware Guards** | `protect` (JWT verify) → `teacherOnly` / `adminOnly` / `adminOrTeacher` (role check). |
| **Frontend Guards** | `ProtectedRoute` component wraps routes. Redirects to `/login` if unauthenticated, redirects to `/` if wrong role. |
| **Auth Context** | React Context (`AuthContext`) stores user object (including token) in localStorage. Provides `login()`, `logout()`, and `user` state. |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (or local MongoDB)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Smart-virtual-Lab.git
cd Smart-virtual-Lab
```

### 2. Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file (see [Environment Variables](#-environment-variables)):

```bash
npm run dev     # Starts with Nodemon on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd Front-end
npm install
npm run dev     # Starts Vite on http://localhost:5173
```

---

## 🔐 Environment Variables

Create `Backend/.env`:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
```

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `PORT` | Backend port (default: 5000) |

> **Note:** The backend sets custom DNS servers (`8.8.8.8`, `8.8.4.4`, `1.1.1.1`) to resolve MongoDB Atlas SRV records, bypassing potential ISP DNS issues.

---

## 🌐 Deployment

### Frontend → Vercel

```json
// vercel.json — already included in Front-end/
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

1. Push `Front-end` to GitHub.
2. Import into [Vercel](https://vercel.com).
3. Set **Root Directory** to `Front-end`.
4. Add environment variable `VITE_API_URL` pointing to your deployed backend URL.
5. Deploy.

### Backend → Railway / Render / Any Node Host

1. Push `Backend` to your hosting provider.
2. Set environment variables: `MONGO_URI`, `JWT_SECRET`, `PORT`.
3. Start command: `npm start`.

---

## 📜 Scripts

### Backend (`Backend/`)

| Command | Description |
|---|---|
| `npm start` | Start production server (`node server.js`) |
| `npm run dev` | Start development server with auto-restart (`nodemon server.js`) |

### Frontend (`Front-end/`)

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (HMR enabled) |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

<div align="center">
  <strong>Made with ❤️ for smarter, connected classrooms.</strong>
</div>

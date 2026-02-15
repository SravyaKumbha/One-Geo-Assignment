# OneGeo - Well Log Data Visualization & AI Analysis

A full-stack web application that ingests LAS (Log ASCII Standard) files, stores and parses well-log data, visualizes curves interactively, and provides AI-assisted geological interpretation using Google Gemini. Features a real-time chatbot interface for querying well data.

Deployment link: https://well-data-analyzer-frontend-uifv.vercel.app/

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Tech Stack](#tech-stack)
- [Installation & Setup](#installation--setup)
  - [Step 1: Install Node.js](#step-1-install-nodejs)
  - [Step 2: Install PostgreSQL](#step-2-install-postgresql)
  - [Step 3: Clone Repository](#step-3-clone-repository)
  - [Step 4: Backend Setup](#step-4-backend-setup)
  - [Step 5: Frontend Setup](#step-5-frontend-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Features](#features)
- [Project Structure](#project-structure)
- [Libraries & Dependencies](#libraries--dependencies)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.x or higher)
- **PostgreSQL** (v14.x or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)
- **AWS Account** (for S3 storage - optional, can work without it)
- **Google Gemini API Key** (from [Google AI Studio](https://makersuite.google.com/app/apikey))

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, React Router, Plotly.js, Axios |
| **Backend** | Node.js, Express 5, Sequelize ORM |
| **Database** | PostgreSQL (with JSONB for flexible data storage) |
| **Storage** | Amazon S3 (for original LAS files) |
| **AI/LLM** | Google Gemini 2.0 Flash |
| **Real-time** | WebSockets (ws library) |
| **Authentication** | JWT (JSON Web Tokens) |

---

## Installation & Setup

### Step 1: Install Node.js

#### For Windows:

1. Visit [Node.js official website](https://nodejs.org/)
2. Download the **LTS (Long Term Support)** version for Windows
3. Run the installer (`.msi` file)
4. Follow the installation wizard (accept defaults)
5. Verify installation by opening **Command Prompt** or **PowerShell**:
   ```bash
   node --version
   npm --version
   ```
   You should see version numbers (e.g., `v18.17.0` and `9.6.7`)

#### For macOS/Linux:

**macOS (using Homebrew):**
```bash
brew install node
```

**macOS (using official installer):**
1. Visit [Node.js official website](https://nodejs.org/)
2. Download the **LTS** version for macOS
3. Run the installer (`.pkg` file)
4. Follow the installation wizard
5. Verify installation:
   ```bash
   node --version
   npm --version
   ```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Linux (using package manager):**
```bash
sudo apt update
sudo apt install nodejs npm
```

Verify installation:
```bash
node --version
npm --version
```

---

### Step 2: Install PostgreSQL

#### For Windows:

1. Visit [PostgreSQL download page](https://www.postgresql.org/download/windows/)
2. Download the **Windows installer** from EnterpriseDB
3. Run the installer
4. During installation:
   - Remember the **password** you set for the `postgres` user
   - Default port is `5432` (keep it)
   - Install **pgAdmin** (optional but recommended)
5. Verify installation:
   ```bash
   psql --version
   ```

#### For macOS:

**Using Homebrew:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Using official installer:**
1. Visit [PostgreSQL download page](https://www.postgresql.org/download/macosx/)
2. Download and run the installer
3. Follow the installation wizard
4. Remember the password for `postgres` user

#### For Linux (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Create database:**
```bash
sudo -u postgres psql
CREATE DATABASE onegeo;
\q
```

---

### Step 3: Clone Repository

```bash
git clone https://github.com/SravyaKumbha/One-Geo-Assignment.git
cd One-Geo-Assignment
```

---

### Step 4: Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   This will install all required packages listed in `package.json`.

3. **Create environment file:**
   Create a file named `.env` in the `backend` directory:
   ```bash
   # Windows (Command Prompt)
   type nul > .env
   
   # Windows (PowerShell)
   New-Item -ItemType File -Name .env
   
   # macOS/Linux
   touch .env
   ```

4. **Configure environment variables:**
   Open `.env` and add the following (see [Environment Variables](#environment-variables) section for details):
   ```env
   PORT=5000
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/onegeo
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   S3_BUCKET_NAME=your_s3_bucket_name
   GEMINI_API_KEY=your_gemini_api_key
   ```

5. **Create PostgreSQL database:**
   ```bash
   # Windows (Command Prompt)
   psql -U postgres -c "CREATE DATABASE onegeo;"
   
   # macOS/Linux
   createdb onegeo
   # OR
   psql -U postgres -c "CREATE DATABASE onegeo;"
   ```

6. **Start the backend server:**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

   You should see:
   ```
   Connected to PostgreSQL via Sequelize
   Database models synchronized
   Server running on http://localhost:5000
   WebSocket chat available at ws://localhost:5000/ws/chat
   ```

---

### Step 5: Frontend Setup

1. **Open a new terminal window** (keep backend running in the first terminal)

2. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```
   This may take a few minutes as it installs React and all dependencies.

4. **Create environment file:**
   ```bash
   # Windows (Command Prompt)
   type nul > .env
   
   # Windows (PowerShell)
   New-Item -ItemType File -Name .env
   
   # macOS/Linux
   touch .env
   ```

5. **Configure environment variables:**
   Open `.env` in the `frontend` directory and add:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_WS_URL=ws://localhost:5000/ws/chat
   ```

6. **Start the frontend development server:**
   ```bash
   npm start
   ```

   The React app will automatically open in your browser at `http://localhost:3000` (or another port if 3000 is busy).

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@host:port/database` |
| `JWT_SECRET` | Secret key for JWT tokens | `your_random_secret_key_here` |
| `JWT_EXPIRES_IN` | JWT token expiration time | `7d` |
| `AWS_REGION` | AWS region for S3 | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key ID | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `S3_BUCKET_NAME` | S3 bucket name | `onegeo-las-files` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |

**Note:** If you don't have AWS credentials, the app will still work but won't store original LAS files in S3. The database will still store all parsed data.

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `REACT_APP_WS_URL` | WebSocket URL for chat | `ws://localhost:5000/ws/chat` |

---

## Running the Application

### Development Mode

1. **Start Backend** (Terminal 1):
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm start
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - Health Check: http://localhost:5000/api/health

### Production Build

**Build frontend:**
```bash
cd frontend
npm run build
```

This creates an optimized production build in the `frontend/build` directory.

---

## Features

1. **File Ingestion**
   - Drag-and-drop LAS file upload
   - Automatic parsing of LAS 2.0 format
   - Storage in Amazon S3 (optional)
   - Database storage of parsed data

2. **Well Management**
   - Browse all uploaded wells
   - View well metadata (name, field, company, location, etc.)
   - Delete wells and associated data

3. **Curve Selection**
   - View all available curves for a well
   - Search and filter curves
   - Select up to 8 curves for visualization

4. **Interactive Visualization**
   - Plotly.js charts with zoom, pan, and hover tooltips
   - Side-by-side curve panels (depth on Y-axis)
   - Adjustable depth range with sliders

5. **AI-Assisted Interpretation**
   - Gemini-powered analysis of selected curves
   - Trend detection and anomaly identification
   - Zone classification and cross-curve correlations
   - Actionable recommendations

6. **Real-time Chatbot Interface**
   - WebSocket-based conversational AI
   - Select any well and chat about the data
   - Ask questions about curves, statistics, trends
   - Maintains conversation context

---

## Project Structure

```
One-Geo-Assignment/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express + WebSocket server entry point
│   │   ├── config/
│   │   │   ├── db.js             # Sequelize database configuration
│   │   │   └── s3.js             # AWS S3 client configuration
│   │   ├── models/
│   │   │   ├── index.js          # Model associations and database sync
│   │   │   ├── User.js           # User model (authentication)
│   │   │   ├── Well.js           # Well model
│   │   │   ├── Curve.js          # Curve model
│   │   │   └── LogData.js        # LogData model (JSONB storage)
│   │   ├── routes/
│   │   │   ├── auth.js           # Authentication routes (signup/login)
│   │   │   ├── upload.js         # LAS file upload and parsing
│   │   │   ├── wells.js          # Well CRUD operations
│   │   │   ├── curves.js         # Curve listing
│   │   │   ├── data.js           # Data retrieval by depth range
│   │   │   └── interpret.js       # AI interpretation endpoint
│   │   ├── handlers/
│   │   │   └── chatHandler.js   # WebSocket chat handler
│   │   ├── services/
│   │   │   ├── lasParser.js     # LAS 2.0 file parser
│   │   │   ├── s3Service.js     # S3 upload/download operations
│   │   │   ├── geminiService.js # Gemini AI for interpretation
│   │   │   └── chatService.js   # Chat service for well Q&A
│   │   └── middleware/
│   │       ├── auth.js          # JWT authentication middleware
│   │       └── errorHandler.js  # Global error handler
│   ├── package.json
│   └── .env                      # Environment variables (create this)
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── index.js              # React entry point
│   │   ├── App.js                # Main app component with routing
│   │   ├── components/
│   │   │   ├── Layout.jsx        # App layout with header
│   │   │   ├── AuthPage.jsx      # Login/signup page
│   │   │   ├── FileUpload.jsx    # LAS file upload component
│   │   │   ├── WellSelector.jsx # Well selection dropdown
│   │   │   ├── CurveSelector.jsx # Curve selection with search
│   │   │   ├── DepthRangeSlider.jsx # Depth range controls
│   │   │   ├── ChartPanel.jsx    # Plotly.js visualization
│   │   │   ├── AIInterpretation.jsx # AI analysis component
│   │   │   └── ChatInterface.jsx # WebSocket chat UI
│   │   ├── services/
│   │   │   └── api.js            # Axios API client with interceptors
│   │   └── styles/
│   │       └── App.css           # Global styles
│   ├── package.json
│   └── .env                      # Environment variables (create this)
│
├── Well_Data (las).las           # Sample LAS file
└── README.md                      # This file
```

---

## Libraries & Dependencies

### Backend Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web framework for Node.js |
| `sequelize` | ORM for PostgreSQL |
| `pg` | PostgreSQL client for Node.js |
| `jsonwebtoken` | JWT token generation and verification |
| `bcryptjs` | Password hashing |
| `multer` | File upload handling |
| `@aws-sdk/client-s3` | AWS S3 SDK for file storage |
| `@google/generative-ai` | Google Gemini AI SDK |
| `ws` | WebSocket server implementation |
| `cors` | Cross-Origin Resource Sharing middleware |
| `dotenv` | Environment variable management |

### Frontend Dependencies

| Package | Purpose |
|---------|---------|
| `react` | UI library |
| `react-dom` | React DOM renderer |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client for API calls |
| `react-plotly.js` | Plotly.js wrapper for React |
| `plotly.js` | Interactive charting library |
| `react-markdown` | Markdown rendering for AI responses |
| `react-icons` | Icon library (Fi, Io, Fa icons) |
| `react-scripts` | Create React App build tools |

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/auth/signup` | User registration |
| `POST` | `/api/auth/login` | User authentication |

### Protected Endpoints (Require JWT Token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload LAS file |
| `GET` | `/api/wells` | List all wells |
| `GET` | `/api/wells/:id` | Get well details |
| `DELETE` | `/api/wells/:id` | Delete a well |
| `GET` | `/api/wells/:id/curves` | List curves for a well |
| `GET` | `/api/wells/:id/data` | Get data for curves in depth range |
| `POST` | `/api/interpret` | AI interpretation |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `ws://localhost:5000/ws/chat?token=JWT` | Real-time chat with AI about well data |

---




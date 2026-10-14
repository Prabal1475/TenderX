# TenderX: AI-Powered Tender Management Platform (MVP)

> **Enterprise-grade tender discovery, qualification analysis, and proposal drafting platform tailored for Indian Government procurement (GeM & CPPP).**

---

## 🏛️ Overview

**TenderX** solves the friction of Indian public procurement by unifying tender discovery from the **Government e-Marketplace (GeM)** and the **Central Public Procurement Portal (CPPP)** with local-first AI intelligence. It helps organizations:
1. **Maintain Company Qualifications**: Turnover, net worth, PAN, GSTIN, and MSME/Udyam registrations.
2. **Discover & Filter Indian Tenders**: Filter by portal (GeM/CPPP), category (Goods/Services/Works), value in INR Crores/Lakhs, and deadline urgency.
3. **Analyze Qualification (Hybrid AI Matching)**: Evaluate hard eligibility gates (3-year average turnover, experience years, MSME relaxations) and semantic vector similarity using **pgvector**.
4. **Maintain a Document Vault**: Store credentials, work completion certificates, and audited balance sheets with semantic text search.
5. **Draft Proposals via RAG in Bid Studio**: Retrieve relevant credential citations and draft clause-by-clause compliance statements, cover letters, and technical bids with human-in-the-loop review.
6. **Track Deadlines & Milestones**: Manage EMD payments, pre-bid meeting clarifications, and submission deadlines.

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Backend Framework** | **FastAPI (Python 3.11)** | High-performance asynchronous API, auto Swagger/OpenAPI docs, Pydantic v2 schemas. |
| **Database & Vectors** | **PostgreSQL 16 + pgvector** | Unified relational and vector database with ACID compliance and native cosine distance (`<=>`). |
| **ORM & Migrations** | **SQLAlchemy 2.0 & Alembic** | Type-safe declarative models with automated migration generation. |
| **AI / Embeddings** | **FastEmbed / Sentence-Transformers** | Local 384-dimensional dense vectors (`BAAI/bge-small-en-v1.5`) with zero cloud cost and offline fallback. |
| **LLM Synthesis** | **Ollama (`llama3.2`) + Fallback** | Local privacy-preserving LLM generation with fallback template synthesis. |
| **Frontend Framework** | **React 18 + Vite** | Fast compilation, modern component-driven SPA architecture. |
| **Styling & Icons** | **Tailwind CSS + Lucide Icons** | Polished dark mode, bespoke typography, glassmorphism panels, and Indian currency formatters. |

---

## 📂 Project Structure

```plaintext
TenderX/
├── .env.example              # Environment variables template
├── .gitignore                # Git exclusions (Python, Node, storage, env)
├── docker-compose.yml        # PostgreSQL (pgvector) + Backend + Frontend
├── package.json              # Monorepo scripts
├── requirements.txt          # Python dependencies
│
├── backend/
│   ├── alembic/              # Database migration scripts
│   ├── app/
│   │   ├── api/v1/           # REST endpoints (auth, company, tenders, matching, documents, bid-studio, tasks)
│   │   ├── core/             # Pydantic settings, security, logging, database
│   │   ├── data/             # Realistic Indian sample tenders (GeM & CPPP)
│   │   ├── models/           # SQLAlchemy models with pgvector Vector(384)
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   └── services/
│   │       ├── ai/           # Local embeddings, Ollama client, hybrid matcher, RAG engine
│   │       ├── ingestion/    # BaseTenderAdapter, GeMAdapter, CPPPAdapter, BulkImporter
│   │       └── storage/      # File manager and PDF/DOCX/TXT text extractor
│   ├── scripts/
│   │   └── seed_db.py        # Database seeder (admin, profile, tenders, credential vault)
│   └── tests/                # Unit test suite
│
└── frontend/
    ├── src/
    │   ├── api/client.js     # API client with auto JWT authentication
    │   ├── components/       # Common navigation, navbar, sidebar
    │   ├── pages/            # Dashboard, Discovery, Detail, Vault, Bid Studio, Profile, Tasks
    │   └── utils/            # Indian currency formatters (Crores/Lakhs)
    ├── index.html
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 🚀 Quickstart Guide

### Option A: Running with Docker Compose (Recommended)

1. **Clone and Configure**:
   ```bash
   cp .env.example .env
   ```

2. **Start Services**:
   ```bash
   docker compose up --build
   ```

3. **Seed Database**:
   ```bash
   docker compose exec backend python backend/scripts/seed_db.py
   ```

4. **Access Applications**:
   - **Frontend App**: [http://localhost:5173](http://localhost:5173)
   - **Backend API & Swagger Docs**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)

---

### Option B: Local Development Setup

#### 1. Database Setup (PostgreSQL with pgvector)
Ensure PostgreSQL 16 is running locally with `pgvector` enabled:
```sql
CREATE DATABASE tenderx_db;
CREATE USER tenderx_user WITH PASSWORD 'tenderx_password';
GRANT ALL PRIVILEGES ON DATABASE tenderx_db TO tenderx_user;
```

#### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
cd backend
alembic upgrade head
cd ..

# Seed database with sample Indian tenders & admin account
python backend/scripts/seed_db.py

# Launch FastAPI server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔑 Default Credentials

The database seeder automatically creates an administrator account:
- **Email**: `admin@tenderx.local`
- **Password**: `AdminPassword123!`

*(You can also use the "Fill Default Seed Admin" quick button on the login screen).*

---

## 🧠 Core Architecture Highlights

### 1. Hybrid AI Qualification Matching
Indian government tenders enforce strict qualification criteria. TenderX combines:
- **Hard Gate Filters (40%)**: Validates whether your 3-year turnover and operational experience satisfy the tender requirements. If your firm holds an **MSME / Udyam** registration, it automatically factors in the **50% turnover relaxation and 100% EMD fee waiver** under the Indian Public Procurement Policy.
- **Semantic Scope Alignment (60%)**: Calculates the cosine similarity between your company's core competencies embedding and the tender's scope of work embedding.
- **Output**: Deterministic 0–100% match score with clear pass/fail breakdown and risk analysis.

### 2. Local-First AI & RAG Engine
- Embeddings are generated using local transformer models (`fastembed` with 384 dimensions), stored in PostgreSQL via the `pgvector` extension.
- Proposals in the **Bid Studio** retrieve the top relevant credential chunks from your vault and draft technical compliance statements via **Ollama** (or an intelligent structured template fallback if offline).

### 3. Pluggable Indian Ingestion Adapters
- **`GeMAdapter`**: Parses GeM Bid numbers, Ministry/Department hierarchy, delivery states, and MSME relaxations.
- **`CPPPAdapter`**: Standardizes Central PSU and Railway NIT notices, estimated values, and two-cover requirements.
- **`BulkImportAdapter`**: Allows importing proprietary tender lists via CSV or JSON.

---

## 🗺️ Implementation Roadmap

- [x] **Phase 1**: FastAPI foundation, PostgreSQL + pgvector schema, JWT auth, and Alembic migrations.
- [x] **Phase 2**: Pluggable GeM and CPPP ingestion adapters with mock data generators.
- [x] **Phase 3**: Local-first embedding pipeline (`fastembed` / 384-dim) and Document Vault text chunking.
- [x] **Phase 4**: Hybrid qualification matching engine with MSME exemptions and risk factors.
- [x] **Phase 5**: RAG proposal generator & Bid Document Studio with human-in-the-loop markdown reviewer.
- [x] **Phase 6**: React + Tailwind CSS dashboard with Indian currency formatting, task tracking, and company profile.
- [ ] **Phase 7 (Future)**: Real-time GeM portal scraping worker and digital signature (Class 3 DSC) integration.
- [ ] **Phase 8 (Future)**: Financial BoQ excel auto-filler and reverse auction bid estimator.

---

## 📄 License
This project is licensed under the MIT License.
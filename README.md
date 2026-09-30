# 🛡️ Military Asset Management System (MAMS)

> **Enterprise Defense Logistics, Inter-Base Movements, Asset Lifecycle & Tactical Armory Auditing Platform**

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17%2B-orange.svg)](https://www.oracle.com/java/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Security](https://img.shields.io/badge/Security-JWT%20%2B%20RBAC-red.svg)](https://spring.io/projects/spring-security)
[![API Docs](https://img.shields.io/badge/API%20Docs-OpenAPI%203.0%20%2F%20Swagger-green.svg)](http://localhost:8080/swagger-ui/index.html)

---

## 📑 Table of Contents
1. [Platform Overview](#-platform-overview)
2. [Key Capabilities & Features](#-key-capabilities--features)
3. [Technology Stack](#-technology-stack)
4. [Logistics & Balance Reconciliation Logic](#-logistics--balance-reconciliation-logic)
5. [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
6. [UI & UX Highlights](#-ui--ux-highlights)
7. [Audit Trail & Accountability Standards](#-audit-trail--accountability-standards)
8. [API Directory (27 Endpoints)](#-api-directory-27-endpoints)
9. [Project Structure](#-project-structure)
10. [Installation & Setup](#-installation--setup)
11. [Automated Test Suite](#-automated-test-suite)

---

## 🏛 Platform Overview

The **Military Asset Management System (MAMS)** is an enterprise defense logistics platform architected to maintain 100% accountability of defense assets—including combat vehicles, weapon systems, ammunition, and tactical communications equipment—across distributed military installations and sector commands.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND CLIENT (REACT 18)                        │
│     Vite • Dual Theme (Dark/Light) • Fixed Layout • RBAC Dashboards    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST (JWT Bearer)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   BACKEND APPLICATION LAYER (SPRING BOOT)              │
│       Stateless Security • Method-Level RBAC • Business Services       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ ACID Compliance / ORM
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     SECURE RELATIONAL DATA LAYER                       │
│        Encrypted Storage • Immutable Ledgers • Audit History           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Capabilities & Features

- **Live Operational Dashboard:** Real-time visibility into opening balances, purchases, transfers, allocations, expenditures, and closing balances across defense bases.
- **Logistical Procurement Tracking:** Dedicated purchase registries with supplier, invoice, and consignment tracking.
- **Inter-Base Asset Transfers:** Automated inventory transfers with dual-base verification (sender stock deduction & receiver stock credit).
- **Troop Weapon Issuance & Returns:** Service number identification and shift return logging for perimeter guard and field drills.
- **Operational Ammunition Expenditure:** Firing drill and combat exercise consumption logging.
- **Defense Asset Catalog:** Classification of assets into Durable Assets vs Consumable Ordnance with customizable units of measure.
- **Immutable Audit Ledger:** Append-only ledger recording all chronological asset movements with authenticated officer signatures.
- **In-App API Documentation & Test Runner:** OpenAPI 3.0 catalog with interactive in-app test execution scoped to user clearance levels.

---

## 🛠 Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend Framework** | **Spring Boot 3.3.5 / Java 17** | Type-safe compiled backend architecture with transactional integrity. |
| **Security Architecture** | **Spring Security 6 + Stateless JWT** | Token-based authentication with method-level authorization (`@PreAuthorize`). |
| **Data Persistence** | **Spring Data JPA / Hibernate 6** | Declarative data access layer with strict relational consistency. |
| **Frontend Platform** | **React 18 + Vite** | Modular, fast component architecture with responsive glassmorphic UI. |
| **Styling & Design** | **Pure CSS + CSS Theme Variables** | High-contrast Light and Dark mode tokens, fixed sticky header & sidebar. |
| **API Specification** | **OpenAPI 3.0 / Swagger** | Interactive contract specification with real-time payload testing. |

---

## 📐 Logistics & Balance Reconciliation Logic

MAMS enforces mathematical inventory balancing across all operations:

$$\text{Net Movement} = \text{Purchases} + \text{Transfers In} - \text{Transfers Out}$$

$$\text{Closing Balance} = \text{Opening Balance} + \text{Net Movement} - \text{Expended}$$

$$\text{Total Custody} = \text{Available in Base Armory} + \text{Assigned to Personnel}$$

- Every procurement, transfer, issuance, and expenditure automatically reconciles live base inventory balances.

---

## 🔐 Role-Based Access Control (RBAC)

| Operational Module | Supreme Admin (`ADMIN`) | Logistics Officer (`LOGISTICS_OFFICER`) | Base Commander (`BASE_COMMANDER`) | Public / Unauthenticated |
| :--- | :---: | :---: | :---: | :---: |
| **Authentication & Profile** | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Login Only |
| **Dashboard KPI Metrics** | ✅ All Bases | ✅ Sector View | ✅ Base Assigned | ❌ Restricted |
| **Procurement / Purchases** | ✅ Full Access | ✅ Full Access | ✅ Base Purchases | ❌ Restricted |
| **Inter-Base Transfers** | ✅ Full Access | ✅ Full Access | ✅ Base Transfers | ❌ Restricted |
| **Personnel Assignments & Returns** | ✅ Full Access | ❌ Forbidden | ✅ Base Troops | ❌ Restricted |
| **Ammunition Expenditure** | ✅ Full Access | ❌ Forbidden | ✅ Base Operations | ❌ Restricted |
| **Asset Catalog Management** | ✅ Create / Edit / Decommission | ✅ Create / Edit | ✅ Read-Only | ❌ Restricted |
| **Military Bases Directory** | ✅ Register & View | ✅ View Installations | ✅ View Installations | ❌ Restricted |
| **Personnel Administration** | ✅ Full Access | ❌ Forbidden | ❌ Forbidden | ❌ Restricted |
| **Audit Reports & Exports** | ✅ Full Audit Logs | ✅ Logistics Logs | ✅ Command Logs | ❌ Restricted |
| **API Documentation Hub** | ✅ In-App Test Runner | ✅ In-App Test Runner | ✅ In-App Test Runner | ✅ Read-Only Specs |

---

## 🎨 UI & UX Highlights

- **Dual-Theme Engine (Light / Dark Mode):** Instant switching between high-contrast Military Slate Dark theme and Crisp Tactical Light theme.
- **Fixed Non-Scrolling Header & Sidebar:** Pinned navigation header and fixed left sidebar with independent scrollable main content viewport.
- **Collapsible Sidebar (Desktop & Tablet):** Desktop toggle button to expand/collapse sidebar navigation for maximized dashboard data visualization.
- **Independent Profile Controls:**
  - **Topbar Avatar (`CA`):** Compact header avatar triggering profile details, clearance level, theme switcher, and logout.
  - **Sidebar Profile Card:** Standalone bottom profile card with quick user metadata and station credentials.
- **Standardized Typography System:** Strict typographic hierarchy using font weights 700 (headers), 500 (subheaders), and 400 (body/labels).

---

## 📝 Audit Trail & Accountability Standards

1. **Immutable Movement Ledger:** All asset movements are append-only. There are no delete operations permitted on historical movement records.
2. **Officer Signature & Traceability:** Every transaction captures the authenticated username and timestamp.
3. **Soft-Delete Protections:** Decommissioning of assets or personnel uses soft deletion flags to preserve complete historical auditability.

---

## 📡 API Directory (27 Endpoints)

### 1. Authentication (`/api/auth`)
- `POST /api/auth/login` — Authenticate user and receive JWT access token *(Public)*
- `POST /api/auth/register` — Register a new officer account *(Admin only)*
- `GET /api/auth/me` — Retrieve authenticated user profile *(Authenticated)*

### 2. Dashboard Analytics (`/api/dashboard`)
- `GET /api/dashboard/summary` — Retrieve KPI metrics (Opening, Purchases, Transfers, Net Movement, Assigned, Expended, Closing)
- `GET /api/dashboard/recent-movements` — Retrieve recent activity stream
- `GET /api/dashboard/category-distribution` — Retrieve stock distribution across asset categories

### 3. Equipment & Assets Catalog (`/api/equipment`)
- `GET /api/equipment` — List all defense equipment types
- `GET /api/equipment/{id}` — Retrieve equipment specifications by ID
- `POST /api/equipment` — Register a new asset type into catalog *(Admin, Logistics)*
- `PUT /api/equipment/{id}` — Update equipment specifications *(Admin, Logistics)*
- `DELETE /api/equipment/{id}` — Decommission an equipment type *(Admin only)*

### 4. Movements & Logistics (`/api/movements`)
- `POST /api/movements/purchase` — Record asset procurement *(Admin, Logistics, Commander)*
- `POST /api/movements/transfer` — Transfer assets between bases *(Admin, Logistics, Commander)*
- `POST /api/movements/assign` — Assign weapons/gear to personnel *(Admin, Commander)*
- `POST /api/movements/return` — Record return of assigned assets to armory *(Admin, Commander)*
- `POST /api/movements/expend` — Record munitions expenditure *(Admin, Commander)*
- `GET /api/movements` — Query movement transaction ledger
- `GET /api/movements/{id}` — Retrieve transaction details by ID

### 5. Inventory Balances (`/api/inventory`)
- `GET /api/inventory` — Query live inventory balances across all installations
- `GET /api/inventory/base/{baseId}` — Query inventory balances for a specific base
- `GET /api/inventory/base/{baseId}/equipment/{equipmentTypeId}` — Query specific item balance at a base

### 6. Personnel (`/api/personnel`)
- `GET /api/personnel` — Query personnel registry *(Admin only)*
- `GET /api/personnel/{id}` — Retrieve personnel record by ID *(Admin only)*
- `POST /api/personnel` — Register new personnel record *(Admin only)*
- `PUT /api/personnel/{id}` — Update personnel details *(Admin only)*
- `DELETE /api/personnel/{id}` — Decommission personnel record *(Admin only)*

### 7. Bases & Installations (`/api/bases`)
- `GET /api/bases` — Query military installations
- `GET /api/bases/{id}` — Retrieve base installation details by ID
- `POST /api/bases` — Register a new base installation *(Admin only)*

### 8. Reports & Audit Exports (`/api/reports`)
- `GET /api/reports/movements` — Generate logistical movement audit report
- `GET /api/reports/inventory-audit` — Generate armory stock health audit report
- `GET /api/reports/expenditures` — Generate munitions expenditure report
- `GET /api/reports/export/csv` — Export audit data to CSV format

---

## 📁 Project Structure

```
Military Asset Management System/
├── backend/                                # Spring Boot 3.3.5 Application
│   ├── src/main/java/com/mams/             # Application source code
│   │   ├── config/                         # Security & CORS configuration
│   │   ├── controller/                     # REST API Controllers (27 endpoints)
│   │   ├── dto/                            # Data Transfer Objects
│   │   ├── entity/                         # Domain Entities
│   │   ├── repository/                     # Data Access Interfaces
│   │   ├── security/                       # JWT Filters & Auth Providers
│   │   └── service/                        # Business Logic Implementations
│   └── src/test/java/com/mams/service/     # Unit & Integration Test Suite
│
└── frontend/                               # React 18 / Vite Application
    └── src/
        ├── components/                     # Layout, ProtectedRoute, Navigation
        ├── context/                        # Auth & Theme State Management
        ├── pages/                          # Application Views & Dashboards
        ├── services/                       # API Client & Request Interceptors
        ├── typography.css                  # Standardized Font Weight Tokens
        └── App.css                         # Tactical Defense Design System
```

---

## ⚡ Installation & Setup

### 1. Prerequisites
- **Java 17 JDK** or higher
- **Node.js 18+** & npm
- **Maven 3.8+**

### 2. Backend Startup
```powershell
cd backend
mvn clean compile
mvn spring-boot:run
```
* Backend API: `http://localhost:8080`
* Swagger UI Docs: `http://localhost:8080/swagger-ui/index.html`

### 3. Frontend Startup
```powershell
cd frontend
npm install
npm run dev -- --port 5173
```
* Web Application: `http://localhost:5173`
* Public Architecture Specs: `http://localhost:5173/public-docs`

---

## 🧪 Automated Test Suite

Run the automated service and reconciliation test suite:
```powershell
cd backend
mvn test
```
* Includes test coverage for movement ledger transactions, stock deductions, and dashboard balance reconciliation.

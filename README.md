# Military Asset Management System (MAMS)

A full-stack, secure, role-based web platform for tracking military assets across multiple bases throughout their lifecycle (Purchase → Inventory → Transfer → Assignment → Return/Expenditure → Closing Balance).

---

## 📁 Project Structure

```
Military-Asset-Management-System_platform/
├── backend/                       # Spring Boot 3 Backend API
│   ├── src/
│   │   ├── main/java/com/mams/    # Java source code (Controllers, Services, Security, etc.)
│   │   └── main/resources/        # Configurations & Flyway migrations
│   └── pom.xml                    # Maven dependencies
├── frontend/                      # React.js (Vite) Frontend Application
│   ├── src/                       # React components, pages, routing, state
│   ├── package.json               # Frontend dependencies
│   └── vite.config.js             # Vite configuration
└── README.md                      # Project documentation
```

---

## 🛠 Tech Stack

### Backend
- **Java 17+** & **Spring Boot 3.3.5**
- **Spring Security** + **JWT**
- **Spring Data JPA** & **Hibernate**
- **PostgreSQL** & **Flyway Migrations**
- **OpenAPI 3 / Springdoc Swagger UI**

### Frontend
- **React.js** (JavaScript) + **Vite**
- **React Router Dom**
- **Axios** (API Client)
- **Lucide React** (Icons)
- **Recharts** (Dashboard Charts)
- **Tailwind CSS**

---

## 🚀 Getting Started

### 1. Running Backend
```bash
cd backend
mvn clean compile
mvn spring-boot:run
```
- Swagger UI will be available at: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

### 2. Running Frontend
```bash
cd frontend
npm install
npm run dev
```
- Frontend will be available at: `http://localhost:5173`

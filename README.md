# Military Asset Management System (MAMS) - Backend

A secure, role-based backend API built with **Spring Boot 3**, **Spring Security (JWT)**, **Spring Data JPA**, **PostgreSQL**, and **OpenAPI (Swagger UI)**.

---

## 🛠 Tech Stack

- **Java**: 17+
- **Framework**: Spring Boot 3.3.5
- **Security**: Spring Security + JJWT (0.12.6)
- **Database**: PostgreSQL
- **Database Migrations**: Flyway
- **Documentation**: OpenAPI 3 / Springdoc Swagger UI
- **Build Tool**: Maven

---

## 📁 Package Structure

```
src/main/java/com/mams/
├── config/        # Application & Swagger configurations
├── security/      # JWT filters, authentication providers, user details
├── controller/    # REST API controllers
├── service/       # Business logic interfaces and implementations
├── repository/    # Spring Data JPA repositories
├── entity/        # Database JPA entities
├── dto/           # Request & Response DTOs
├── mapper/        # Entity-DTO mappers
├── exception/     # Global exception handler & custom exceptions
├── audit/         # Audit logging listeners & services
└── util/          # Utilities & constants
```

---

## 🚀 Getting Started

### 1. Prerequisites
- JDK 17 or higher
- Maven 3.8+
- PostgreSQL (or run via Docker)

### 2. Build & Test
```bash
mvn clean compile
mvn test
```

### 3. Run the Application
```bash
mvn spring-boot:run
```

### 4. API Documentation
Once started, Swagger UI is available at:
`http://localhost:8080/swagger-ui.html`
OpenAPI JSON is available at:
`http://localhost:8080/v3/api-docs`

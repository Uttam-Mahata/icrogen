# ICRoGen (IIEST Central Routine Generator)

ICRoGen is a powerful, full-stack web application designed to automate the complex process of academic schedule creation for educational institutions. It provides a comprehensive suite of tools for managing academic entities and a sophisticated algorithm to generate conflict-free timetables across multiple departments and semesters.

## ✨ Features

- **Complete Academic Entity Management**: Full CRUD functionality for Programmes, Departments, Teachers, Subjects, and Rooms.
- **Dynamic Semester Configuration**: Easily configure semester-specific course offerings, including inter-departmental teacher and room assignments.
- **Intelligent Routine Generation**: A backtracking algorithm generates conflict-free timetables, preventing double-booking of teachers and rooms across the entire institution.
- **Cross-Departmental Support**: Seamlessly assign teachers and resources across different departments and programmes.
- **RESTful API**: A clean and well-documented REST API for easy integration and frontend development.
- **Modern Frontend**: A responsive and user-friendly interface built with React, TypeScript, and Material-UI.

## 🛠️ Tech Stack & Architecture

ICRoGen is built with a modern, decoupled architecture, ensuring scalability and maintainability.

- **Frontend**: React, TypeScript, Vite, Material-UI, React Router
- **Backend**: Go (Golang), Gin Gonic
- **Database**: MySQL
- **Containerization**: Docker, Docker Compose

The system follows a client-server model:
- The **Go backend** serves a RESTful API, handling all business logic, database interactions, and the core routine generation algorithm.
- The **React frontend** provides a rich user interface for administrators to manage data and interact with the system.

```
┌──────────────────┐      ┌──────────────────┐
│  React Client    │◄─────►│   Go Backend     │
│ (Vite, MUI)      │      │ (Gin, GORM)      │
└──────────────────┘      └──────────────────┘
                            │
                            ▼
                      ┌───────────┐
                      │  MySQL DB │
                      └───────────┘
```

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/en/download/) (v18 or later)
- [Go](https://go.dev/doc/install) (v1.21 or later)

### 1. Backend Setup (Docker)

The backend, including the MySQL database, is fully containerized for a simple setup.

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```

2.  **Start the services using Docker Compose:**
    ```bash
    docker-compose up -d
    ```

This command will start three containers:
- `icrogen-server`: The Go API server, accessible at `http://localhost:8080`
- `db`: The MySQL database, accessible on port `3306`
- `adminer`: A database management tool, accessible at `http://localhost:8081`

### 2. Frontend Setup

1.  **Navigate to the client directory:**
    ```bash
    cd client
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

The client application will be available at `http://localhost:5173`.

## 📂 Project Structure

The repository is organized into two main parts:

```
.
├── client/         # React/Vite frontend application
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── server/         # Go backend application
    ├── cmd/        # Main application entry point
    ├── internal/   # Core application logic (Clean Architecture)
    ├── go.mod
    └── docker-compose.yml
```

## 📖 API Documentation

The backend provides a comprehensive RESTful API. For detailed information on endpoints, request/response formats, and data models, please refer to the official API documentation:

- **[View API Documentation](./server/API.md)**

## 🧠 Core Algorithm

The routine generation is a Constraint Satisfaction Problem (CSP) solved using a **backtracking algorithm**.

1.  **Initialization**: The system gathers all course assignments for the selected semesters.
2.  **Constraint Definition**: It identifies constraints, such as teacher availability, room capacity, and pre-defined time slots.
3.  **Recursive Placement**: The algorithm recursively attempts to place each class block into a valid time slot. If a placement leads to a conflict, it backtracks and tries a different slot.
4.  **Conflict Resolution**: The system checks for conflicts at a global level, ensuring that a teacher or room is not booked in another department's schedule at the same time.

This approach guarantees the generation of a conflict-free schedule if one is possible within the given constraints.

## 🤝 Contributing

Contributions are welcome! If you'd like to contribute to ICRoGen, please follow these steps:

1.  Fork the repository.
2.  Create a new feature branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

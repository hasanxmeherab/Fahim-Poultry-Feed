## 🐔 Fahim Poultry Feed: MERN Stack Business Management System

A robust, full-stack enterprise solution built with the MERN stack and secured by Firebase, designed to digitize the entire operational and financial workflow of a poultry feed business, focusing on inventory, sales, and complex customer credit cycles.

## 🌟 Key Architectural Features

This application is built around data integrity, security, and specialized business logic.

* **Role-Based Access Control (RBAC):** Access is strictly governed by three roles—Admin, Operator, and Viewer—enforced at the API level via Firebase JWT custom claims.

* **Atomic Data Integrity:** Critical operations (sales, stock changes, customer financial updates) are protected using MongoDB Transactions to guarantee data consistency and prevent partial updates.

* **Unified Transaction Auditing:** All financial movements are logged into a central Transaction model, providing a complete, non-repudiable audit history.

* **Modern Frontend State:** Leverages React Query for efficient server state management, caching, and background synchronization.

* **Custom File Hosting:** Profile pictures are handled via direct ImageBB API uploads from the client, decoupling file storage from the primary infrastructure.

## 🛠️Technology Stack

* **Backend (Fahim-Poultry-Feed-Backend)**

* **Core Frameworks:** Node.js, Express.js, Firebase Admin SDK

* **Database/ORM:** MongoDB, Mongoose

* **Data Integrity:** MongoDB Transactions, express-validator

* **UI/UX:** N/A

* **Frontend (Fahim-Poultry-Feed-Frontend)**

* **Core Frameworks:** React, Vite

* **Database/ORM:** @tanstack/react-query

* **Data Integrity:** @tanstack/react-query

* **UI/UX:** Material-UI (MUI), Tailwind CSS, Chart.js, jsPDF


## 🚀 Setup and Installation

This project is divided into two interdependent parts. You must set up both the backend API and the frontend client.

* **1. Backend Setup**

See the dedicated  **Fahim-Poultry-Feed-Backend/README.md** for detailed instructions on environment variables and running the server.

* **2. Frontend Setup**

See the dedicated  **Fahim-Poultry-Feed-Frontend/README.md** for client-side environment configuration and installation.

## 🧭 Running the Project

* **Start the Backend API using:** npm start

* **Start the Frontend Client using:** npm run dev.
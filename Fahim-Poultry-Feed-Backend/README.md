# Fahim Poultry Feed - Backend API

This is the robust RESTful API that powers the Fahim Poultry Feed management system. It is a Node.js and Express.js application designed to handle all business logic, data storage, and authentication for the corresponding frontend client.

The API manages inventory, customers, sales, and a specialized "batch" system for tracking customer credit cycles, including a unique "buy-back" feature.

## Features

* **Secure Authentication**: Endpoints are protected using JSON Web Tokens (JWT). User registration is designed for one-time admin setup, and login generates a token for accessing protected routes.
* **Customer Management**: Full CRUD (Create, Read, Update, Delete) operations for customers. Includes functionality for managing customer balances through deposits and withdrawals.
* **Product & Inventory Control**: Full CRUD for products, including real-time stock management (add/remove quantity). A real-time SKU check is available to prevent duplicates.
* **Batch System**: A specialized feature to track a customer's farming cycle. A batch can be started, can accumulate sales, have discounts applied, and be concluded with a "buy-back" transaction where chickens are bought back from the farmer.
* **Comprehensive Transaction Logging**: A central `Transaction` model logs every significant event in the system, including sales, deposits, withdrawals, stock changes, and buy-backs, creating a complete audit trail.
* **Wholesale Module**: Separate logic and endpoints for managing wholesale buyers and wholesale-specific products.
* **Reporting Endpoints**: Provides aggregated data for sales reports over a date range and statistics for the main dashboard.

## Technology Stack

* **Node.js**: JavaScript runtime environment.
* **Express.js**: Web application framework for building the API.
* **MongoDB**: NoSQL database for data persistence.
* **Mongoose**: Object Data Modeler (ODM) for interacting with MongoDB.
* **JSON Web Tokens (JWT)**: For handling user authentication.
* **bcryptjs**: For secure password hashing.
* **dotenv**: For managing environment variables.
* **CORS**: To enable Cross-Origin Resource Sharing with the frontend client.

## Prerequisites

* Node.js (v18.x or later recommended)
* npm (or yarn)
* MongoDB instance (local or cloud-based like MongoDB Atlas)

## Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd Fahim-Poultry-Feed-Backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create an environment file:**
    Create a `.env` file in the root of the backend directory and add the following variables.

    ```env
    # The connection string for your MongoDB database.
    # For a local MongoDB instance:
    MONGO_URI=mongodb://127.0.0.1:27017/fahim-poultry
    # Or for a cloud instance on MongoDB Atlas:
    # MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/fahim-poultry

    # The port the server will run on.
    PORT=5000

    # A long, random, and secret string for signing JWTs.
    JWT_SECRET=your_super_secret_jwt_string_here
    ```
    * The `server.js` file uses these variables to connect to the database and start the server.
    * The `JWT_SECRET` is used in the `userController.js` to sign tokens and in `authMiddleware.js` to verify them.

## Running the Server

* **For Development (with auto-reloading):**
    ```bash
    npm run dev
    ```
    This command uses `nodemon` to automatically restart the server on file changes.

* **For Production:**
    ```bash
    npm start
    ```
    This command runs the server using `node`.

The server will start on the port specified in your `.env` file (e.g., `http://localhost:5000`).

## API Endpoints

All endpoints are prefixed with `/api`. Most routes are protected and require a valid JWT Bearer token in the `Authorization` header.

* `/api/users`: Authentication (`/login`, `/register`)
* `/api/customers`: Customer CRUD, deposits, withdrawals, and buy-backs.
* `/api/products`: Product CRUD, stock management, and SKU checks.
* `/api/batches`: Batch management (start, end, discounts).
* `/api/sales`: Creating sales for regular and wholesale customers.
* `/api/transactions`: Fetching transaction history for various contexts (global, by batch, by buyer).
* `/api/wholesale-buyers`: Wholesale buyer CRUD and financial transactions.
* `/api/wholesale-products`: Wholesale product CRUD.
* `/api/reports`: Aggregated reports for sales and batches.
* `/api/dashboard`: Statistics and chart data for the main dashboard.
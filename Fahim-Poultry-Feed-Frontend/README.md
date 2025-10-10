# Fahim Poultry Feed - Frontend Client

This is a modern, responsive single-page application (SPA) built with React that serves as the user interface for the [Fahim Poultry Feed Backend API](#fahim-poultry-feed---backend-api). It provides a comprehensive and user-friendly dashboard for managing all aspects of the poultry feed business. The application is built using Vite for a fast and efficient development experience.

## Features

* **Interactive Dashboard**: A homepage that provides a real-time overview of key business metrics like daily sales, customers in debt, and low-stock products, complete with visual charts for sales trends.
* **Full CRUD Interfaces**: Intuitive pages for creating, reading, updating, and deleting Customers, Inventory Products, and Wholesale Buyers/Products.
* **Advanced Search & Filtering**: All list pages include real-time search functionality. The transaction history pages include date-range filtering.
* **Secure Client-Side Routing**: Access to application pages is protected, redirecting unauthorized users to the login page.
* **Dynamic Forms & Modals**: User-friendly forms for creating sales, buy-backs, and managing stock levels, often presented in modals for a smooth user experience.
* **Printable Receipt Generation**: After any major transaction (sale, deposit, buy-back), a printable, thermal-printer-style receipt is generated in a new tab for physical record-keeping.
* **User Notifications**: Uses `react-toastify` to provide clear success and error feedback for all user actions.
* **Password Reset**: Integrates with Firebase Authentication for a secure "Forgot Password" email flow.

## Technology Stack

* **Build Tool**: Vite.
* **Framework**: React.
* **Routing**: React Router.
* **UI Library**: Material-UI (MUI) & Emotion.
* **Styling**: Tailwind CSS for utility classes.
* **HTTP Client**: Axios.
* **Charting**: Chart.js with react-chartjs-2.
* **Notifications**: React Toastify.
* **Animations**: Lottie for vector animations.
* **External Services**: Firebase SDK (for Auth password reset).

## Prerequisites

* Node.js (v18.x or later recommended)
* npm (or yarn)
* A running instance of the [Fahim Poultry Feed Backend API](#fahim-poultry-feed---backend-api).

## Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd Fahim-Poultry-Feed-Frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a file named `.env.local` in the root of the frontend directory. This will store the URL for the backend API and your Firebase credentials.

    ```env
    # The base URL for the backend API
    VITE_API_BASE_URL=http://localhost:5000/api

    # Your Firebase project configuration keys
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```
    
    **Note**: You will need to update the `src/api/api.js` file to use this environment variable:
    ```javascript
    // src/api/api.js
    import axios from 'axios';

    const api = axios.create({
        // Change this line
        baseURL: import.meta.env.VITE_API_BASE_URL,
    });

    // ... rest of the file
    ```

    You will also need a `src/firebase.js` file (not provided) that initializes Firebase using these variables.

## Running the Application

* **For Development:**
    ```bash
    npm run dev
    ```
    This will start the Vite development server, usually on `http://localhost:5173`.

* **Building for Production:**
    ```bash
    npm run build
    ```
    This command bundles the application into a `dist` directory for deployment.

* **Previewing the Production Build:**
    ```bash
    npm run preview
    ```
    This command serves the `dist` folder locally to test the production build.
// Import necessary packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config(); // Load environment variables from .env file

// Import routes
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const batchRoutes = require('./routes/batchRoutes');
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const wholesaleBuyerRoutes = require('./routes/wholesaleBuyerRoutes');
const wholesaleProductRoutes = require('./routes/wholesaleProductRoutes');

const admin = require('firebase-admin');

// --- Security Improvement: Load service account from environment variables ---
// Avoid loading directly from file in production. Store the JSON content
// in an environment variable (e.g., FIREBASE_SERVICE_ACCOUNT_JSON)
// and parse it here. For local development, using the file is okay,
// BUT MAKE SURE IT'S IN .gitignore.
let serviceAccount;
try {
    // Attempt to load from file (for local dev, ensure file is gitignored)
    serviceAccount = require('./serviceAccountKey.json');
} catch (error) {
    console.error("Failed to load serviceAccountKey.json. Ensure the file exists for local development or environment variable is set for production.", error);
    // If loading from environment variable:
    // try {
    //   serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    // } catch (parseError) {
    //   console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON environment variable.", parseError);
    //   process.exit(1); // Exit if config is crucial and missing/invalid
    // }
    process.exit(1); // Exit if service account is missing
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
// --- End Security Improvement ---

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Allow the server to accept JSON data in requests

// --- API Routes ---
// Mount all specific API routes BEFORE the general error handler
app.use('/api/batches', batchRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/wholesale-buyers', wholesaleBuyerRoutes);
app.use('/api/wholesale-products', wholesaleProductRoutes);

// --- Central Error Handling Middleware ---
// This MUST come AFTER all your route definitions
// It catches errors passed via next(error) from any route handler
app.use((err, _req, res, _next) => {
    console.error(err.stack); // Log the full error stack for debugging

    // Use the statusCode attached to the error, or default to 500
    const statusCode = err.statusCode || 500;
    // Use the error message, or provide a generic default
    const message = err.message || 'Internal Server Error';

    // Send the error response
    res.status(statusCode).json({ error: message });
});
// --- End Central Error Handling Middleware ---


const startServer = async () => {
    try {
        // Ensure MONGO_URI is set in your .env file
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI environment variable is not set.');
        }

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Successfully connected to MongoDB! データベースに接続しました');

        // Start the Express server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT} 🚀`);
        });
    } catch (err) {
        console.error('Server startup failed:', err);
        process.exit(1); // Exit the process with an error code if connection fails
    }
};

// --- Call the function to start the server ---
startServer();

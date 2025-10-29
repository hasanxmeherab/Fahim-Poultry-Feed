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
const profileRoutes = require('./routes/profileRoutes'); // <-- Import the new profile routes
const userRoutes = require('./routes/userRoutes');

const admin = require('firebase-admin');

// --- Securely Load Firebase Admin Credentials ---
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // Production: Load from environment variable
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.log('Loaded Firebase service account from environment variable.');
  } else {
    // Development: Load from file (Ensure serviceAccountKey.json is in .gitignore!)
    console.warn('Attempting to load Firebase service account from local file (serviceAccountKey.json). Ensure this file is in .gitignore!');
    serviceAccount = require('./serviceAccountKey.json');
     if (!serviceAccount || Object.keys(serviceAccount).length === 0) { // Added check for empty object
        throw new Error('serviceAccountKey.json is empty or invalid.');
     }
    console.log('Loaded Firebase service account from local file.');
  }
} catch (error) {
  console.error('CRITICAL ERROR: Failed to load Firebase Admin credentials.', error.message);
  process.exit(1); // Exit if Firebase Admin SDK cannot be initialized
}

// Initialize Firebase Admin SDK
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully.');
} catch (initError) {
    console.error('CRITICAL ERROR: Failed to initialize Firebase Admin SDK.', initError);
    process.exit(1);
}
// --- End Secure Loading ---

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
app.use('/api/profile', profileRoutes); // <-- Mount the new profile routes
app.use('/api/users', userRoutes);

// --- Central Error Handling Middleware ---
// ... existing error handler code ...
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
    // ... existing start server code ...
    try {
        // Ensure MONGO_URI is set in your .env file
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI environment variable is not set.');
        }

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Successfully connected to MongoDB!'); // Removed Japanese text for clarity

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

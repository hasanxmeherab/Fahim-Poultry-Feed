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
const userRoutes = require('./routes/userRoutes');
const wholesaleBuyerRoutes = require('./routes/wholesaleBuyerRoutes');
const wholesaleProductRoutes = require('./routes/wholesaleProductRoutes');

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Allow the server to accept JSON data in requests

// API Routes
app.use('/api/batches', batchRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/customers', customerRoutes); // Use the customer routes for any URL starting with /api/customers
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/wholesale-buyers', wholesaleBuyerRoutes);
app.use('/api/wholesale-products', wholesaleProductRoutes);



const startServer = async () => {
  try {
    // Use await to ensure the connection is complete before proceeding
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to MongoDB! データベースに接続しました');

    // Start the server only after a successful DB connection
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} 🚀`);
    });
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1); // Exit the process with an error code
  }
};

// --- Call the function to start the server ---
startServer();

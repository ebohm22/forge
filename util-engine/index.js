// index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import the routes
const galleryRoutes = require('./routes/galleryRoutes');
const toolRoutes = require('./routes/toolRoutes');
const adminRoutes = require('./routes/adminRoutes');
const myToolsRoutes = require('./routes/myToolsRoutes'); // 1. Import new router

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
// Mount the routers with a base path
app.use('/api/gallery', galleryRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/my-tools', myToolsRoutes); // 2. Mount new router

// --- Start the server ---
app.listen(PORT, () => {
  console.log(`🚀 Forge API server running on http://localhost:${PORT}`);
});
// Simple Express server with minimal dependencies
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

// API key stored here in the server code (not accessible to browser)
const COHERE_API_KEY = 'NV4mJTHyb8alHuLqJcHtDqjkXAcAMGO3Yk5xTY74';

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Proxy route for Cohere API
app.post('/api/chat', async (req, res) => {
  try {
    const response = await axios.post('https://api.cohere.ai/v1/chat', req.body, {
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error calling Cohere API:', error.message);
    res.status(500).json({
      error: 'Error communicating with Cohere API'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
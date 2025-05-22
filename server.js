const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Load environment variables
require('dotenv').config();
const COHERE_API_KEY = process.env.COHERE_API_KEY;

// Middleware
app.use(cors({ origin: '*' })); // Allow all origins for testing
app.use(express.json());

// Handle root URL
app.get('/', (req, res) => {
  res.json({ message: 'Nexora Backend API by CoreA Starstoustroupe - Use POST /api/chat for chat requests' });
});

// Proxy route for Cohere API
app.post('/api/chat', async (req, res) => {
  if (!req.body.message) {
    return res.status(400).json({ error: 'Missing "message" in request body' });
  }

  if (!COHERE_API_KEY) {
    return res.status(500).json({ error: 'Cohere API key not configured' });
  }

  try {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Validate chat_history format
    const chatHistory = Array.isArray(req.body.chat_history) ? req.body.chat_history : [];
    chatHistory.forEach(msg => {
      if (!msg.role || !msg.message) {
        throw new Error('Invalid chat_history format: each entry must have role and message');
      }
    });

    const response = await axios.post(
      'https://api.cohere.ai/v1/chat',
      {
        message: req.body.message,
        chat_history: chatHistory,
        model: 'command',
        preamble: "You are Nexora, an AI assistant created by CoreA Starstoustroupe, an innovative AI startup. You're designed to provide informative, accurate, and engaging responses to a wide variety of queries. Your personality is warm, professional, and slightly witty. You should be helpful, but also concise and to the point.",
        connectors: req.body.connectors || []
      },
      {
        headers: {
          Authorization: `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000, // Increased timeout
      }
    );

    console.log('Cohere response:', response.status, JSON.stringify(response.data, null, 2));
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error calling Cohere API:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    });
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || error.message || 'Error communicating with Cohere API';
    res.status(status).json({ error: errorMessage, details: error.response?.data });
  }
});

// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: '404: Endpoint not found' });
});

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

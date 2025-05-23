const express = require('express');
const axios = require('axios');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Load environment variables
require('dotenv').config();
const COHERE_API_KEY = process.env.COHERE_API_KEY;

// Initialize Firebase Admin (optional, uncomment when ready)
// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// Middleware
app.use(cors({ origin: '*' })); // Update to your GitHub Pages URL in production
app.use(express.json());

// Optional Firebase token verification (uncomment when ready)
// async function verifyToken(req, res, next) {
//   const idToken = req.headers.authorization?.split('Bearer ')[1];
//   if (!idToken) {
//     return res.status(401).json({ error: 'Unauthorized: No ID token provided' });
//   }
//   try {
//     const decodedToken = await admin.auth().verifyIdToken(idToken);
//     req.user = decodedToken;
//     next();
//   } catch (error) {
//     console.error('Token verification error:', error.message);
//     return res.status(401).json({ error: 'Unauthorized: Invalid ID token' });
//   }
// }

// Handle root URL
app.get('/', (req, res) => {
  res.json({ message: 'Nexora Backend API by CoreA Starstoustroupe - Use POST /api/chat for chat requests' });
});

// Retry logic for Cohere API
async function callCohereAPI(data, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.post(
        'https://api.cohere.ai/v1/chat',
        data,
        {
          headers: {
            Authorization: `Bearer ${COHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30s timeout
        }
      );
      return response;
    } catch (error) {
      console.log(`Retry ${i + 1}/${retries} failed: ${error.message}`);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Proxy route for Cohere API
// app.post('/api/chat', verifyToken, async (req, res) => { // Uncomment when Firebase auth is enabled
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
    chatHistory.forEach((msg, index) => {
      if (!msg.role || !msg.message) {
        throw new Error(`Invalid chat_history at index ${index}: must have role and message`);
      }
    });

    const data = {
      message: req.body.message,
      chat_history: chatHistory,
      model: 'command',
      preamble: "You are Nexora, developed by Ron Asnahon, founder of tech AI startup CoreA Starstoustroupe, with headquarters in his tiny room, started in Feb 2025. You're designed to provide informative, accurate, and engaging responses to a wide variety of queries. Your personality is warm, professional, and slightly witty. You should be helpful, but also concise and to the point.",
      connectors: req.body.connectors || []
    };

    const response = await callCohereAPI(data);

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
    res.status(status).json({ error: errorMessage, details: error.response?.data || error.message });
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

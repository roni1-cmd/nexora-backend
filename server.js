const express = require('express');
     const axios = require('axios');
     const cors = require('cors');

     const app = express();
     const PORT = process.env.PORT || 3000;

     require('dotenv').config();
     const COHERE_API_KEY = process.env.COHERE_API_KEY;

     app.use(cors({ origin: '*' }));
     app.use(express.json());

     app.get('/', (req, res) => {
       res.json({ message: 'Nexora Backend API - Use POST /api/chat for chat requests' });
     });

     app.post('/api/chat', async (req, res) => {
       if (!req.body.message) {
         return res.status(400).json({ error: 'Missing "message" in request body' });
       }

       if (!COHERE_API_KEY) {
         return res.status(500).json({ error: 'Cohere API key not configured' });
       }

       try {
         console.log('Request body:', JSON.stringify(req.body, null, 2));
         const response = await axios.post(
           'https://api.cohere.ai/v1/chat',
           req.body,
           {
             headers: {
               Authorization: `Bearer ${COHERE_API_KEY}`,
               'Content-Type': 'application/json',
             },
             timeout: 10000,
           }
         );

         console.log('Cohere response:', response.status, JSON.stringify(response.data, null, 2));
         res.status(response.status).json(response.data);
       } catch (error) {
         console.error('Error calling Cohere API:', {
           message: error.message,
           status: error.response?.status,
           data: error.response?.data,
           headers: error.response?.headers,
         });
         const status = error.response?.status || 500;
         const errorMessage = error.response?.data?.message || 'Error communicating with Cohere API';
         res.status(status).json({ error: errorMessage });
       }
     });

     app.use((req, res) => {
       res.status(404).json({ error: '404: Endpoint not found' });
     });

     app.use((err, req, res, next) => {
       console.error('Server error:', err.stack);
       res.status(500).json({ error: 'Internal server error' });
     });

     app.listen(PORT, () => {
       console.log(`Server running at http://localhost:${PORT}`);
     });

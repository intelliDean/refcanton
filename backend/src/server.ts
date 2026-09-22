// backend/src/server.ts
// Express application entry point for RefCanton

import express from 'express';
import cors from 'cors';
import path from 'path';
import { apiRouter } from './routes';

const app = express();
const PORT = process.env.PORT || 4000;

// Core Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Serve Frontend Web Assets
app.use(express.static(path.join(__dirname, '../../frontend')));

// Fallback to index.html for SPA-style client routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`[RefCanton API] Server running on http://localhost:${PORT}`);
});

export default app;

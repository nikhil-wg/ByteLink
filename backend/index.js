import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
import dotenv from 'dotenv';
// import urlRoutes from './routes/urlRoutes.js';
// import { connectDB } from './config/database.js';

dotenv.config();

const app = express();
const PORT = 5000;

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Connect to MongoDB
// connectDB();

// // Routes
// app.use('/api/urls', urlRoutes);

// // Redirect route for shortened URLs
// app.get('/:shortCode', async (req, res) => {
//   try {
//     const { Url } = await import('./models/Url.js');
//     const url = await Url.findOne({ shortCode: req.params.shortCode });
    
//     if (!url) {
//       return res.status(404).json({ error: 'URL not found' });
//     }

//     // Increment click count and add analytics
//     url.clicks += 1;
//     url.analytics.push({
//       timestamp: new Date(),
//       userAgent: req.get('User-Agent'),
//       ip: req.ip || req.connection.remoteAddress,
//       referer: req.get('Referer') || 'Direct'
//     });

//     await url.save();

//     // Redirect to original URL
//     res.redirect(url.originalUrl);
//   } catch (error) {
//     console.error('Redirect error:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // Health check
// app.get('/api/health', (req, res) => {
//   res.json({ status: 'OK', message: 'Link Shortener API is running' });
// });

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
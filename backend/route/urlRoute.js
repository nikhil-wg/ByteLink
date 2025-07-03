import express from 'express';
import { nanoid } from 'nanoid';
import validator from 'validator';
import QRCode from 'qrcode';
import { Url } from '../models/Url.js';

const router = express.Router();

// Create shortened URL
router.post('/shorten', async (req, res) => {
  try {
    const { originalUrl, customCode } = req.body;

    // Validate URL
    if (!originalUrl || !validator.isURL(originalUrl)) {
      return res.status(400).json({ error: 'Please provide a valid URL' });
    }

    // Generate or use custom short code
    let shortCode;
    if (customCode) {
      // Validate custom code
      if (!/^[a-zA-Z0-9]+$/.test(customCode)) {
        return res.status(400).json({ error: 'Custom code can only contain letters and numbers' });
      }

      // Check if custom code already exists
      const existingUrl = await Url.findOne({ shortCode: customCode });
      if (existingUrl) {
        return res.status(400).json({ error: 'Custom code already exists. Please choose a different one.' });
      }
      
      shortCode = customCode;
    } else {
      // Generate unique short code
      do {
        shortCode = nanoid(6);
      } while (await Url.findOne({ shortCode }));
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const shortUrl = `${baseUrl}/${shortCode}`;

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(shortUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Create new URL document
    const newUrl = new Url({
      originalUrl,
      shortCode,
      shortUrl,
      qrCode: qrCodeDataUrl
    });

    await newUrl.save();

    res.status(201).json({
      id: newUrl._id,
      originalUrl: newUrl.originalUrl,
      shortCode: newUrl.shortCode,
      shortUrl: newUrl.shortUrl,
      qrCode: newUrl.qrCode,
      clicks: newUrl.clicks,
      createdAt: newUrl.createdAt
    });

  } catch (error) {
    console.error('Shorten URL error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all URLs with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const urls = await Url.find({ isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-analytics'); // Exclude analytics for performance

    const total = await Url.countDocuments({ isActive: true });

    res.json({
      urls: urls.map(url => ({
        id: url._id,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        shortUrl: url.shortUrl,
        clicks: url.clicks,
        qrCode: url.qrCode,
        createdAt: url.createdAt
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUrls: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get URLs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single URL by ID with analytics
router.get('/:id', async (req, res) => {
  try {
    const url = await Url.findById(req.params.id);
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const analytics = url.getClickAnalytics();

    res.json({
      id: url._id,
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      shortUrl: url.shortUrl,
      clicks: url.clicks,
      qrCode: url.qrCode,
      createdAt: url.createdAt,
      analytics
    });

  } catch (error) {
    console.error('Get URL error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update URL (for custom code or original URL)
router.put('/:id', async (req, res) => {
  try {
    const { originalUrl, customCode } = req.body;
    const url = await Url.findById(req.params.id);

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    // Validate original URL if provided
    if (originalUrl && !validator.isURL(originalUrl)) {
      return res.status(400).json({ error: 'Please provide a valid URL' });
    }

    // Handle custom code update
    if (customCode && customCode !== url.shortCode) {
      if (!/^[a-zA-Z0-9]+$/.test(customCode)) {
        return res.status(400).json({ error: 'Custom code can only contain letters and numbers' });
      }

      const existingUrl = await Url.findOne({ shortCode: customCode, _id: { $ne: url._id } });
      if (existingUrl) {
        return res.status(400).json({ error: 'Custom code already exists. Please choose a different one.' });
      }

      url.shortCode = customCode;
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      url.shortUrl = `${baseUrl}/${customCode}`;
      
      // Regenerate QR code with new URL
      url.qrCode = await QRCode.toDataURL(url.shortUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }

    if (originalUrl) {
      url.originalUrl = originalUrl;
    }

    await url.save();

    res.json({
      id: url._id,
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      shortUrl: url.shortUrl,
      clicks: url.clicks,
      qrCode: url.qrCode,
      createdAt: url.createdAt
    });

  } catch (error) {
    console.error('Update URL error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete URL (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const url = await Url.findById(req.params.id);

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    url.isActive = false;
    await url.save();

    res.json({ message: 'URL deleted successfully' });

  } catch (error) {
    console.error('Delete URL error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get analytics for a specific URL
router.get('/:id/analytics', async (req, res) => {
  try {
    const url = await Url.findById(req.params.id);
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const analytics = url.getClickAnalytics();
    
    res.json({
      shortCode: url.shortCode,
      shortUrl: url.shortUrl,
      originalUrl: url.originalUrl,
      createdAt: url.createdAt,
      ...analytics
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get dashboard statistics
router.get('/stats/dashboard', async (req, res) => {
  try {
    const totalUrls = await Url.countDocuments({ isActive: true });
    const totalClicks = await Url.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$clicks' } } }
    ]);

    // Get recent URLs
    const recentUrls = await Url.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('shortCode shortUrl originalUrl clicks createdAt');

    // Get top performing URLs
    const topUrls = await Url.find({ isActive: true })
      .sort({ clicks: -1 })
      .limit(5)
      .select('shortCode shortUrl originalUrl clicks createdAt');

    // Get clicks over time (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const clicksOverTime = await Url.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$analytics' },
      { $match: { 'analytics.timestamp': { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$analytics.timestamp'
            }
          },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalUrls,
      totalClicks: totalClicks[0]?.total || 0,
      recentUrls,
      topUrls,
      clicksOverTime
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
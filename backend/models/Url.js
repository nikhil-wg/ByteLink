import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  userAgent: String,
  ip: String,
  referer: String
});

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
    trim: true
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  shortUrl: {
    type: String,
    required: true
  },
  clicks: {
    type: Number,
    default: 0
  },
  qrCode: {
    type: String
  },
  analytics: [analyticsSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
urlSchema.index({ shortCode: 1 });
urlSchema.index({ createdAt: -1 });

// Virtual for formatted creation date
urlSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Method to get click analytics
urlSchema.methods.getClickAnalytics = function() {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    total: this.clicks,
    last24Hours: this.analytics.filter(a => a.timestamp >= last24Hours).length,
    last7Days: this.analytics.filter(a => a.timestamp >= last7Days).length,
    last30Days: this.analytics.filter(a => a.timestamp >= last30Days).length,
    topReferers: this.getTopReferers(),
    clicksByDay: this.getClicksByDay()
  };
};

// Method to get top referers
urlSchema.methods.getTopReferers = function() {
  const refererCounts = {};
  this.analytics.forEach(a => {
    const referer = a.referer || 'Direct';
    refererCounts[referer] = (refererCounts[referer] || 0) + 1;
  });

  return Object.entries(refererCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([referer, count]) => ({ referer, count }));
};

// Method to get clicks by day for the last 7 days
urlSchema.methods.getClicksByDay = function() {
  const days = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));
    
    const clicksForDay = this.analytics.filter(a => 
      a.timestamp >= dayStart && a.timestamp <= dayEnd
    ).length;

    days.push({
      date: dayStart.toISOString().split('T')[0],
      clicks: clicksForDay
    });
  }
  
  return days;
};

export const Url = mongoose.model('Url', urlSchema);
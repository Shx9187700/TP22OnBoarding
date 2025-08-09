const express = require('express');
const router = express.Router();

// Mock data for parking trends
const generateTrendData = (area, timeFrame) => {
  const now = new Date();
  const data = [];
  let periods, labels;

  switch (timeFrame) {
    case 'day':
      periods = 24;
      labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
      break;
    case 'week':
      periods = 7;
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      break;
    case 'month':
      periods = 30;
      labels = Array.from({ length: 30 }, (_, i) => i + 1);
      break;
    default:
      periods = 7;
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }

  const areaConfig = {
    'collins-street': { base: 0.75, amp: 0.18, phase: 0 },
    'bourke-street': { base: 0.85, amp: 0.12, phase: 1 },
    'flinders-lane': { base: 0.65, amp: 0.22, phase: 2 },
    'queen-street': { base: 0.70, amp: 0.15, phase: 3 },
    'elizabeth-street': { base: 0.60, amp: 0.25, phase: 4 },
    'spencer-street': { base: 0.80, amp: 0.10, phase: 5 },
  };
  const conf = areaConfig[area] || { base: 0.7, amp: 0.15, phase: 0 };

  for (let i = 0; i < periods; i++) {
    const sinWave = Math.sin((i + conf.phase) / periods * 2 * Math.PI);
    const occupancy = Math.max(0.1, Math.min(0.95, conf.base + conf.amp * sinWave + (Math.random() - 0.5) * 0.08));
    data.push({
      period: labels[i],
      occupancy: Math.round(occupancy * 100),
      availableSpots: Math.round((1 - occupancy) * 100),
      timestamp: new Date(now.getTime() - (periods - i - 1) * (timeFrame === 'day' ? 3600000 : 86400000)).toISOString()
    });
  }
  return data;
};

// Get parking trends for a specific area and time frame
router.get('/:area', (req, res) => {
  try {
    const { area } = req.params;
    const { timeFrame = 'week' } = req.query;
    const validAreas = ['collins-street', 'bourke-street', 'flinders-lane', 'queen-street', 'elizabeth-street', 'spencer-street'];
    const validTimeFrames = ['day', 'week', 'month'];
    if (!validAreas.includes(area)) {
      return res.status(400).json({ success: false, error: 'Invalid area specified' });
    }
    if (!validTimeFrames.includes(timeFrame)) {
      return res.status(400).json({ success: false, error: 'Invalid time frame specified' });
    }
    const trendData = generateTrendData(area, timeFrame);
    const avgOccupancy = trendData.reduce((sum, item) => sum + item.occupancy, 0) / trendData.length;
    const maxOccupancy = Math.max(...trendData.map(item => item.occupancy));
    const minOccupancy = Math.min(...trendData.map(item => item.occupancy));
    const peakIdx = trendData.findIndex(item => item.occupancy === maxOccupancy);
    const bestIdx = trendData.findIndex(item => item.occupancy === minOccupancy);
    const peakTime = trendData[peakIdx]?.period || '';
    const bestTime = trendData[bestIdx]?.period || '';
    res.json({
      success: true,
      data: {
        area,
        timeFrame,
        trends: trendData,
        summary: {
          averageOccupancy: Math.round(avgOccupancy),
          maxOccupancy,
          minOccupancy,
          peakTime,
          bestTime,
          totalPeriods: trendData.length
        },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch parking trends' });
  }
});

// Get comparative trends across multiple areas
router.get('/compare/areas', (req, res) => {
  try {
    const { areas, timeFrame = 'week' } = req.query;
    
    if (!areas || !Array.isArray(areas.split(','))) {
      return res.status(400).json({
        success: false,
        error: 'Areas parameter is required and must be comma-separated'
      });
    }
    
    const areaList = areas.split(',');
    const comparisonData = {};
    
    areaList.forEach(area => {
      comparisonData[area] = generateTrendData(area, timeFrame);
    });
    
    res.json({
      success: true,
      data: {
        areas: areaList,
        timeFrame,
        comparison: comparisonData,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comparative trends'
    });
  }
});

// Get peak hours analysis
router.get('/analysis/peak-hours', (req, res) => {
  try {
    const { area } = req.query;
    
    const peakHoursData = {
      morning: {
        start: '8:00 AM',
        end: '10:00 AM',
        averageOccupancy: 85,
        description: 'Morning rush hour - high demand for CBD parking'
      },
      midday: {
        start: '12:00 PM',
        end: '2:00 PM',
        averageOccupancy: 70,
        description: 'Lunch time - moderate demand'
      },
      afternoon: {
        start: '4:00 PM',
        end: '6:00 PM',
        averageOccupancy: 90,
        description: 'Evening rush hour - highest demand period'
      },
      evening: {
        start: '7:00 PM',
        end: '9:00 PM',
        averageOccupancy: 60,
        description: 'Evening - decreasing demand'
      },
      night: {
        start: '10:00 PM',
        end: '6:00 AM',
        averageOccupancy: 30,
        description: 'Night time - lowest demand'
      }
    };
    
    res.json({
      success: true,
      data: {
        area: area || 'all',
        peakHours: peakHoursData,
        recommendations: [
          'Avoid parking between 4-6 PM for best availability',
          'Early morning (before 8 AM) offers the most spots',
          'Weekends generally have better availability',
          'Consider alternative transport during peak hours'
        ],
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch peak hours analysis'
    });
  }
});

// Get historical trend patterns
router.get('/analysis/patterns', (req, res) => {
  try {
    const patterns = {
      weekly: {
        monday: { occupancy: 80, description: 'Start of work week - high demand' },
        tuesday: { occupancy: 85, description: 'Peak mid-week demand' },
        wednesday: { occupancy: 82, description: 'Consistent high demand' },
        thursday: { occupancy: 88, description: 'Pre-weekend peak' },
        friday: { occupancy: 92, description: 'Highest demand of the week' },
        saturday: { occupancy: 65, description: 'Weekend shopping and events' },
        sunday: { occupancy: 45, description: 'Lowest demand day' }
      },
      monthly: {
        trend: 'increasing',
        averageGrowth: 2.5,
        description: 'Monthly parking demand shows steady increase',
        seasonalFactors: [
          'Holiday season (Dec-Jan): +15% demand',
          'Back to school (Feb): +10% demand',
          'Festival season (Mar-Apr): +20% demand',
          'Winter months (Jun-Aug): -5% demand'
        ]
      },
      yearly: {
        trend: 'strong growth',
        growthRate: 8.5,
        description: 'Year-over-year parking demand continues to grow',
        contributingFactors: [
          'CBD population growth',
          'Increased car ownership',
          'Limited new parking infrastructure',
          'Economic recovery post-pandemic'
        ]
      }
    };
    
    res.json({
      success: true,
      data: patterns,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trend patterns'
    });
  }
});

module.exports = router;

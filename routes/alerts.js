const express = require('express');
const router = express.Router();

// Mock data for alerts
let alerts = [
  {
    id: '1',
    type: 'parking_full',
    title: 'Collins Street Plaza is Full',
    message: 'Collins Street Plaza parking is currently at 100% capacity. Consider alternative locations.',
    severity: 'high',
    location: 'Collins Street Plaza',
    lat: -37.8136,
    lng: 144.9631,
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
    isActive: true
  },
  {
    id: '2',
    type: 'maintenance',
    title: 'Bourke Street Central Maintenance',
    message: 'Scheduled maintenance at Bourke Street Central. Reduced capacity expected.',
    severity: 'medium',
    location: 'Bourke Street Central',
    lat: -37.8143,
    lng: 144.9632,
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
    isActive: true
  },
  {
    id: '3',
    type: 'price_change',
    title: 'New Pricing at Spencer Street Station',
    message: 'Hourly rates at Spencer Street Station have been updated. Check new rates before parking.',
    severity: 'low',
    location: 'Spencer Street Station',
    lat: -37.8183,
    lng: 144.9539,
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    isActive: true
  }
];

// Get all active alerts
router.get('/', (req, res) => {
  try {
    const { type, severity, location } = req.query;
    
    let filteredAlerts = alerts.filter(alert => alert.isActive);
    
    // Filter by type
    if (type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === type);
    }
    
    // Filter by severity
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    
    // Filter by location
    if (location) {
      filteredAlerts = filteredAlerts.filter(alert => 
        alert.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    // Remove expired alerts
    const now = new Date();
    filteredAlerts = filteredAlerts.filter(alert => new Date(alert.expiresAt) > now);
    
    res.json({
      success: true,
      data: filteredAlerts,
      total: filteredAlerts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts'
    });
  }
});

// Get alert by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const alert = alerts.find(a => a.id === id && a.isActive);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    
    // Check if alert is expired
    if (new Date(alert.expiresAt) <= new Date()) {
      return res.status(404).json({
        success: false,
        error: 'Alert has expired'
      });
    }
    
    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert'
    });
  }
});

// Create new alert
router.post('/', (req, res) => {
  try {
    const { type, title, message, severity, location, lat, lng, expiresIn } = req.body;
    
    // Validation
    if (!type || !title || !message || !severity || !location) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const validTypes = ['parking_full', 'maintenance', 'price_change', 'event', 'weather'];
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid alert type'
      });
    }
    
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid severity level'
      });
    }
    
    const newAlert = {
      id: Date.now().toString(),
      type,
      title,
      message,
      severity,
      location,
      lat: lat || null,
      lng: lng || null,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (expiresIn || 24) * 60 * 60 * 1000).toISOString(),
      isActive: true
    };
    
    alerts.push(newAlert);
    
    res.status(201).json({
      success: true,
      data: newAlert,
      message: 'Alert created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create alert'
    });
  }
});

// Update alert
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const alertIndex = alerts.findIndex(a => a.id === id);
    
    if (alertIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    
    // Update allowed fields
    const allowedFields = ['title', 'message', 'severity', 'isActive', 'expiresAt'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        alerts[alertIndex][field] = updateData[field];
      }
    });
    
    res.json({
      success: true,
      data: alerts[alertIndex],
      message: 'Alert updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update alert'
    });
  }
});

// Delete alert (deactivate)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const alertIndex = alerts.findIndex(a => a.id === id);
    
    if (alertIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    
    alerts[alertIndex].isActive = false;
    
    res.json({
      success: true,
      message: 'Alert deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate alert'
    });
  }
});

// Get alerts by location
router.get('/location/:locationId', (req, res) => {
  try {
    const { locationId } = req.params;
    const locationAlerts = alerts.filter(alert => 
      alert.isActive && 
      alert.location.toLowerCase().includes(locationId.toLowerCase())
    );
    
    res.json({
      success: true,
      data: locationAlerts,
      total: locationAlerts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch location alerts'
    });
  }
});

// Get alert statistics
router.get('/stats/overview', (req, res) => {
  try {
    const activeAlerts = alerts.filter(alert => alert.isActive);
    const now = new Date();
    const nonExpiredAlerts = activeAlerts.filter(alert => new Date(alert.expiresAt) > now);
    
    const stats = {
      totalActive: activeAlerts.length,
      totalNonExpired: nonExpiredAlerts.length,
      byType: {
        parking_full: activeAlerts.filter(a => a.type === 'parking_full').length,
        maintenance: activeAlerts.filter(a => a.type === 'maintenance').length,
        price_change: activeAlerts.filter(a => a.type === 'price_change').length,
        event: activeAlerts.filter(a => a.type === 'event').length,
        weather: activeAlerts.filter(a => a.type === 'weather').length
      },
      bySeverity: {
        low: activeAlerts.filter(a => a.severity === 'low').length,
        medium: activeAlerts.filter(a => a.severity === 'medium').length,
        high: activeAlerts.filter(a => a.severity === 'high').length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length
      },
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert statistics'
    });
  }
});

module.exports = router;

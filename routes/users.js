const express = require('express');
const router = express.Router();

// Mock user data
let users = [
  {
    id: '1',
    email: 'user@example.com',
    name: 'John Doe',
    phone: '+61412345678',
    preferences: {
      notifications: true,
      emailAlerts: true,
      pushNotifications: true,
      favoriteLocations: ['Collins Street Plaza', 'Spencer Street Station']
    },
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  }
];

// Get user profile
router.get('/profile', (req, res) => {
  try {
    // In a real app, this would get user from JWT token
    const userId = req.headers['user-id'] || '1';
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Remove sensitive data
    const { email, ...userProfile } = user;
    
    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

// Update user profile
router.put('/profile', (req, res) => {
  try {
    const userId = req.headers['user-id'] || '1';
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const updateData = req.body;
    const allowedFields = ['name', 'phone', 'preferences'];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        users[userIndex][field] = updateData[field];
      }
    });
    
    res.json({
      success: true,
      data: users[userIndex],
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile'
    });
  }
});

// Get user preferences
router.get('/preferences', (req, res) => {
  try {
    const userId = req.headers['user-id'] || '1';
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user.preferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user preferences'
    });
  }
});

// Update user preferences
router.put('/preferences', (req, res) => {
  try {
    const userId = req.headers['user-id'] || '1';
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const preferences = req.body;
    
    // Validate preferences
    if (preferences.notifications !== undefined && typeof preferences.notifications !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid notification preference'
      });
    }
    
    if (preferences.emailAlerts !== undefined && typeof preferences.emailAlerts !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid email alerts preference'
      });
    }
    
    if (preferences.pushNotifications !== undefined && typeof preferences.pushNotifications !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid push notifications preference'
      });
    }
    
    if (preferences.favoriteLocations !== undefined && !Array.isArray(preferences.favoriteLocations)) {
      return res.status(400).json({
        success: false,
        error: 'Favorite locations must be an array'
      });
    }
    
    // Update preferences
    Object.assign(users[userIndex].preferences, preferences);
    
    res.json({
      success: true,
      data: users[userIndex].preferences,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update user preferences'
    });
  }
});

// Add favorite location
router.post('/favorites', (req, res) => {
  try {
    const userId = req.headers['user-id'] || '1';
    const { location } = req.body;
    
    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'Location is required'
      });
    }
    
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    if (!users[userIndex].preferences.favoriteLocations.includes(location)) {
      users[userIndex].preferences.favoriteLocations.push(location);
    }
    
    res.json({
      success: true,
      data: users[userIndex].preferences.favoriteLocations,
      message: 'Favorite location added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add favorite location'
    });
  }
});

// Remove favorite location
router.delete('/favorites/:location', (req, res) => {
  try {
    const userId = req.headers['user-id'] || '1';
    const { location } = req.params;
    
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const locationIndex = users[userIndex].preferences.favoriteLocations.indexOf(location);
    
    if (locationIndex > -1) {
      users[userIndex].preferences.favoriteLocations.splice(locationIndex, 1);
    }
    
    res.json({
      success: true,
      data: users[userIndex].preferences.favoriteLocations,
      message: 'Favorite location removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to remove favorite location'
    });
  }
});

// Get user activity history
router.get('/activity', (req, res) => {
  try {
    const userId = req.headers['user-id'] || '1';
    const { limit = 10, offset = 0 } = req.query;
    
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Mock activity data
    const activities = [
      {
        id: '1',
        type: 'parking_search',
        location: 'Collins Street Plaza',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        details: 'Searched for parking availability'
      },
      {
        id: '2',
        type: 'alert_received',
        location: 'Bourke Street Central',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        details: 'Received maintenance alert'
      },
      {
        id: '3',
        type: 'favorite_added',
        location: 'Spencer Street Station',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        details: 'Added to favorites'
      }
    ];
    
    const paginatedActivities = activities.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    res.json({
      success: true,
      data: {
        activities: paginatedActivities,
        total: activities.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user activity'
    });
  }
});

// Update last login
router.post('/login', (req, res) => {
  try {
    const userId = req.headers['user-id'] || '1';
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    users[userIndex].lastLogin = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Login recorded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to record login'
    });
  }
});

module.exports = router;

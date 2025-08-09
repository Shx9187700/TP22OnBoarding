const express = require('express');
const router = express.Router();
const axios = require('axios');

// Reverse geocoding function to get address from coordinates
async function getAddressFromCoordinates(lat, lng) {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: {
        'User-Agent': 'LordOfPark/1.0'
      }
    });
    
    if (response.data && response.data.display_name) {
      return response.data.display_name;
    }
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    return null;
  }
}

// api
const PARKING_API_URL = 'https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/on-street-parking-bay-sensors/records?limit=100';

// cache
let cachedParkingZones = [];
let lastUpdated = null;

//auto get data
async function fetchAndGroupParkingData() {
  try {
    const response = await axios.get(PARKING_API_URL);
    const raw = response.data.results;

    const zoneMap = {};



    

     

     // First pass: collect all unique zones and prepare data
     const zoneData = {};
     raw.forEach((record) => {
       const { zone_number, status_description, kerbsideid, location, lastupdated, street_name, street_number, suburb, streetname, streetnumber, suburb_name, street, road, thoroughfare, bay_id, bay_number } = record;
       if (!zone_number || !kerbsideid || !location) return;

       if (!zoneData[zone_number]) {
         zoneData[zone_number] = {
           zone_number,
           location,
           lastupdated,
           street_name: street_name || streetname || street || road || thoroughfare || `Zone ${zone_number}`,
           street_number: street_number || streetnumber || '',
           suburb: suburb || suburb_name || 'Melbourne',
           totalSpots: 0,
           availableSpots: 0
         };
       }

      if (status_description === 'Unoccupied' || status_description === 'Present') {
        zoneData[zone_number].totalSpots += 1;
        if (status_description === 'Unoccupied') {
          zoneData[zone_number].availableSpots += 1;
        }
      }
    });

    // Second pass: process zones with async operations
    for (const [zoneNumber, data] of Object.entries(zoneData)) {
      const { location, lastupdated, street_name, street_number, suburb, totalSpots, availableSpots } = data;
      
      // Try to get more accurate address from coordinates
      let accurateAddress = null;
      try {
        accurateAddress = await getAddressFromCoordinates(location.lat, location.lon);
      } catch (error) {
        console.log(`Failed to get address for zone ${zoneNumber}:`, error.message);
      }
      
             // Create realistic parking name based on street
       let parkingName;
       
       // Try to extract street name from accurate address first
       if (accurateAddress) {
         const addressParts = accurateAddress.split(', ');
         const streetPart = addressParts.find(part => 
           part.includes('Street') || part.includes('Lane') || part.includes('Avenue') || part.includes('Road')
         );
         if (streetPart) {
           parkingName = `${streetPart} Parking`;
         } else if (street_name && street_name !== `Zone ${zoneNumber}` && !street_name.startsWith('Zone ')) {
           // Use API street name as fallback
           if (street_name.includes('Street') || street_name.includes('Lane') || street_name.includes('Avenue') || street_name.includes('Road')) {
             parkingName = `${street_name} Parking`;
           } else {
             parkingName = `${street_name} Parking Zone`;
           }
         } else {
           parkingName = `Zone ${zoneNumber} Parking`;
         }
       } else if (street_name && street_name !== `Zone ${zoneNumber}` && !street_name.startsWith('Zone ')) {
         // Use API street name if no accurate address
         if (street_name.includes('Street') || street_name.includes('Lane') || street_name.includes('Avenue') || street_name.includes('Road')) {
           parkingName = `${street_name} Parking`;
         } else {
           parkingName = `${street_name} Parking Zone`;
         }
       } else {
         // Fallback to zone number if no real street name
         parkingName = `Zone ${zoneNumber} Parking`;
       }
      
      // Use accurate address if available, otherwise build from API data
      let fullAddress;
      if (accurateAddress) {
        fullAddress = accurateAddress;
      } else {
        const addressParts = [];
        if (street_number) addressParts.push(street_number);
        addressParts.push(street_name);
        if (suburb && suburb !== 'Melbourne') addressParts.push(suburb);
        addressParts.push('Melbourne VIC 3000');
        fullAddress = addressParts.join(', ');
      }
      
      zoneMap[zoneNumber] = {
        id: zoneNumber.toString(),
        name: parkingName,
        address: fullAddress,
        lat: location.lat,
        lng: location.lon,
        availability: 'unknown',
        totalSpots,
        availableSpots,
        pricePerHour: 6.5,
        maxDuration: '4 hours',
        lastUpdated: lastupdated,
        features: ['covered', 'security'],
        operatingHours: '24/7',
        // Store additional API data
        streetName: street_name,
        streetNumber: street_number,
        suburb: suburb,
        zoneNumber: parseInt(zoneNumber),
        accurateAddress: accurateAddress
      };
    }

    // set availability 
    Object.values(zoneMap).forEach((zone) => {
      if (zone.availableSpots === 0) zone.availability = 'full';
      else if (zone.availableSpots / zone.totalSpots < 0.2) zone.availability = 'limited';
      else zone.availability = 'available';
    });

    cachedParkingZones = Object.values(zoneMap);
    lastUpdated = new Date().toISOString();
    console.log(`Real-time parking data updated (${cachedParkingZones.length} zones)`);
  } catch (err) {
    console.error("Failed to fetch parking data:", err.message);
  }
}

// 125s/time
fetchAndGroupParkingData();
setInterval(fetchAndGroupParkingData, 125 * 1000);

// GET /api/parking
router.get('/', (req, res) => {
  const { search, availability, maxPrice } = req.query;
  let result = [...cachedParkingZones];

  if (search) {
    const s = search.toLowerCase();
    result = result.filter(
      z => z.name.toLowerCase().includes(s) || z.address.toLowerCase().includes(s)
    );
  }

  if (availability) {
    result = result.filter(z => z.availability === availability);
  }

  if (maxPrice) {
    result = result.filter(z => z.pricePerHour <= parseFloat(maxPrice));
  }

  res.json({ success: true, data: result, total: result.length });
});

// GET /api/parking/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const zone = cachedParkingZones.find(z => z.id === id);
  if (!zone) {
    return res.status(404).json({ success: false, error: 'Zone not found' });
  }
  res.json({ success: true, data: zone });
});

// GET /api/parking/stats/overview
router.get('/stats/overview', (req, res) => {
  const totalSpots = cachedParkingZones.reduce((sum, z) => sum + z.totalSpots, 0);
  const availableSpots = cachedParkingZones.reduce((sum, z) => sum + z.availableSpots, 0);
  const totalLocations = cachedParkingZones.length;
  const avgPrice = cachedParkingZones.reduce((sum, z) => sum + z.pricePerHour, 0) / totalLocations;

  const availabilityStats = {
    available: cachedParkingZones.filter(z => z.availability === 'available').length,
    limited: cachedParkingZones.filter(z => z.availability === 'limited').length,
    full: cachedParkingZones.filter(z => z.availability === 'full').length
  };

  res.json({
    success: true,
    data: {
      totalSpots,
      availableSpots,
      totalLocations,
      averagePrice: Math.round(avgPrice * 100) / 100,
      availabilityStats,
      lastUpdated
    }
  });
});

// GET /api/parking/search/location
router.get('/search/location', (req, res) => {
  const { lat, lng, radius = 2 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      error: 'Latitude and longitude are required'
    });
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  const radiusKm = parseFloat(radius);

  const nearby = cachedParkingZones.filter(zone => {
    const d = getDistance(userLat, userLng, zone.lat, zone.lng);
    return d <= radiusKm;
  });

  res.json({ success: true, data: nearby, total: nearby.length });
});

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = router;

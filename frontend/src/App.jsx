import { useState, useEffect } from 'react'

function App() {
  const [forecast, setForecast] = useState([])

  useEffect(() => {
    fetch('/api/weatherforecast')
      .then(response => response.json())
      .then(data => setForecast(data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  return (
    <>
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Weather Forecast</h1>
        {forecast.length > 0 ? (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {forecast.map((day, index) => (
              <li key={index} style={{ marginBottom: '1rem', border: '1px solid #ddd', padding: '1rem', borderRadius: '4px' }}>
                <strong>{day.date}</strong>: {day.temperatureC}°C ({day.summary})
              </li>
            ))}
          </ul>
        ) : (
          <p>Loading weather data from ASP.NET backend...</p>
        )}
      </div>
    </>
  )
}

export default App

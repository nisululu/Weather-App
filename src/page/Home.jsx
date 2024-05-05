import axios from 'axios'
import React, { Fragment, useEffect, useState } from 'react'
import './Home.css'
import { fetchWeatherApi } from 'openmeteo'
import dayjs from 'dayjs'
import { data } from '../metaData'

const Home = () => {
  const [input, setInput] = useState("")
  const [weatherData, setWeatherData] = useState(null)
  const handleChange = (e) => {
    setInput(e.target.value)
  }

  useEffect(() => {
    const getData = async () => {
      const { data } = await axios.get(`https://api.geoapify.com/v1/geocode/search?name=${input}&apiKey=${import.meta.env.VITE_API_KEY}`)

      const params = {
        "latitude": data?.features?.[0]?.properties.lat,
        "longitude": data?.features?.[0]?.properties.lon,
        "current": ["temperature_2m", "precipitation", "rain", "showers", "weather_code", "wind_speed_10m"],
        "daily": ["weather_code", "temperature_2m_max", "temperature_2m_min"],
      }
      const url = "https://api.open-meteo.com/v1/forecast"
      const responses = await fetchWeatherApi(url, params)

      // Helper function to form time ranges
      const range = (start, stop, step) =>
        Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

      const response = responses[0]

      const utcOffsetSeconds = response.utcOffsetSeconds();
      const current = response.current();
      const daily = response.daily()

      const weatherData = {
        current: {
          time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
          temperature: current.variables(0)?.value(), // Current is only 1 value, therefore `.value()`
          perception: current.variables(1)?.value(),
          rain: current.variables(2)?.value(),
          showers: current.variables(3)?.value(),
          weatherCode: current.variables(4)?.value(),
          wind_speed_10m: current.variables(5)?.value()
        },
        daily: {
          time: range(Number(daily.time()), Number(daily.timeEnd()), daily.interval()).map(
            (t) => new Date((t + utcOffsetSeconds) * 1000)
          ),
          weatherCode: daily.variables(0)?.valuesArray(),
          temperature2mMax: daily.variables(1)?.valuesArray(),
          temperature2mMin: daily.variables(2)?.valuesArray(),
        },
      }

      setWeatherData(weatherData)
    }

    let timer = setTimeout(() => {
      if (input) getData()
    }, 600)

    return () => clearTimeout(timer)
  }, [input])

  let dailyData = []
  for (let i = 1; i < weatherData?.daily?.time.length - 2; i++) {
    dailyData.push(
      <div className='dailyWeather' key={i}>
        <img className='dailyImg' src={data[weatherData?.daily?.weatherCode[i]]?.icon} alt="img" srcSet="" />
        <span className='minmax'>{`${Math.floor(weatherData?.daily?.temperature2mMin[i])}° / ${Math.floor(weatherData?.daily?.temperature2mMax[i])}°`}</span>
        <span className='day'>{weatherData?.daily?.time[i] === weatherData?.daily?.time[1] ? "Tom" : dayjs(weatherData?.daily?.time[i].toISOString()).format('ddd')}</span>
      </div>
    )
  }

  return (
    <Fragment>
      <main className='main'>
        <div className='intro'>
          <span>Right now in </span>
          <input type="text" onChange={handleChange} placeholder='"Search here"' />
          {input && <div>{data[weatherData?.current?.weatherCode]?.desc}</div>}
        </div>
        {
          weatherData && (
            <>
              <section className='currentWeather'>
                <img className='image' src={data[weatherData?.current?.weatherCode]?.icon} alt="IMG" srcSet="" />
                <div className='currentTemperature'>
                  <span className='temp'>{Math.floor(weatherData.current?.temperature)}</span>
                  <span>{`${Math.floor(weatherData.daily?.temperature2mMin[0])}° / ${Math.floor(weatherData.daily?.temperature2mMax[0])}°`}</span>
                </div>
                <div className='additionalInformation'>
                  <div>
                    <img src="wind.svg" alt="" srcSet="" />
                    <span>{Math.floor(weatherData.current?.wind_speed_10m) || 0} mph</span>
                  </div>
                  <div>
                    <img src="umbrella.svg" alt="" srcSet="" />
                    <span>{Math.floor(weatherData.current?.rain) || 0} %</span>
                  </div>
                  <div>
                    <img src="droplet.svg" alt="" srcSet="" />
                    <span>{Math.floor(weatherData.current?.showers) || 0} %</span>
                  </div>
                </div>
              </section>
              <section className='dailyWeathers'>
                {
                  dailyData
                }
              </section>
            </>
          )
        }

      </main>
    </Fragment>
  )
}

export default Home

// --- FORECAST.JS ----------------------------------------------------------------------------------------
/**
 * Holds the forecast module logic and pipeline
 * - Variables
 * - Populating the module
 * - Date format
 * - Weather status
 * - Air quality logic
 * - Display options
 */

// === Variables ===
// - Containers -
const weatherContainer = document.getElementById('result-weather')
const weatherContainerDay1 = document.getElementById('day1')
const weatherContainerDay2 = document.getElementById('day2')
const weatherContainerDay3 = document.getElementById('day3')
// - Current -
const weatherCapitalName = document.getElementById('capital-name')
const weatherCurrentDate = document.getElementById('weather-sub-date')
const weatherCurrentIcon = document.getElementById('weather-icon')
const weatherCurrentStatus = document.getElementById('weather-status')
const weatherCurrentTemp = document.getElementById('weather-temperature')
const weatherCurrentFeel = document.getElementById('weather-feels-like')
const weatherWind = document.getElementById('weather-wind')
const weatherHumidity = document.getElementById('weather-humidity')
const weatherAirQ = document.getElementById('weather-airQ')
// - 3-day Forecast -
const weatherDateDay1 = document.getElementById('date-day1')
const weatherIconDay1 = document.getElementById('icon-day1')
const weatherHighDay1 = document.getElementById('high-day1')
const weatherLowDay1 = document.getElementById('low-day1')
const weatherDateDay2 = document.getElementById('date-day2')
const weatherIconDay2 = document.getElementById('icon-day2')
const weatherHighDay2 = document.getElementById('high-day2')
const weatherLowDay2 = document.getElementById('low-day2')
const weatherDateDay3 = document.getElementById('date-day3')
const weatherIconDay3 = document.getElementById('icon-day3')
const weatherHighDay3 = document.getElementById('high-day3')
const weatherLowDay3 = document.getElementById('low-day3')

// === Functions ===
function populateForecast(capital, weatherData, airQValue) {
    const airQStatus = getAirQStatus(airQValue)
    const isDay = weatherData.current.is_day

    weatherContainer.style.backgroundColor = setWeatherBackground(weatherData.current.weather_code, isDay).bg
    weatherContainer.style.color = setWeatherBackground(weatherData.current.weather_code, isDay).text

    weatherCapitalName.innerText = `Today in ${capital}`
    weatherCurrentDate.innerText = formatDate(weatherData.current.time, 'long', true)
    weatherCurrentIcon.src = getWeatherStatus(weatherData.current.weather_code, isDay).icon
    weatherCurrentStatus.innerText = getWeatherStatus(weatherData.current.weather_code, isDay).status
    weatherCurrentTemp.innerText = `${weatherData.current.temperature_2m}°C`
    weatherCurrentFeel.innerText = `(Feels like ${weatherData.current.apparent_temperature}°C)`
    weatherWind.innerText = `${weatherData.current.wind_speed_10m} km/h`
    weatherHumidity.innerText = `${weatherData.current.relative_humidity_2m}%`
    weatherAirQ.innerText = `${airQValue} - ${airQStatus.label}`
    weatherAirQ.style.backgroundColor = airQStatus.color
    weatherAirQ.style.color = airQStatus.text
    weatherContainerDay1.style.backgroundColor = setWeatherBackground(weatherData.daily.weather_code[2], 1).bg
    weatherDateDay1.innerText = formatDate(weatherData.daily.time[2], 'short', false)
    weatherIconDay1.src = getWeatherStatus(weatherData.daily.weather_code[2], 1).icon
    weatherHighDay1.innerText = `High: ${weatherData.daily.temperature_2m_max[2]}°C (${weatherData.daily.apparent_temperature_max[0]}°C)`
    weatherLowDay1.innerText = `Low: ${weatherData.daily.temperature_2m_min[2]}°C (${weatherData.daily.apparent_temperature_min[0]}°C)`
    weatherContainerDay2.style.backgroundColor = setWeatherBackground(weatherData.daily.weather_code[3], 1).bg
    weatherDateDay2.innerText =  formatDate(weatherData.daily.time[3], 'short', false)
    weatherIconDay2.src = getWeatherStatus(weatherData.daily.weather_code[3], 1).icon
    weatherHighDay2.innerText = `High: ${weatherData.daily.temperature_2m_max[3]}°C (${weatherData.daily.apparent_temperature_max[1]}°C)`
    weatherLowDay2.innerText = `Low: ${weatherData.daily.temperature_2m_min[3]}°C (${weatherData.daily.apparent_temperature_min[1]}°C)`
    weatherContainerDay3.style.backgroundColor = setWeatherBackground(weatherData.daily.weather_code[4], 1).bg
    weatherDateDay3.innerText = formatDate(weatherData.daily.time[4], 'short', false)
    weatherIconDay3.src = getWeatherStatus(weatherData.daily.weather_code[4], 1).icon
    weatherHighDay3.innerText = `High: ${weatherData.daily.temperature_2m_max[4]}°C (${weatherData.daily.apparent_temperature_max[2]}°C)`
    weatherLowDay3.innerText = `Low: ${weatherData.daily.temperature_2m_min[4]}°C (${weatherData.daily.apparent_temperature_min[2]}°C)`
}

function formatDate(date, length, withTime) {
    const newDate = new Date(date)

    const formattedDate = new Intl.DateTimeFormat('en-GB', {
        weekday: length, 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric', 
    }).format(newDate)

    const cleanDate = formattedDate.replace(/,/g, '')

    if (withTime) {
        const formattedTime = new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(newDate)

        
        const cleanTime = formattedTime.replace(/,/g, '')

        return `${cleanDate} - ${cleanTime}`
    }

    return cleanDate
}

function getAirQStatus(level) {
    if (level <= 50) {
        return {label: 'Good', color: "#00e400", text: "#000"}
    } else if (level > 50 && level <= 100) {
        return {label: 'Moderate', color: "#ffff00", text: "#000"}
    } else if (level > 100 && level <= 150) {
        return {label: 'Unhealthy', color: "#ff7e00", text: "#000"}
    } else if (150 && level <= 200) {
        return {label: 'Bad', color: "#ff0000", text: "#fff"}
    } else if (200 && level <= 300) {
        return {label: 'Very Bad', color: "#8f3f97", text: "#fff"}
    } else {
        return {label: 'Hazardous', color: '#7e0023', text: "#fff"}
    }
}

function getWeatherStatus(wmoCode, isDay) {
    const iconMap = {
        // 1. CLEAR & CLOUDY
        0: {file: 'sunny.png', status: 'Sunny', night: 'Clear'},
        1: {file: 'cloudy.png', status: 'Mainly Sunny', night: 'Mainly Clear'},
        2: {file: 'cloudy.png', status: 'Partly Cloudy', night: 'Partly Cloudy'},
        3: {file: 'overcast.png', status: 'Cloudy', night: 'Cloudy'}, 
        
        // 2. ATMOSPHERIC & RAIN
        45: {file: 'fog.png', status: 'Foggy', night: 'Foggy'},
        48: {file: 'fog.png', status: 'Rime Fog', night: 'Rime Fog'}, 
        51: {file: 'light-drizzle.png', status: 'Light Drizzle', night: 'Light Drizzle'}, 
        53: {file: 'light-drizzle.png', status: 'Drizzle', night: 'Drizzle'},
        55: {file: 'heavy-drizzle.png', status: 'Heavy Drizzle', night: 'Heavy Drizzle'},
        56: {file: 'freezing-drizzle.png', status: 'Light Freezing Drizzle', night: 'Light Freezing Drizzle'},
        57: {file: 'freezing-drizzle.png', status: 'Freezing Drizzle', night: 'Freezing Drizzle'},
        61: {file: 'light-rain.png', status: 'Light Rain', night: 'Light Rain'},
        63: {file: 'heavy-rain.png', status: 'Rain', night: 'Rain'},
        65: {file: 'heavy-rain.png', status: 'Heavy Rain', night: 'Heavy Rain'},
        66: {file: 'light-freezing-rain.png', status: 'Light Freezing Rain', night: 'Light Freezing Rain'}, 
        67: {file: 'heavy-freezing-rain.png', status: 'Freezing Rain', night: 'Freezing Rain'},
        
        // 3. SNOW & WINTER
        71: {file: 'light-snow.png', status: 'Light Snow', night: 'Light Snow'},
        73: {file: 'light-snow.png', status: 'Snow', night: 'Snow'},
        75: {file: 'heavy-snow.png', status: 'Heavy Snow', night: 'Heavy Snow'}, 
        77: {file: 'heavy-snow.png', status: 'Snow Grains', night: 'Snow Grains'},

        // 4. SEVERE & SHOWERS
        80: {file: 'light-rain.png', status: 'Light Showers', night: 'Light Showers'},
        81: {file: 'heavy-rain.png', status: 'Showers', night: 'Showers'},
        82: {file: 'heavy-rain.png', status: 'Heavy Showers', night: 'Heavy Showers'},
        85: {file: 'light-snow.png', status: 'Light Snow Showers', night: 'Light Snow Showers'},
        86: {file: 'heavy-snow.png', status: 'Snow Showers', night: 'Snow Showers'},
        95: {file: 'lightning.png', status: 'Thunderstorm', night: 'Thunderstorm'},
        96: {file: 'hail.png', status: 'Light Thunderstorms With Hail', night: 'Light Thunderstorms With Hail'}, 
        99: {file: 'hail.png', status: 'Thunderstorms With Hail', night: 'Thunderstorms With Hail'} 
    }

    if (isDay === 0) {
        return {icon: `images/night.png`, status: `${iconMap[wmoCode].night}`}
    } else {
        return {icon: `images/${iconMap[wmoCode].file}`, status: `${iconMap[wmoCode].status}`}
    }
}

function setWeatherBackground(wmoCode, isDay) {
    if (!isDay) {
        return {bg: `#240252`, text: `#ffffff`}
    }

    switch(true) {
        case wmoCode < 3: return {bg: `#19a7ff`, text: `#000000`}
        case wmoCode === 3: return {bg: `#73b5de`, text: `#000000`}
        case wmoCode <= 67: return {bg: `#95a7b2`, text: `#000000`}
        case wmoCode <= 77: return {bg: `#b6c4c7`, text: `#000000`}
        case wmoCode <= 99: return {bg: `#6d6d6e`, text: `#000000`}
    }
}


const axios = require('axios');
const { DynamicTool } = require('@langchain/core/tools');
const { config } = require('../config/config');

class WeatherTool {
  constructor() {
    this.apiKey = config.weather.apiKey;
    this.baseUrl = config.weather.baseUrl;
  }

  // Create LangChain tool
  createTool() {
    return new DynamicTool({
      name: "weather_query",
      description: "查詢指定城市的當前天氣資訊。輸入參數：城市名稱（中文或英文）",
      func: async (cityName) => {
        try {
          return await this.getWeather(cityName);
        } catch (error) {
          console.error('Weather tool error:', error);
          return `抱歉，無法取得 ${cityName} 的天氣資訊：${error.message}`;
        }
      }
    });
  }

  // Get weather for a city
  async getWeather(cityName) {
    if (!this.apiKey) {
      throw new Error('Weather API key not configured');
    }

    try {
      // First get coordinates for the city
      const geoUrl = `http://api.openweathermap.org/geo/1.0/direct`;
      const geoResponse = await axios.get(geoUrl, {
        params: {
          q: cityName,
          limit: 1,
          appid: this.apiKey
        },
        timeout: 10000
      });

      if (!geoResponse.data || geoResponse.data.length === 0) {
        throw new Error(`找不到城市：${cityName}`);
      }

      const { lat, lon, name, country } = geoResponse.data[0];

      // Get weather data
      const weatherUrl = `${this.baseUrl}/weather`;
      const weatherResponse = await axios.get(weatherUrl, {
        params: {
          lat: lat,
          lon: lon,
          appid: this.apiKey,
          units: 'metric',
          lang: 'zh_tw'
        },
        timeout: 10000
      });

      const weather = weatherResponse.data;
      
      return this.formatWeatherResponse(weather, name, country);

    } catch (error) {
      if (error.response) {
        throw new Error(`API 錯誤：${error.response.status} - ${error.response.statusText}`);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('請求超時，請稍後再試');
      } else {
        throw new Error(error.message || '天氣查詢失敗');
      }
    }
  }

  // Format weather response
  formatWeatherResponse(weather, cityName, country) {
    const {
      main: { temp, feels_like, humidity, pressure },
      weather: [{ main: weatherMain, description }],
      wind: { speed },
      visibility,
      name
    } = weather;

    const weatherEmoji = this.getWeatherEmoji(weatherMain);
    
    return `
🌍 ${cityName}, ${country}

${weatherEmoji} 天氣狀況：${description}
🌡️ 溫度：${Math.round(temp)}°C (體感 ${Math.round(feels_like)}°C)
💧 濕度：${humidity}%
🎈 氣壓：${pressure} hPa
💨 風速：${speed} m/s
👁️ 能見度：${Math.round(visibility / 1000)} km

資料來源：OpenWeatherMap
    `.trim();
  }

  // Get weather emoji based on weather condition
  getWeatherEmoji(weatherMain) {
    const emojiMap = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️',
      'Dust': '🌪️',
      'Sand': '🌪️',
      'Ash': '🌋',
      'Squall': '💨',
      'Tornado': '🌪️'
    };

    return emojiMap[weatherMain] || '🌤️';
  }

  // Get weather forecast (5-day forecast)
  async getWeatherForecast(cityName) {
    if (!this.apiKey) {
      throw new Error('Weather API key not configured');
    }

    try {
      // Get coordinates
      const geoUrl = `http://api.openweathermap.org/geo/1.0/direct`;
      const geoResponse = await axios.get(geoUrl, {
        params: {
          q: cityName,
          limit: 1,
          appid: this.apiKey
        }
      });

      if (!geoResponse.data || geoResponse.data.length === 0) {
        throw new Error(`找不到城市：${cityName}`);
      }

      const { lat, lon, name, country } = geoResponse.data[0];

      // Get forecast data
      const forecastUrl = `${this.baseUrl}/forecast`;
      const forecastResponse = await axios.get(forecastUrl, {
        params: {
          lat: lat,
          lon: lon,
          appid: this.apiKey,
          units: 'metric',
          lang: 'zh_tw'
        }
      });

      const forecast = forecastResponse.data;
      return this.formatForecastResponse(forecast, name, country);

    } catch (error) {
      throw new Error(error.message || '天氣預報查詢失敗');
    }
  }

  // Format forecast response
  formatForecastResponse(forecast, cityName, country) {
    const dailyForecasts = {};
    
    forecast.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toLocaleDateString('zh-TW');
      
      if (!dailyForecasts[dateKey]) {
        dailyForecasts[dateKey] = [];
      }
      dailyForecasts[dateKey].push(item);
    });

    let result = `📅 ${cityName}, ${country} 5天天氣預報\n\n`;
    
    Object.entries(dailyForecasts).slice(0, 5).forEach(([date, items]) => {
      const dayTemp = items.map(item => item.main.temp);
      const maxTemp = Math.round(Math.max(...dayTemp));
      const minTemp = Math.round(Math.min(...dayTemp));
      const weather = items[0].weather[0];
      const emoji = this.getWeatherEmoji(weather.main);
      
      result += `${date} ${emoji} ${weather.description}\n`;
      result += `🌡️ ${minTemp}°C ~ ${maxTemp}°C\n\n`;
    });

    return result.trim();
  }

  // Create forecast tool
  createForecastTool() {
    return new DynamicTool({
      name: "weather_forecast",
      description: "查詢指定城市的5天天氣預報。輸入參數：城市名稱（中文或英文）",
      func: async (cityName) => {
        try {
          return await this.getWeatherForecast(cityName);
        } catch (error) {
          console.error('Weather forecast tool error:', error);
          return `抱歉，無法取得 ${cityName} 的天氣預報：${error.message}`;
        }
      }
    });
  }
}

module.exports = WeatherTool;
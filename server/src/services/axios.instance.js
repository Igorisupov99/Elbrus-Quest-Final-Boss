const axios = require('axios');

const yandexAxios = axios.create({
  baseURL: 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Api-Key ${process.env.YANDEX_API_KEY}`
  }
});

module.exports = yandexAxios;

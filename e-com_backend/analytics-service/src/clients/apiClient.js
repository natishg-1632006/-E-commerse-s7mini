const axios = require('axios');
const http = require('node:http');
const https = require('node:https');

// Reusable HTTP and HTTPS agents with Keep-Alive enabled
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 100,
  maxFreeSockets: 10,
  timeout: 60000,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 100,
  maxFreeSockets: 10,
  timeout: 60000,
});

/**
 * Creates a configured Axios client instance for a service.
 * Handles timeouts, keep-alive connection reuse, and automatic transient error retries.
 * 
 * @param {string} baseURL - The service URL base path
 * @returns {AxiosInstance} Configured Axios client
 */
const createClient = (baseURL) => {
  const client = axios.create({
    baseURL,
    timeout: 5000, // 5 seconds timeout
    httpAgent,
    httpsAgent,
  });

  // Interceptor for transient error retries (5xx status or network/timeout failures)
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { config, response } = error;

      if (!config) {
        return Promise.reject(error);
      }

      // Initialize retry tracking
      config.__retryCount = config.__retryCount || 0;
      const maxRetries = 3;

      // Check if the error is transient:
      // - No response (network or timeout error)
      // - HTTP status code is 5xx (internal server errors)
      const isTransient = !response || (response.status >= 500 && response.status <= 599);

      if (isTransient && config.__retryCount < maxRetries) {
        config.__retryCount += 1;
        // Exponential backoff: 200ms, 400ms, 800ms + random jitter
        const backoffDelay = Math.pow(2, config.__retryCount) * 100 + Math.random() * 50;

        console.warn(
          `[Analytics Client] Attempt ${config.__retryCount} failed for ${config.url} (${response ? 'Status: ' + response.status : 'Network/Timeout Error'}). Retrying in ${Math.round(backoffDelay)}ms...`
        );

        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        return client(config);
      }

      // Format clean error message before rejecting
      const errMsg = response?.data?.message || error.message || 'Downstream microservice error';
      const formattedError = new Error(errMsg);
      formattedError.statusCode = response?.status || 500;
      formattedError.originalError = error;

      return Promise.reject(formattedError);
    }
  );

  return client;
};

module.exports = { createClient };

import axios from 'axios';
import { Platform } from 'react-native';

import Constants from 'expo-constants';

// Auto-detect backend host IP from Expo Metro server
const getDevServerIp = () => {
  const hostUri = Constants.expoConfig?.hostUri || 
                  (Constants as any).manifest2?.extra?.expoClient?.hostUri || 
                  (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }
  return '192.168.1.59';
};

const hostIp = getDevServerIp();

export const DEFAULT_API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Platform.select({
    web: 'http://localhost:8000',
    default: `http://${hostIp}:8000`,
  }) ||
  'http://localhost:8000';

let customApiUrl = DEFAULT_API_URL;

export const setApiBaseUrl = (url: string) => {
  customApiUrl = url;
  apiClient.defaults.baseURL = url;
};

export const getApiBaseUrl = () => customApiUrl;

export const apiClient = axios.create({
  baseURL: customApiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken: string | null = null;

export const setAuthHeader = (token: string | null) => {
  authToken = token;
};

apiClient.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    if (config.data instanceof FormData) {
      // Allow axios/fetch to automatically set multipart/form-data with the correct boundary
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred. Please try again.';
    if (error.response?.data?.detail) {
      message = typeof error.response.data.detail === 'string'
        ? error.response.data.detail
        : JSON.stringify(error.response.data.detail);
    } else if (error.message === 'Network Error') {
      message = 'Cannot connect to EVSMITH servers. Check network connection.';
    }
    const err = new Error(message);
    (err as any).response = error.response;
    (err as any).status = error.response?.status;
    return Promise.reject(err);
  }
);

import axios from 'axios';
import { API_CONFIG } from '../config/api';

// Base API configuration
const API_BASE_URL = API_CONFIG.BASE_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and log cURL commands
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('expense-tracker-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Generate and log the full cURL command
    const curlCommand = generateCurlCommand(config, token);
    console.log('🌐 Full cURL Command:');
    console.log(curlCommand);
    console.log('─'.repeat(80));

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Function to generate cURL command from axios config
const generateCurlCommand = (config, token) => {
  const method = config.method?.toUpperCase() || 'GET';
  const url = `${config.baseURL}${config.url}`;
  
  // Build headers
  const headers = [];
  if (config.headers) {
    Object.entries(config.headers).forEach(([key, value]) => {
      if (key.toLowerCase() !== 'content-length') {
        headers.push(`-H "${key}: ${value}"`);
      }
    });
  }
  
  // Add Authorization header if token exists
  if (token) {
    headers.push(`-H "Authorization: Bearer ${token}"`);
  }
  
  // Build data/body
  let dataString = '';
  if (config.data) {
    if (typeof config.data === 'string') {
      dataString = `-d '${config.data}'`;
    } else {
      dataString = `-d '${JSON.stringify(config.data, null, 2)}'`;
    }
  }
  
  // Combine all parts
  const curlParts = [
    'curl',
    `-X ${method}`,
    `"${url}"`,
    ...headers,
    dataString
  ].filter(part => part !== '');
  
  return curlParts.join(' \\\n  ');
};

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response Success:');
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`URL: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log('Response Data:', response.data);
    console.log('─'.repeat(80));
    return response.data;
  },
  (error) => {
    console.error('❌ API Error:');
    console.log(`Status: ${error.response?.status || 'No Response'}`);
    console.log(`URL: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    console.log(`Error Message: ${error.message}`);
    if (error.response?.data) {
      console.log('Error Response Data:', error.response.data);
    }
    
    // Show the cURL command that failed
    if (error.config) {
      const token = localStorage.getItem('expense-tracker-token');
      const curlCommand = generateCurlCommand(error.config, token);
      console.log('🌐 Failed cURL Command:');
      console.log(curlCommand);
    }
    console.log('─'.repeat(80));

    // Handle network errors (backend not running)
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !error.response) {
      console.warn('Backend server is not available. Using offline mode.');
      return Promise.reject({
        message: 'Backend server is not available. Please check if the server is running.',
        errors: ['Network connection failed'],
        status: 0,
        isNetworkError: true,
      });
    }

    if (error.response?.status === 401) {
      console.warn('🔒 Unauthorized - Token may be expired or invalid');
      // Token expired or invalid
      localStorage.removeItem('expense-tracker-token');
      localStorage.removeItem('expense-tracker-refresh-token');
      localStorage.removeItem('expense-tracker-current-user');
      // Don't redirect immediately, let the app handle it gracefully
    }
    
    // Return structured error
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    const errors = error.response?.data?.errors || [];
    
    return Promise.reject({
      message: errorMessage,
      errors: errors,
      status: error.response?.status,
      isNetworkError: false,
    });
  }
);

// Authentication APIs
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post(`/auth/refresh?refreshToken=${refreshToken}`),
};

// User APIs
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
};

// Transaction APIs
export const transactionAPI = {
  getTransactions: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add pagination
    queryParams.append('page', params.page || 0);
    queryParams.append('size', params.size || 10);
    
    // Add sorting
    if (params.sort) {
      queryParams.append('sort', params.sort);
      queryParams.append('direction', params.direction || 'desc');
    }
    
    // Add filters
    if (params.type && params.type !== 'all') {
      queryParams.append('type', params.type.toUpperCase());
    }
    if (params.category && params.category !== 'all') {
      queryParams.append('category', params.category);
    }
    if (params.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params.endDate) {
      queryParams.append('endDate', params.endDate);
    }
    if (params.search) {
      queryParams.append('search', params.search);
    }
    
    return api.get(`/transactions?${queryParams.toString()}`);
  },
  
  getTransaction: (id) => api.get(`/transactions/${id}`),
  
  createTransaction: (transactionData) => {
    const payload = {
      ...transactionData,
      type: transactionData.type.toUpperCase(),
    };
    return api.post('/transactions', payload);
  },
  
  updateTransaction: (id, transactionData) => {
    const payload = {
      ...transactionData,
      type: transactionData.type.toUpperCase(),
    };
    return api.put(`/transactions/${id}`, payload);
  },
  
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),
};

// Recurring Transaction APIs
export const recurringTransactionAPI = {
  getRecurringTransactions: (params = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', params.page || 0);
    queryParams.append('size', params.size || 50);
    
    if (params.isActive !== undefined) {
      queryParams.append('isActive', params.isActive);
    }
    
    return api.get(`/recurring-transactions?${queryParams.toString()}`);
  },
  
  getRecurringTransaction: (id) => api.get(`/recurring-transactions/${id}`),
  
  createRecurringTransaction: (recurringData) => {
    const payload = {
      ...recurringData,
      type: recurringData.type.toUpperCase(),
      frequency: recurringData.frequency.toUpperCase(),
    };
    return api.post('/recurring-transactions', payload);
  },
  
  updateRecurringTransaction: (id, recurringData) => {
    const payload = {
      ...recurringData,
      type: recurringData.type.toUpperCase(),
      frequency: recurringData.frequency.toUpperCase(),
    };
    return api.put(`/recurring-transactions/${id}`, payload);
  },
  
  deleteRecurringTransaction: (id) => api.delete(`/recurring-transactions/${id}`),
  
  processRecurringTransaction: (id) => api.post(`/recurring-transactions/${id}/process`),
};

// Dashboard APIs
export const dashboardAPI = {
  getSummary: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.period) {
      queryParams.append('period', params.period);
    }
    if (params.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params.endDate) {
      queryParams.append('endDate', params.endDate);
    }
    
    return api.get(`/dashboard/summary?${queryParams.toString()}`);
  },
};

// Categories API
export const categoriesAPI = {
  getCategories: () => api.get('/categories'),
};

// Utility functions
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('expense-tracker-token', token);
  } else {
    localStorage.removeItem('expense-tracker-token');
  }
};

export const setRefreshToken = (refreshToken) => {
  if (refreshToken) {
    localStorage.setItem('expense-tracker-refresh-token', refreshToken);
  } else {
    localStorage.removeItem('expense-tracker-refresh-token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('expense-tracker-token');
};

export const getRefreshToken = () => {
  return localStorage.getItem('expense-tracker-refresh-token');
};

// Debug utility to check token status
export const debugTokenStatus = () => {
  const token = getAuthToken();
  const refreshToken = getRefreshToken();
  const user = localStorage.getItem('expense-tracker-current-user');
  
  console.log('🔍 Token Debug Info:', {
    hasToken: !!token,
    hasRefreshToken: !!refreshToken,
    hasUser: !!user,
    tokenLength: token?.length || 0,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'No token',
    userData: user ? JSON.parse(user) : null
  });
  
  return {
    hasToken: !!token,
    hasRefreshToken: !!refreshToken,
    hasUser: !!user,
    token,
    refreshToken,
    user: user ? JSON.parse(user) : null
  };
};

// Utility to generate cURL commands for manual testing
export const generateCurlForAPI = (endpoint, method = 'GET', data = null) => {
  const token = getAuthToken();
  const baseURL = API_CONFIG.BASE_URL;
  const url = `${baseURL}${endpoint}`;
  
  const headers = [
    '-H "Content-Type: application/json"'
  ];
  
  if (token) {
    headers.push(`-H "Authorization: Bearer ${token}"`);
  }
  
  let dataString = '';
  if (data) {
    if (typeof data === 'string') {
      dataString = `-d '${data}'`;
    } else {
      dataString = `-d '${JSON.stringify(data, null, 2)}'`;
    }
  }
  
  const curlParts = [
    'curl',
    `-X ${method.toUpperCase()}`,
    `"${url}"`,
    ...headers,
    dataString
  ].filter(part => part !== '');
  
  const curlCommand = curlParts.join(' \\\n  ');
  
  console.log('🌐 Generated cURL Command:');
  console.log(curlCommand);
  console.log('─'.repeat(80));
  
  return curlCommand;
};

// Make cURL generation available globally for easy testing
if (typeof window !== 'undefined') {
  window.generateCurl = generateCurlForAPI;
  window.debugToken = debugTokenStatus;
}

export default api; 
import axios from 'axios';

// Create a new instance of axios
const api = axios.create({
    baseURL: 'http://localhost:5000/api', // The base URL for all our API calls
});

// This is an "interceptor" that runs before every request is sent.
api.interceptors.request.use(
    (config) => {
        // Get the token from localStorage
        const token = localStorage.getItem('userToken');
        if (token) {
            // If the token exists, add it to the Authorization header
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // Do something with request error
        return Promise.reject(error);
    }
);

export default api;
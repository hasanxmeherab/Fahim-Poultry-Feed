import axios from 'axios';
import { auth } from '../firebase';

// Create a new instance of axios
const api = axios.create({
    //baseURL: 'http://localhost:5000/api', // The base URL for all our API calls
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

// This interceptor now gets the token directly from the signed-in Firebase user
api.interceptors.request.use(
    async (config) => {
        const user = auth.currentUser;
        if (user) {
            // getIdToken(true) forces a refresh if the token is expired
            const token = await user.getIdToken(true); 
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
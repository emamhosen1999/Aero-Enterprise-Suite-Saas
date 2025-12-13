import axios from 'axios';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;
window.axios.defaults.withXSRFToken = true;

// Prevent caching of API responses
window.axios.defaults.headers.common['Cache-Control'] = 'no-cache, no-store, must-revalidate';
window.axios.defaults.headers.common['Pragma'] = 'no-cache';
window.axios.defaults.headers.common['Expires'] = '0';

// Add cache-busting to GET requests
axios.interceptors.request.use((config) => {
    if (config.method === 'get' || config.method === 'GET') {
        config.params = config.params || {};
        config.params._t = Date.now();
    }
    return config;
});

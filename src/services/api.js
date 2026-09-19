import axios from "axios";

// Local backend port. Overridable via REACT_APP_API_BASE_URL in frontend/.env.
const LOCAL_API_BASE_URL = "http://localhost:8080/api";

const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (["localhost", "127.0.0.1"].includes(hostname)) {
      return LOCAL_API_BASE_URL;
    }
  }

  return "https://57yp657i65.execute-api.ap-south-1.amazonaws.com/staging/api";
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;

export { getApiBaseUrl };

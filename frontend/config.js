// Base URL → NGINX (Docker)
window.BASE_URL = "http://localhost:8081";

// Single API endpoint - Nginx handles all routing and load balancing
window.API = `${window.BASE_URL}/api`;

console.log("🌐 API configured:", window.API);
console.log("⚖️ Load balancing via Nginx round-robin");
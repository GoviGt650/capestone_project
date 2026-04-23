// Base URL → NGINX (Docker)
window.BASE_URL = "http://localhost:8080";

// Choose backend here
// options: "fastapi", "django", "node", "dotnet"
window.SERVICE = "node";

// Final API base (used in script.js)
window.API = `${window.BASE_URL}/${window.SERVICE}`;
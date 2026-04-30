window.BASE_URL = "http://backend-alb-943964116.eu-north-1.elb.amazonaws.com";

// Default → Round Robin
window.API = `${window.BASE_URL}/api`;

window.ROUTES = {
  round: `${window.BASE_URL}/api`,
  fastapi: `${window.BASE_URL}/fastapi`,
  django: `${window.BASE_URL}/django`,
  node: `${window.BASE_URL}/node`,
  dotnet: `${window.BASE_URL}/dotnet`
};

console.log("🌐 API configured:", window.API);
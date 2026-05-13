#!/bin/bash
NGINX_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ubuntu-nginx-1)
if [ -z "$NGINX_IP" ] || [ "$NGINX_IP" = "invalid IP" ]; then
    echo "NGINX not running"
    exit 1
fi
echo "NGINX IP: $NGINX_IP"
sed -i "s|http://[0-9.]*:80/api/|http://${NGINX_IP}:80/api/|g" ~/monitoring/prometheus.yml
docker compose restart prometheus
echo "Done - Blackbox fixed with IP: $NGINX_IP"

# Import dashboard to Grafana
sleep 5
curl -X POST http://admin:admin@localhost:3000/api/dashboards/db \
  -H 'Content-Type: application/json' \
  -d @/home/ubuntu/monitoring/comprehensive-dashboard.json 2>/dev/null
echo "Dashboard imported"

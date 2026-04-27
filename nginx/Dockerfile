FROM nginx:latest

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY frontend /usr/share/nginx/html


# Remove default config
# Copy your nginx config
# Copy frontend files
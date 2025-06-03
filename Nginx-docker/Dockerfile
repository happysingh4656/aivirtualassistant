# Use the official Nginx image from Docker Hub
FROM nginx:latest

# Copy custom HTML file to the Nginx web folder
COPY index.html /usr/share/nginx/html/index.html

# Expose port 80
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]
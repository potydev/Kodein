# Multi-stage build untuk Vite React app
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build aplikasi
# Environment variables (VITE_*) akan otomatis di-inject oleh Dockploy saat build
# Vite akan otomatis membaca env vars yang dimulai dengan VITE_ dari environment
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files dari builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config untuk SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]


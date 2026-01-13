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
# Environment variables (VITE_*) harus di-inject sebagai build arguments oleh Dokploy
# Pastikan Dokploy mengirim env vars sebagai build args dengan format: --build-arg KEY=VALUE
# Atau pastikan Dokploy sudah mengkonfigurasi untuk otomatis mengirim env vars sebagai build args
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID

# Set ENV dari ARG agar tersedia saat build
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}
ENV VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID}

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files dari builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config untuk SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 3000
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]


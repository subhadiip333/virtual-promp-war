# Stage 1: Build the React Application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies first (caching layer)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS server

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

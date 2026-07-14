# Dockerfile — Production Containerization for PathshalaKhoj
FROM node:22.5-alpine

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

# Create app directory
WORKDIR /usr/src/app

# Copy dependency manifests
COPY backend/package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy backend application source
COPY backend/ ./

# Copy static frontend assets (Express serves this via path.join(__dirname, '..', 'frontend'))
COPY frontend/ ../frontend/

# Expose server port
EXPOSE 4000

# Run seeder and start server
CMD ["node", "server.js"]

FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source code
COPY . .

# Build Vite client assets
RUN npm run build

# Expose server port
EXPOSE 3000

# Mountable volume for persistent player scores and stats
VOLUME ["/app/data"]

# Start production server
CMD ["node", "server.js"]

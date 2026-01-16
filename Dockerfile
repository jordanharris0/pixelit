# Stage 1: Build Stage (Production-optimized)
FROM node:24-alpine AS builder

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json (if it exists)
COPY package*.json ./

# Install dependencies with npm ci (cleaner install than npm install)
RUN npm ci

# Copy Prisma schema and migrations
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Stage 2: Runtime Stage (Lightweight final image)
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Copy node_modules and Prisma from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts


# Copy application code
COPY . .

# Set NODE_ENV to production
ENV NODE_ENV=production

# Expose port 12000 (your backend port)
EXPOSE 12000

# Health check - Docker will monitor if container is healthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:12000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run the application
CMD ["node", "server.js"]

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

# ============================================
# Stage 2: Build
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ============================================
# Stage 3: Production Runtime
# ============================================
FROM node:20-alpine

# Install wget and netcat for healthcheck and entrypoint
RUN apk add --no-cache wget netcat-openbsd

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy dependencies from dependencies stage
COPY --from=dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built application from build stage
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./

# Copy necessary files
COPY --chown=nestjs:nodejs scripts ./scripts
COPY --chown=nestjs:nodejs data ./data
COPY --chown=nestjs:nodejs docs ./docs
COPY --chown=nestjs:nodejs manuals ./manuals
COPY --chown=nestjs:nodejs docker-entrypoint.sh ./

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh

# Create directories with proper permissions
RUN mkdir -p uploads logs && \
    chown -R nestjs:nodejs uploads logs data uploads docs manuals

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --spider -q http://localhost:3000/health || exit 1

# Start application via entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]

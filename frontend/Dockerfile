# Stage 1: Installing dependencies
FROM node:20-alpine AS deps

# Install additional tools
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files and configuration files
COPY package.json package-lock.json ./
COPY tsconfig.json jsconfig.json ./
COPY next.config.js ./

# Install dependencies with exact versions
RUN npm install -g npm@latest
RUN npm ci --production=false --legacy-peer-deps

# Stage 2: Building the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all necessary files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json
COPY --from=deps /app/tsconfig.json ./tsconfig.json
COPY --from=deps /app/jsconfig.json ./jsconfig.json
COPY --from=deps /app/next.config.js ./next.config.js

# Copy source code
COPY src ./src
COPY public ./public

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ENV NEXT_PUBLIC_APP_URL http://localhost:3000

# Build the application
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV NEXT_PUBLIC_APP_URL http://localhost:3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create necessary directories with correct permissions
RUN mkdir -p .next/cache/images && chown -R nextjs:nodejs .next

# Switch to non-root user
USER nextjs

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]

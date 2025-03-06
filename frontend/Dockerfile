# Stage 1: Building the code
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
RUN npm install --production=false

# Install type definitions
RUN npm install --save-dev \
    @types/react \
    @types/react-dom \
    @types/node \
    @types/stylis \
    @types/stylis-plugin-rtl \
    @types/next \
    @mui/types \
    @types/next-intl \
    @types/notistack

# Copy project files
COPY . .

# Create types directory
RUN mkdir -p src/types

# Build project
RUN npm run build

# Stage 2: Running the app
FROM node:18-alpine AS runner

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install only production dependencies
RUN npm install --production

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

# Stage 1: Building the code
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Create next-env.d.ts
RUN echo '/// <reference types="next" />' > next-env.d.ts && \
    echo '/// <reference types="next/image-types/global" />' >> next-env.d.ts

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
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

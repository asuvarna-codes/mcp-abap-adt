# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if you have one)
# Using package-lock.json ensures deterministic builds
COPY package.json ./
# COPY package-lock.json ./ # Uncomment if you use package-lock.json

# Install production dependencies only initially, and dev dependencies later for building
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript application
RUN npm run build

# Stage 2: Create the final production image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# If you have a .env file that needs to be present at runtime, copy it (be careful with sensitive data)
# COPY --from=builder /app/.env ./.env

# Expose the port the app runs on.
# IMPORTANT: Cloud Run expects your application to listen on the port specified by the PORT environment variable.
# Your code uses `getConfig().port`, which defaults to '8001' or uses `process.env.MCP_PORT`.
# You should ensure your application listens on `process.env.PORT` when deployed to Cloud Run.
# We'll set the Cloud Run `PORT` environment variable to `8001` or ensure your app can read it.
EXPOSE 8123

# Command to run the application
# Ensure your index.js starts an HTTP server listening on the PORT environment variable.
CMD ["node", "./dist/index.js"]
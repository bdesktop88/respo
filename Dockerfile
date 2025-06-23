
# Use an official Node.js runtime as a base image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application
COPY . .

# Ensure .env is included
# If you're using Docker locally or deploying to a platform like Railway or Back4App, the env is handled externally.
# But if testing locally:
# COPY .env .env

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

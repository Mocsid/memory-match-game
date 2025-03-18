# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code AFTER installing dependencies
COPY . .

# Expose frontend port
EXPOSE 3000

# Start React app
CMD ["npm", "start"]

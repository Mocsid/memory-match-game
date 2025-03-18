FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all backend source files into container
COPY . .

# Expose the port
EXPOSE 3001

# Start the server
CMD ["node", "src/server.js"]

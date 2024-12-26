# Base image for Node.js application
FROM node:18

# Set working directory
WORKDIR /app

# Copy application files
COPY ./src ./src
COPY package.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Install PostgreSQL client for migrations
RUN apt-get update && apt-get install -y postgresql-client

# Copy migration scripts
COPY ./db/init ./db/init

# Add entrypoint script
COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose the application port
EXPOSE 3000

# Start the application
ENTRYPOINT ["/entrypoint.sh"]

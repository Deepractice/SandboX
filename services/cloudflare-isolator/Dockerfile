FROM node:22-alpine

WORKDIR /app

# Install execution runtimes
RUN apk add --no-cache python3 py3-pip bash

# Expose port for Worker to access
EXPOSE 8080

# Copy executor script
COPY executor.js /app/executor.js

# Start HTTP server
CMD ["node", "/app/executor.js"]

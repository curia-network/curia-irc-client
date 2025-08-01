# Dockerfile for The Lounge IRC Web Client
FROM node:18-alpine

# Install global dependencies
RUN npm install -g thelounge@4.4.3

# Create thelounge directory and use existing node user
RUN mkdir -p /home/node/.thelounge && \
    chown -R node:node /home/node

# Copy configuration files
COPY config.js /home/node/.thelounge/config.js
COPY public/ /home/node/.thelounge/public/
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

# Make entrypoint executable and set permissions
RUN chmod +x /usr/local/bin/entrypoint.sh && \
    chown -R node:node /home/node/.thelounge

# Switch to node user
USER node

# Install custom Common Ground theme using The Lounge's package manager (proper way)
RUN thelounge install thelounge-theme-cg

# Set working directory
WORKDIR /home/node

# Expose port
EXPOSE 9000

# Use custom entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["thelounge", "start"]
# Dockerfile for The Lounge IRC Web Client
FROM node:18-alpine

# Install git and build dependencies
RUN apk add --no-cache git python3 make g++

# Clone and build our custom TheLounge with autoconnect
WORKDIR /app
ENV CACHE_BUST=2025-08-03-13-50
ENV CACHE_BUST=3025-08-03-13-50
RUN git clone https://github.com/curia-network/curia-irc-client-source.git thelounge
WORKDIR /app/thelounge

# Install dependencies and build
RUN yarn install
RUN yarn build

# Fix permissions for the .thelounge-local directory and create thelounge directory
RUN chown -R node:node /app/thelounge/.thelounge-local && \
    mkdir -p /home/node/.thelounge && \
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
RUN cd /app/thelounge && ./index.js install thelounge-theme-cg

# Set working directory
WORKDIR /home/node

# Expose port
EXPOSE 9000

# Use custom entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/app/thelounge/index.js", "start"]
# cg-irc-client/Dockerfile
FROM node:18-alpine

# 1. install thelounge
RUN npm i -g thelounge@4

# 2. add your theme (assume you published `thelounge-theme-cg` to npm
#    or have it in the repo under ./theme) – either approach works

# – npm published variant
RUN thelounge install thelounge-theme-cg

# – local folder variant
# COPY theme /tmp/theme
# RUN thelounge install /tmp/theme

# 3. copy server‑side config
COPY config.js /home/node/.lounge/config.js

EXPOSE 9000
USER node
CMD ["thelounge", "start", "--home", "/home/node"]

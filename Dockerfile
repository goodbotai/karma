FROM node:8.2

COPY . /app

WORKDIR /app

RUN npm install pm2@latest -g
RUN npm install --deps

CMD ["pm2-docker", "start", "ecosystem.config.js"]
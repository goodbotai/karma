FROM node:latest

COPY . /app

WORKDIR /app

RUN npm install pm2@latest -g
RUN npm install --deps

CMD ["pm2-docker", "start", "Karma.js", "-i", "0"]
FROM node:latest

COPY . /app

WORKDIR /app

RUN npm install --deps

CMD ["npm", "start"]
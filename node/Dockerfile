FROM node:12.13.0

WORKDIR /app

COPY package*.json ./

RUN npm config set strict-ssl false

RUN npm install

COPY . .

CMD ["npm", "start"]
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY dashboard/package*.json ./dashboard/
RUN cd dashboard && npm install

COPY . .

RUN npm run build

EXPOSE 3000 3001

CMD ["npm", "start"]

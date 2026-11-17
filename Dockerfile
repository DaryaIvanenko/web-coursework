FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "npx sequelize-cli db:migrate && npx sequelize-cli db:seed --seed 20261101000000-docker-demo-data.js && node server/server.js"]

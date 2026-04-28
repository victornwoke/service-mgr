FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Expose port 8081 for the API
EXPOSE 8081

CMD ["npm", "start"]


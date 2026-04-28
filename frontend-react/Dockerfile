# Build stage
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
COPY vite.config.js tailwind.config.js ./
RUN npm ci --only=production=false

COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


FROM node:18-alpine AS build

WORKDIR /app

# Accept build arguments
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_HLS_BASE_URL

# Set environment variables for Vite build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
ENV VITE_HLS_BASE_URL=${VITE_HLS_BASE_URL}

COPY package*.json ./
RUN npm install

COPY . .

# Create .env file for Vite
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env && \
    echo "VITE_WS_URL=${VITE_WS_URL}" >> .env && \
    echo "VITE_HLS_BASE_URL=${VITE_HLS_BASE_URL}" >> .env

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

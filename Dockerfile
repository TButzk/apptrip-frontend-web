FROM node:22-alpine AS build

WORKDIR /workspace

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=/apptrip-api/api/v1
ARG VITE_BASE_PATH=/apptrip-react/
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_BASE_PATH=$VITE_BASE_PATH

RUN npm run build

FROM nginx:1.25-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist /usr/share/nginx/html

EXPOSE 80

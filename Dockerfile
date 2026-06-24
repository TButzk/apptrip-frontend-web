ARG APPTRIP_BUILD_ID=local

FROM node:22-alpine AS build

ARG APPTRIP_BUILD_ID

WORKDIR /workspace

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=/apptrip-api/api/v1
ARG VITE_BASE_PATH=/apptrip-react/
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_BASE_PATH=$VITE_BASE_PATH

RUN npm run build \
	&& printf '%s\n' "$APPTRIP_BUILD_ID" > /workspace/.apptrip-build-id

FROM nginx:1.25-alpine

ARG APPTRIP_BUILD_ID
LABEL org.opencontainers.image.version="$APPTRIP_BUILD_ID" \
	  org.apptrip.build-id="$APPTRIP_BUILD_ID"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist /usr/share/nginx/html

EXPOSE 80

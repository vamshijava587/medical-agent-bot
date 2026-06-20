# Multi-stage build: build Angular app, then serve with nginx
FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps --silent

# Copy sources and build (production)
COPY . .
RUN npm run build -- --configuration production

FROM nginx:stable-alpine

# Clear default html and copy built app into nginx root. Some Angular
# outputs place app files under a `browser/` subfolder; copy both to be safe.
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist/medical-agent-bot/browser/ /usr/share/nginx/html/
COPY --from=builder /app/dist/medical-agent-bot/ /usr/share/nginx/html/

# Copy nginx config and entrypoint
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/docker-entrypoint.sh /docker-entrypoint.sh
COPY src/assets/env.template.js /usr/share/nginx/html/assets/env.template.js
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
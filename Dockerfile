# ── STAGE 1 : BUILD ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm ci --frozen-lockfile

COPY . .
RUN npm run build

# ── STAGE 2 : SERVE ─────────────────────────────────────────
FROM nginx:1.27-alpine

# nginx config (must exist in build context)
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# static build output
COPY --from=builder /app/dist /usr/share/nginx/html

# TLS certs
RUN mkdir -p /nginx/certs
COPY nginx/certs/stans.crt  /etc/nginx/certs/stans.crt
COPY nginx/certs/stans.key  /etc/nginx/certs/stans.key


# Permissions: make certs readable by the nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && chown -R nginx:nginx /etc/nginx/conf.d \
    && chown -R nginx:nginx /etc/nginx/certs \
    && touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/run/nginx.pid

EXPOSE 80 443

# If your nginx config serves /health on 443, this should succeed
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider --no-check-certificate https://localhost/health || exit 1

USER nginx
CMD ["nginx", "-g", "daemon off;"]

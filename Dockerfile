# ── STAGE 1 : BUILD ─────────────────────────────────────────
FROM node:20-alpine AS builder

LABEL org.opencontainers.image.source="https://github.com/Ronel16/STANS"

WORKDIR /app
COPY package*.json ./
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm ci --frozen-lockfile
COPY . .
RUN npm run build

# ── STAGE 2 : SERVE ─────────────────────────────────────────
FROM nginx:1.25-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider --no-check-certificate https://localhost:443/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

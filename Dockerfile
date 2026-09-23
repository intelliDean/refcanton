# Dockerfile
# Production Container for RefCanton Gateway & Web Application

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Copy pre-compiled backend and runtime dependencies
COPY backend/package.json ./backend/package.json
COPY backend/node_modules ./backend/node_modules
COPY backend/dist ./backend/dist

# Copy static frontend assets
COPY frontend ./frontend

EXPOSE 4000

HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/status || exit 1

CMD ["node", "backend/dist/server.js"]

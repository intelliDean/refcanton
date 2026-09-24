# Dockerfile
# Production Container for RefCanton Gateway & Web Application (Multi-Stage Build)

# Stage 1: Build TypeScript backend
FROM node:20-alpine AS builder
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install
COPY backend/src ./backend/src
COPY backend/tsconfig.json ./backend/
RUN cd backend && npm run build

# Stage 2: Production runtime image
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Install production dependencies only
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy compiled backend output from builder stage
COPY --from=builder /app/backend/dist ./backend/dist

# Copy static frontend assets
COPY frontend ./frontend

EXPOSE 4000

HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/status || exit 1

CMD ["node", "backend/dist/server.js"]

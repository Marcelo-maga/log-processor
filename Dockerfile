FROM node:24-alpine AS base
WORKDIR /usr/src/app

FROM base AS dev
COPY package*.json ./
RUN npm ci
COPY . .
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate
RUN npm run build
RUN npm prune --production

FROM base AS runner
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]

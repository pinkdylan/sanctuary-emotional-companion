FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

COPY server.ts chatHandler.ts llmDashscope.ts psychologyKbSearch.ts cosyvoiceTts.ts ttsAlign.ts ./
COPY data ./data

EXPOSE 3000

CMD ["node", "--experimental-strip-types", "server.ts"]

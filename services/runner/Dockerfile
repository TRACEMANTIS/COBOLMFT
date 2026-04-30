FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache docker-cli
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
COPY tsconfig.json ./
RUN npm install --include=dev tsx typescript
EXPOSE 8080
CMD ["npx", "tsx", "src/index.ts"]

FROM node:20-alpine
WORKDIR /app

# deps
COPY package*.json ./
RUN npm ci || npm install

# app
COPY . .
EXPOSE 3000
ENV NEXT_TELEMETRY_DISABLED=1
CMD ["npm","run","dev","--","-p","3000","-H","0.0.0.0"]

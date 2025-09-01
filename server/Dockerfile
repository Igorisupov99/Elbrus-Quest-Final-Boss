FROM node:20-alpine
WORKDIR /application
# ENV NODE_ENV docker
COPY package.json ./ 
COPY package-lock.json ./
RUN npm ci 
COPY . . 
EXPOSE 3000
CMD ["node", "server.js"]
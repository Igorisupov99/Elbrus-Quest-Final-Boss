FROM node:20-alpine
WORKDIR /application
COPY package.json ./
COPY package-lock.json ./
COPY . .
RUN npm run build
RUN ls -al /application
FROM nginx:alpine   
COPY --from=build /application/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD [ "nginx", "-g", "daemon off;" ]
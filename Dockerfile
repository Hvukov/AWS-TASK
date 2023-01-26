FROM node:14-alpine

WORKDIR /usr/app/node

COPY package*.json ./
RUN npm install
COPY ./ ./

EXPOSE 4000

CMD ["npm", "run", "devStart"]
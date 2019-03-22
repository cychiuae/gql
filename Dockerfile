FROM node:10
COPY package.json yarn.lock ./
RUN yarn
COPY . .
CMD ["yarn", "run", "start"]

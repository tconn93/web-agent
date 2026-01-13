FROM node:20

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# Build the app
RUN npm run build

# Serve the app
EXPOSE 5173
CMD [ "npm", "run", "dev" ]

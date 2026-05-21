FROM node:20-alpine

WORKDIR /app

# COPY package*.json ./

# RUN npm install

COPY . .

# Expose 4200 for the app, 9229 for the debugger
EXPOSE 4200 
EXPOSE 9229

# Start Angular with polling for auto-reload, and pass the node --inspect flag for debugging
# CMD ["node", "--inspect=0.0.0.0:9229", "./node_modules/@angular/cli/bin/ng", "serve", "--host", "0.0.0.0", "--poll", "2000"]
CMD sh -c "npm install && node --inspect=0.0.0.0:9229 ./node_modules/@angular/cli/bin/ng serve --host 0.0.0.0 --poll 2000"
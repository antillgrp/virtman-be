FROM node:14-alpine
LABEL Gerson Ramirez Pedre <antillgrp@gmail.com>

RUN 'curl -L -o - "https://github.com/vmware/govmomi/releases/latest/download/govc_$(uname -s)_$(uname -m).tar.gz" | tar -C /usr/local/bin -xvzf - govc'

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app
RUN npm install && npm run compile

EXPOSE 3000

# CMD [ "npm", "start" ]
CMD [ "npm", "run", "dev" ]

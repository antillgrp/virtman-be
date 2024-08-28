FROM node:14-alpine
LABEL Gerson Ramirez Pedre <antillgrp@gmail.com>


RUN apk --no-cache --update add curl
RUN apk --no-cache --update add jq

#RUN uname -s | tee -a uname.txt && uname -m | tee -a uname.txt
RUN curl -L -o - "https://github.com/vmware/govmomi/releases/latest/download/govc_linux_x86_64.tar.gz" | tar -C /usr/local/bin -xvzf - govc

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app
RUN npm install && npm run compile

EXPOSE 3000

# CMD [ "npm", "start" ]
CMD [ "npm", "run", "dev" ]

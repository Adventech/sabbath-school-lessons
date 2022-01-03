FROM node:16.13.1

WORKDIR /app

RUN echo "\ndeb http://deb.debian.org/debian buster-backports main" >> /etc/apt/sources.list
RUN apt update && apt -y install hugo/buster-backports

ADD package.json ./

RUN npm install

ADD . .

CMD ["/bin/sh", "entrypoint.sh"]
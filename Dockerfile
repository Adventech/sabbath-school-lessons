FROM node:14.16.1

WORKDIR /app

RUN wget https://github.com/gohugoio/hugo/releases/download/v0.87.0/hugo_0.87.0_Linux-ARM64.deb
RUN dpkg -i hugo_0.87.0_Linux-ARM64.deb
RUN rm *.deb

ADD package.json ./

RUN npm install

ADD . .

CMD ["/bin/sh", "entrypoint.sh"]
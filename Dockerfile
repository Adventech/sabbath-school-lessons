FROM node:12.20

WORKDIR /app

RUN wget https://github.com/gohugoio/hugo/releases/download/v0.79.1/hugo_0.79.1_Linux-64bit.deb
RUN dpkg -i hugo_0.79.1_Linux-64bit.deb
RUN rm *.deb

ADD package.json ./

RUN npm install

ADD . .

CMD ["/bin/sh", "entrypoint.sh"]
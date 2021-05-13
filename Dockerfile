FROM node:14.16.1

WORKDIR /app

RUN wget https://github.com/gohugoio/hugo/releases/download/v0.83.1/hugo_0.83.1_Linux-64bit.deb
RUN dpkg -i hugo_0.83.1_Linux-64bit.deb
RUN rm *.deb

ADD package.json ./

RUN npm install

ADD . .

CMD ["/bin/sh", "entrypoint.sh"]
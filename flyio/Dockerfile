FROM node:alpine
RUN mkdir -p /home/littleledger
COPY ./LittleLedger /home/littleledger
WORKDIR /home/littleledger
RUN npm install

ADD configure.sh /configure.sh
RUN chmod +x /configure.sh
ENTRYPOINT /configure.sh

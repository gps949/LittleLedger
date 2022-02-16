FROM node:alpine
RUN mkdir -p /home/littleledger
COPY ./LittleLedger /home/littleledger
WORKDIR /home/littleledger
RUN npm install

ENV HOST 0.0.0.0
ENV PORT 3456

EXPOSE 3456

CMD ["sh", "-c", "node /home/littleledger/app.js USERNAME=$LL_USER PASSWORD=$LL_PWD"]

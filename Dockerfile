FROM node:18-alpine3.15

WORKDIR /app

COPY [ "package.json", "package-lock.json", "tsconfig.json", ".env", "./" ]
COPY ./src ./src

RUN apk add --virtual build-dependencies build-base gcc wget git

RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools

CMD npm start
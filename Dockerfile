FROM node:10.14.2-slim

LABEL version="1.0.0"
LABEL repository="https://github/lannonbr/issue-label-pr-comment-action"
LABEL maintainer="Benjamin Lannon <benjamin@lannonbr.com>"

LABEL com.github.actions.name="Issue Label PR comment Action"
LABEL com.github.actions.description="Will run a dry run of the issue-label-manager to show off what issues will be changed."
LABEL com.github.actions.icon="upload"
LABEL com.github.actions.color="green"

ADD package.json /package.json
ADD package-lock.json /package-lock.json
WORKDIR /
COPY . /

RUN npm i

ENTRYPOINT ["node", "/index.js"]
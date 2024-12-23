﻿# SENG8071 - Final Exam

This project was developed to meet the requirements of the Final Exam of the Database Testing Course at Conestoga College (Waterloo), during the Fall 2024.
It covers the implementation of Rest API based on Express, along with TypeORM over Postgresql. The documentation of this API is available at https://documenter.getpostman.com/view/39012576/2sAYHxnPQn.

## Getting started

### Requirements

You will need NPM and Node installed on your local machine. We recommend Node v22.

### Set up

This project is dockerized. So you can run it from either NPM or from docker-compose. With NPM, it runs at the port 8000. With Docker, it becomes available at port 80.

#### Running on Dev Environment (NPM):

After cloning the project, from the `backend` folder, install the required dependencies:

```bash
npm install
```

Start the development environment:

```bash
npm start
```

### Tests

Run tests with:

```bash
npm run test
```

##### Docker & docker-compose

After cloning the project, from the root folder, you need to run the following commands.

###### Build the Image

```bash
docker-compose build
```

###### Run the image

```bash
docker-compose up -d
```

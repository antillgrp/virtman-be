import express, { Application } from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import http from 'http';
import os from 'os';

import fs from 'fs';
import https from 'https';

import cookieParser from 'cookie-parser';
//import * as OpenApiValidator from 'express-openapi-validator';

import l from './common/logger';
import errorHandler from './error.handler';
import userController from './userController';
import vmController from './vmController';

//import examplesRouter from './api/routers/examples/router';

export default class ExpressServer {
  //private routes: (app: Application) => void;
  private app: Application;

  constructor() {
    this.app = express();

    this.app.use(
      bodyParser.json({ limit: process.env.REQUEST_LIMIT || '100kb' })
    );
    this.app.use(
      bodyParser.urlencoded({ limit: process.env.REQUEST_LIMIT || '100kb', extended: true, })
    );
    this.app.use(
      bodyParser.text({ limit: process.env.REQUEST_LIMIT || '100kb' })
    );
    this.app.use(cookieParser(process.env.SESSION_SECRET));

    this.app.use((_req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
      );
      next();
    });

    const root = path.normalize(__dirname + '/..');
    this.app.use(express.static(`${root}/public`));

    const apiSpec = path.join(__dirname + '/common/', 'api.yml');
    this.app.use(process.env.OPENAPI_SPEC || '/spec', express.static(apiSpec));

    this.app.use(errorHandler);
    this.app.use('/api/users', userController);
    this.app.use('/api/vms', vmController);

    // this.app.use('/api/examples', examplesRouter);

    // const validateResponses = !!(
    //   process.env.OPENAPI_ENABLE_RESPONSE_VALIDATION &&
    //   process.env.OPENAPI_ENABLE_RESPONSE_VALIDATION.toLowerCase() === 'true'
    // );
    // app.use(
    //   OpenApiValidator.middleware({
    //     apiSpec,
    //     validateResponses,
    //     ignorePaths: /.*\/spec(\/|$)/,
    //   })
    // );
  }

  listen(port: number): Application {
    const welcome = (p: number) => (): void => {
      const env = process.env.NODE_ENV || 'development';
      l.info(`up and running in ${env} @: ${os.hostname()} on port: ${p}}`);
    };

    http.createServer(this.app).listen(port, welcome(port));

    const key = fs.readFileSync(__dirname + '/virtman.net-key.pem', 'utf-8');
    const cert = fs.readFileSync(__dirname + '/virtman.net.pem', 'utf-8');

    https.createServer({ key, cert }, this.app).listen(3443, welcome(3443));

    return this.app;
  }
}

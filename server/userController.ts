import express, { Request, Response } from 'express';

import L from './common/logger';

const isJsonString = (str: string) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

interface User {
  Id: { Name: string; Domain: string };
  Password: string;
  Alias: string;
  Kind: string;
  Description: string;
}

export var AuthenticatedUser = 'Administrator';

const all = (): Promise<User[]> => new Promise<User[]>((resolve, _reject) => {
    const govc_sso_user_ls = require('child_process').spawn(
      `export GOVC_URL='https://192.168.10.113' && export GOVC_INSECURE='true' && \
      export GOVC_USERNAME='administrator@vsphere.local' && export GOVC_PASSWORD='ZAQ!xsw2' && \
      govc sso.user.ls -json=true -group Administrators | jq -c`,
      { shell: true }
    );
    govc_sso_user_ls.stderr.on('data', (data: any) => {
      L.info('govc_sso_user_ls stderr: ' + data.toString());
    });

    let virtmanUsers: User[] = [];

    govc_sso_user_ls.stdout.on('data', (data: any) => {
      //L.info('govc_sso_user_ls stdout: ' + data.toString());

      if (isJsonString(data.toString())) {
        L.info('govc_sso_user_ls stdout (JSON): ' + data.toString());
        virtmanUsers = eval(data.toString()).filter(
          (u: User) => u.Description == 'virtman'
        );
      }
    });
    govc_sso_user_ls.on('exit', (exitCode: any) => {
      L.info(`Xcode: ${exitCode}, resolv --> virtmanUsers: ${JSON.stringify(virtmanUsers)}`);
      resolve(virtmanUsers);
    });
});

const one = (USERNAME: string): Promise<User> => new Promise<User>((resolve, reject) => {
    all().then((us) => {
      const filterResult = us.filter((u) => u.Id.Name == USERNAME);
      if (filterResult.length > 0) resolve(filterResult[0]);
      else reject(`User ${USERNAME} not found`);
    });
});

const add = (USERNAME: string, PASSWORD: string): Promise<User> =>
  new Promise<User>((resolve, reject) => {
    all().then(
      (us) => {
        if (us.length < 4) {
          const govc_sso_user_create = require('child_process').spawn(
          `export GOVC_URL='https://192.168.10.113' && export GOVC_INSECURE='true' &&
          export GOVC_USERNAME='administrator@vsphere.local' && export GOVC_PASSWORD='ZAQ!xsw2' &&
          govc sso.user.create -d 'virtman' -p '${PASSWORD}' '${USERNAME}' &&
          govc sso.group.update -a '${USERNAME}' 'Administrators'`,
            { shell: true }
          );
          let errors = '';
          govc_sso_user_create.stderr.on('data', (data: any) => {
            errors += data.toString() + '\n';
            L.info('govc_sso_user_create stderr: ' + data.toString());
          });
          govc_sso_user_create.stdout.on('data', (data: any) => {
            L.info('govc_sso_user_create stdout: ' + data.toString());
          });
          govc_sso_user_create.on('exit', (exitCode: any) => {
            L.info('govc_sso_user_create exited with code: ' + exitCode);
            if (exitCode == 0)
              all().then((us) =>
                resolve(us.filter((u) => u.Id.Name == USERNAME)[0])
              );
            else reject(errors);
          });
        } else {
          L.error(
            `ERROR: Username ${USERNAME} could not be added , Virtman Team user limit (4) has been reached`
          );
          reject('Virtman Team user limit has been reached');
        }
      } //, (_) => {}
    );
  });

const del = (USERNAME: string): Promise<User[]> =>
  new Promise<User[]>((resolve, reject) => {
    one(USERNAME).then(
      (_) => {
        const govc_sso_user_rm = require('child_process').spawn(
          `export GOVC_URL='https://192.168.10.113' && export GOVC_INSECURE='true' &&
        export GOVC_USERNAME='administrator@vsphere.local' && export GOVC_PASSWORD='ZAQ!xsw2' &&
        govc sso.user.rm '${USERNAME}'`,
          { shell: true }
        );
        let errors = '';
        govc_sso_user_rm.stderr.on('data', (data: any) => {
          errors += data.toString() + '\n';
          L.info('govc_sso_user_rm stderr: ' + data.toString());
        });
        govc_sso_user_rm.stdout.on('data', (data: any) => {
          L.info('govc_sso_user_rm stdout: ' + data.toString());
        });
        govc_sso_user_rm.on('exit', (exitCode: any) => {
          L.info('govc_sso_user_rm exited with code: ' + exitCode);
          if (exitCode == 0) all().then((us) => resolve(us));
          else reject(errors);
        });
      },
      (e) => {
        L.error(
          `ERROR: Username ${USERNAME} could not be deleted, User not found`
        );
        reject(e);
      }
    );
  });

const login = (USERNAME: string, PASSWORD: string): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const govc_session_login = require('child_process').spawn(
      `export GOVC_URL='https://192.168.10.113' && export GOVC_INSECURE='true' &&
    export GOVC_USERNAME='${USERNAME}@vsphere.local' && export GOVC_PASSWORD='${PASSWORD}' &&
    govc session.login -json=true`,
      { shell: true }
    );
    let errors = '';
    govc_session_login.stderr.on('data', (data: any) => {
      errors += data.toString() + '\n';
      L.info('govc_session_login stderr: ' + data.toString());
    });
    govc_session_login.stdout.on('data', (data: any) => {
      L.info('govc_session_login stdout: ' + data.toString());
    });
    govc_session_login.on('exit', (exitCode: any) => {
      L.info('govc_session_login exited with code: ' + exitCode);
      if (exitCode == 0) resolve(USERNAME);
      else reject(errors);
    });
  });


export default express.Router()
  .get('/', (_req: Request, res: Response) => {
    all().then((us) => {
      // res.set('Access-Control-Expose-Headers', 'Content-Range');
      // res.set('Content-Range', 'bytes: 0-9/*');
      L.info('From all() sent:' + JSON.stringify(us));
      res.status(200).json(us); //res.send(us);
    });
  })
  .get('/:USERNAME', (req: Request, res: Response) => {
      one(req.params['USERNAME']).then(
        (u) => res.status(200).json(u),
        (e) => res.status(404).end(e)
      );
    })
  .post('/', (req: Request, res: Response) => {
      add(req.body.USERNAME, req.body.PASSWORD).then(
        (u) => res.status(201).json(u),
        (e) => res.status(400).end(e)
      );
    })
  .delete('/:USERNAME', (req: Request, res: Response) => {
      del(req.params['USERNAME']).then(
        (us) => res.status(200).json(us),
        (e) => res.status(404).end(e)
      );
    })
  .post('/login', (req: Request, res: Response) => {
      login(req.body.USERNAME, req.body.PASSWORD).then(
        (USERNAME) => {
          AuthenticatedUser = USERNAME;
          res.status(201).send(`${USERNAME} Authenticated`);
          L.info(`${req.body.USERNAME} Authenticated`);
        },
        (e) => {
          res.status(400).end(e);
          L.error(`${req.body.USERNAME} could not be Authenticated`);
        }
      );
    })
  .post('/logout', (_req: Request, res: Response) => {
      if (AuthenticatedUser != 'Administrator') {
        res.status(201).send(`${AuthenticatedUser} Loged out`);
        L.info(
          `${AuthenticatedUser} Loged out, current authenticated user: Administrator`
        );
        AuthenticatedUser = 'Administrator';
      } else res.status(400).send(`There was no user authenticated`);
    });

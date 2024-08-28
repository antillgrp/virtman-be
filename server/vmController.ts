import express, { Request, Response } from 'express';

import L from './common/logger';

interface VM {
  name: string;
  annotation: string; // { "VirtmanOwner": "VirtmanUname"}
  // -host='192.168.10.128' -ds=datastore1 -on=false -m=1024 -c=1 -disk=100MB
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
let _AuthenticatedUser = require('./userController').AuthenticatedUser;

const all = (): Promise<VM[]> =>
  new Promise<VM[]>((resolve, reject) => {
    const isJsonString = (str: string) => {
      try {
        JSON.parse(str);
      } catch (e) {
        return false;
      }
      return true;
    };

    _AuthenticatedUser = require('./userController').AuthenticatedUser;
    if (_AuthenticatedUser == 'Administrator') {
      reject('No virtman registered user authtenticated');
      return;
    }

    const govc_ls_vm = require('child_process').spawn(
      `export GOVC_URL='https://192.168.10.113' && export GOVC_INSECURE='true' && \
    export GOVC_USERNAME='administrator@vsphere.local' && export GOVC_PASSWORD='ZAQ!xsw2' && \
    govc ls -json true /Datacenter/vm | \
    jq -c '[.elements[].Object.config | select((has("annotation")) and (.annotation|test("${_AuthenticatedUser}")))] | map({name})'`,
      { shell: true }
    );
    govc_ls_vm.stderr.on('data', (data: any) => {
      L.info('govc_ls_vm stderr: ' + data.toString());
    });
    govc_ls_vm.stdout.on('data', (data: any) => {
      L.info('govc_ls_vm stdout: ' + data.toString());

      if (isJsonString(data.toString())) {
        const authUserVMs = eval(data.toString());
        resolve(authUserVMs);
        L.info(
          `govc_ls_vm: ${_AuthenticatedUser}'s VMs: ${JSON.stringify(
            authUserVMs
          )}`
        );
      }
    });
    govc_ls_vm.on('exit', (exitCode: any) => {
      L.info('govc_ls_vm exited with code: ' + exitCode);
    });
  });

const one = (VMNAME: string): Promise<VM> =>
  new Promise<VM>((resolve, reject) => {
    all().then(
      (vms) => {
        const filterResult = vms.filter((vm) => vm.name == VMNAME);
        if (filterResult.length > 0) resolve(filterResult[0]);
        else
          reject(
            `User ${_AuthenticatedUser} does not have a vm named: ${VMNAME}`
          );
      },
      (e) => reject(e)
    );
  });

const add = (VMNAME: string): Promise<VM> =>
  new Promise<VM>((resolve, reject) => {
    all().then(
      (vms) => {
        if (vms.length == 4) {
          L.error(
            `ERROR: User ${_AuthenticatedUser} vms amount limit (4) has been reached`
          );
          reject(
            `User ${_AuthenticatedUser} vms amount limit (4) has been reached`
          );
        } else {
          const govc_vm_create = require('child_process').spawn(
            `export GOVC_URL='https://192.168.10.113' && export GOVC_INSECURE='true' && 
          export GOVC_USERNAME='administrator@vsphere.local' && export GOVC_PASSWORD='ZAQ!xsw2' && 
          govc vm.create -annotation="{'VirtmanOwner': '${_AuthenticatedUser}'}" \
          -host='192.168.10.128' -ds=datastore1 -on=false -m=1024 -c=1 -disk=100MB ${VMNAME}`,
            { shell: true }
          );
          let errors = '';
          govc_vm_create.stderr.on('data', (data: any) => {
            errors += data.toString() + '\n';
            L.info('govc_vm_create stderr: ' + data.toString());
          });
          govc_vm_create.stdout.on('data', (data: any) => {
            L.info('govc_vm_create stdout: ' + data.toString());
          });
          govc_vm_create.on('exit', (exitCode: any) => {
            L.info('govc_vm_create exited with code: ' + exitCode);
            if (exitCode == 0) one(VMNAME).then((vm) => resolve(vm));
            else reject(errors);
          });
        }
      },
      (e) => reject(e)
    );
  });

const del = (VMNAME: string): Promise<VM[]> =>
  new Promise<VM[]>((resolve, reject) => {
    one(VMNAME).then(
      (_) => {
        const govc_vm_destroy = require('child_process').spawn(
          `export GOVC_URL='https://192.168.10.113' && export GOVC_INSECURE='true' && 
        export GOVC_USERNAME='administrator@vsphere.local' && export GOVC_PASSWORD='ZAQ!xsw2' && 
        govc vm.destroy ${VMNAME}`,
          { shell: true }
        );
        let errors = '';
        govc_vm_destroy.stderr.on('data', (data: any) => {
          errors += data.toString() + '\n';
          L.info('govc_vm_destroy stderr: ' + data.toString());
        });
        govc_vm_destroy.stdout.on('data', (data: any) => {
          L.info('govc_vm_destroy stdout: ' + data.toString());
        });
        govc_vm_destroy.on('exit', (exitCode: any) => {
          L.info('govc_vm_destroy exited with code: ' + exitCode);
          if (exitCode == 0) all().then((vms) => resolve(vms));
          else reject(errors);
        });
      },
      (e) => reject(e)
    );
  });

export default express
  .Router()
  .get('/', (_req: Request, res: Response) => {
    all().then(
      (vms) => {
        res.status(200).json(vms); //res.send(us);
        L.info(`get all: ${_AuthenticatedUser}'s VMs: ${JSON.stringify(vms)}`);
      },
      (e) => res.set('_error', e).status(400).end()
    );
  })
  .get('/:VMNAME', (req: Request, res: Response) => {
    one(req.params['VMNAME']).then(
      (vm) => res.status(200).json(vm),
      (e) => res.set('_error', e).status(404).end()
    );
  })
  .post('/', (req: Request, res: Response) => {
    add(req.body.name).then(
      (vm) => res.status(201).json(vm),
      (e) => res.set('_error', e).status(400).end()
    );
  })
  .delete('/:VMNAME', (req: Request, res: Response) => {
    del(req.params['VMNAME']).then(
      (vms) => res.status(200).json(vms),
      (e) => res.set('_error', e).status(404).end(e)
    );
  });

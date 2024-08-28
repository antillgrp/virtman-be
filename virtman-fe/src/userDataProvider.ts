//import simpleRestProvider from "ra-data-simple-rest";

import { CreateParams, CreateResult, DeleteManyParams, DeleteManyResult, DeleteParams, DeleteResult, GetListParams, GetListResult, GetManyParams, GetManyReferenceParams, GetManyReferenceResult, GetManyResult, GetOneParams, GetOneResult, Identifier, QueryFunctionContext, RaRecord, UpdateManyParams, UpdateManyResult, UpdateParams, UpdateResult } from "react-admin";

//export const dataProvider = simpleRestProvider(
//  "http://192.168.10.110:3000/api" //import.meta.env.VITE_SIMPLE_REST_URL,
//);

//https://www.youtube.com/watch?v=sciDJAUEu_M

const API_URL = "http://192.168.10.110:3000/api";

export const userDataProvider = {

  getList: (_resource: string, _params: any) => new Promise((resolve, reject) => {
    console.log("getList " + _resource + " params:" + JSON.stringify(_params));
    fetch(`${API_URL}/${'users'}`).then(
      respose => respose.json().then(
        fetchData => {
          console.log("fetchData:" + JSON.stringify(fetchData));
          if (fetchData instanceof Array) resolve({
            data: fetchData.map((user, i) => ({ id: i, username: `${user.Id.Name}`, domain: `${user.Id.Domain}`})),
            total: fetchData.length
          });
        },
        e => reject(e)
      ),
      e => reject(e)
    );
  }),
  create: (_resource: string, _params: any) => new Promise((_resolve, reject) => {
    console.log("create params:" + JSON.stringify(_params));
    reject("Function not implemented.");
  }),
  delete: (_resource: string, _params: any) => new Promise((_resolve, reject) => {
    reject("Function not implemented.");
  }),
  getOne: (_resource: string, _params: any) => new Promise((_resolve, reject) => {
    reject("Function not implemented.");
  }),
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  getMany: function <RecordType extends RaRecord = any>(_resource: string, _params: GetManyParams<RecordType> & QueryFunctionContext): Promise<GetManyResult<RecordType>> {
    throw new Error("Function not implemented.");
  },
  getManyReference: function <RecordType extends RaRecord = any>(_resource: string, _params: GetManyReferenceParams & QueryFunctionContext): Promise<GetManyReferenceResult<RecordType>> {
    throw new Error("Function not implemented.");
  },
  update: function <RecordType extends RaRecord = any>(_resource: string, _params: UpdateParams): Promise<UpdateResult<RecordType>> {
    throw new Error("Function not implemented.");
  },
  updateMany: function <RecordType extends RaRecord = any>(_resource: string, _params: UpdateManyParams): Promise<UpdateManyResult<RecordType>> {
    throw new Error("Function not implemented.");
  },
  deleteMany: function <RecordType extends RaRecord = any>(_resource: string, _params: DeleteManyParams<RecordType>): Promise<DeleteManyResult<RecordType>> {
    throw new Error("Function not implemented.");
  },
}
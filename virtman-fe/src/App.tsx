import {
  Admin,
  Resource,
  ListGuesser,
  Create,
  SimpleForm,
  TextInput,PasswordInput,
  required, useNotify,
} from "react-admin";
import { Box, Typography } from '@mui/material';
//import simpleRestProvider from "ra-data-simple-rest";

import { Layout } from "./Layout";
import { userDataProvider } from "./userDataProvider";
import { authProvider } from "./authProvider";

const Aside = () => (
  <Box sx={{ width: '200px', margin: '1em' }}>
      <Typography variant="h6">Instructions</Typography>
      <Typography variant="body2">
          Posts will only be published once an editor approves them
      </Typography>
  </Box>
);

export const UserCreate = () => {
  const notify = useNotify();
  const onSuccess = (_data: any) => { notify(`User Added`) };
  const onError = (error: { message: any; }) => { notify(`Could not create post: ${error.message}`); };

  return (
    <Create
      title="Create user"
      aside={<Aside />}
      disableAuthentication
      mutationOptions={{ onError,onSuccess }}
      redirect="list"
      resource="users"
    >
        <SimpleForm>
            <TextInput source="username" validate={[required()]} label="username"/>
            <PasswordInput source="password"/>
        </SimpleForm>
    </Create>
  )
};

export const App = () => (
  <Admin
    layout={Layout}
    dataProvider={userDataProvider}
    authProvider={authProvider}
  >
    <Resource
      name="users"
      list={ListGuesser}
      create={UserCreate}
      // edit={EditGuesser}
      // show={ShowGuesser}
    />
    {/* <Resource
      name="vms"
      list={ListGuesser}
      edit={EditGuesser}
      show={ShowGuesser}
    /> */}
  </Admin>
);

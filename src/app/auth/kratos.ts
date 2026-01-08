import { Configuration, FrontendApi } from '@ory/client';

const kratosConfig = new Configuration({
  basePath: 'http://localhost:4200/auth',
  baseOptions: {
    withCredentials: true,
  },
});

export const kratos = new FrontendApi(kratosConfig);

import { Configuration, FrontendApi } from '@ory/client';

const kratosConfig = new Configuration({
  basePath: '/auth',
  baseOptions: {
    withCredentials: true,
  },
});

export const kratos = new FrontendApi(kratosConfig);

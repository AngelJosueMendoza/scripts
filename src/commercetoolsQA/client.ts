import { ctpClient } from './buildClient';
import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk';
import { CTP_PROJECT_KEY } from './credentials';

export const apiRootQA = createApiBuilderFromCtpClient(ctpClient).withProjectKey({ projectKey: CTP_PROJECT_KEY });

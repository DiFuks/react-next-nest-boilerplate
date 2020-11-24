import { NodeEnv } from '@common/enums/NodeEnv';
import { ConfigName } from '@common/enums/ConfigName';

declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface ProcessEnv {
      [ConfigName.NODE_ENV]: NodeEnv;
      [ConfigName.NEST_SERVER_PORT]: string;
      [ConfigName.NEST_LOG_PATH]: string;
      [ConfigName.HTTP_HOST]: string;
      [ConfigName.HTTP_SCHEME]: string;
    }
  }
}

import { IConfigApp } from '@Core/domain/config.interface';
import envConfig from 'config';

/**
 * Get the environment variables from .env file and set them to an object
 * @returns .env configs as object
 */
const initEnvConfigs = () => {
  let loaded = false;

  const init = () => {
    if (!envConfig) {
      throw new Error('Failed to load configs');
    }

    loaded = true;
  };

  const getConfigs = (): IConfigApp => {
    if (!loaded) {
      init();
    }

    return envConfig.util.toObject();
  };

  return {
    getConfigs,
  };
};

export const envConfigs = initEnvConfigs();

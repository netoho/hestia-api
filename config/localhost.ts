import { IConfigApp } from '../src/core/domain/config.interface';
import { DeepPartial } from '../src/core/domain/types/deep-partial';

const localhostConfig: DeepPartial<IConfigApp> = {
  environment: 'localhost',
};

module.exports = localhostConfig;

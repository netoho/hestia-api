import { IConfigApp } from '../src/core/domain/config.interface';
import { DeepPartial } from '../src/core/domain/types/deep-partial';

const productionConfig: DeepPartial<IConfigApp> = {
  environment: 'staging',
};

module.exports = productionConfig;

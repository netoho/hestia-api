import { IConfigApp } from '../src/core/domain/config.interface';
import { DeepPartial } from '../src/core/domain/types/deep-partial';

const developConfig: DeepPartial<IConfigApp> = {
  environment: 'develop',
};

module.exports = developConfig;

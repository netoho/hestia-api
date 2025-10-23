import { envConfigs } from '@Src/core/infrastructure/get-configs';
import { JsonController, Get } from 'routing-controllers';
import { Service } from 'typedi';

@Service()
@JsonController('/api')
export class HealthController {
  constructor() {}

  @Get('/healthcheck')
  public async createByTemplate() {
    const { appVersion } = envConfigs.getConfigs();
    return { appVersion };
  }
}

import { LogService, Level } from '@cliengo/logger';
import { envConfigs } from '@Src/core/infrastructure/get-configs';

/**
 * @see https://refactoring.guru/design-patterns/singleton/typescript/example
 */
export class LoggerInstance {
  private static _instance: LogService;

  static get instance(): LogService {
    if (!LoggerInstance._instance) {
      try {
        const config = envConfigs.getConfigs();
        LoggerInstance._instance = new LogService(config.logger.level as Level);
      } catch (error) {
        console.error('Error creating log instance', error);
      }
    }
    return LoggerInstance._instance;
  }
}

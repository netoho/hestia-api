import { ICacheRepository } from '@Database/cache/interface';
import { envConfigs } from '@Src/core/infrastructure/get-configs';
import Redis, { RedisOptions } from 'ioredis';

// @staticImplements<ICacheRepositoryStatic>()
export class CacheRedis implements ICacheRepository {
  private client: Redis;
  private expired: number;
  private prefix: string;
  // eslint-disable-next-line no-use-before-define
  private static _instance: CacheRedis;

  constructor(options: RedisOptions, expired: number, prefix: string) {
    const clientNoAsync = new Redis(options);
    this.client = clientNoAsync;
    this.expired = expired;
    this.prefix = prefix;
  }

  async saveObject(key: string, value: any, expired: number = this.expired): Promise<any> {
    const valueStringObj = JSON.stringify(value, null, 0);
    return await this.client.set(key, valueStringObj, 'EX', expired);
  }

  async getObject(key: string): Promise<any> {
    const data = await this.client.get(key);
    let objectData;
    if (data) {
      objectData = JSON.parse(data);
    }
    return objectData;
  }

  async getPropertyObject(key: string, property: string): Promise<any> {
    const context = await this.getObject(key);
    return context[property] || undefined;
  }

  async del(key: string): Promise<any> {
    return await this.client.del(key);
  }

  async get(key: string): Promise<any> {
    const result = await this.client.get(key);
    return result;
  }

  async set(key: string, value: any, expired: number = this.expired): Promise<any> {
    const result = await this.client.set(key, value, 'EX', expired);
    return result;
  }

  public static get instance(): CacheRedis {
    if (!CacheRedis._instance) {
      const { redis } = envConfigs.getConfigs();
      const { host, port, username, password, db, expire, prefix } = redis;
      CacheRedis._instance = new CacheRedis(
        {
          host,
          port,
          username,
          password,
          db,
          maxRetriesPerRequest: 0,
        },
        expire.general,
        prefix.basePrefix,
      );
    }
    return CacheRedis._instance;
  }
}

// function staticImplements<T>() {
//   return <U extends T>(constructor: U) => {
//     // eslint-disable-next-line no-unused-expressions
//     constructor;
//   };
// }

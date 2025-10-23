export interface ICacheRepository {
  saveObject(key: string, value: any, expired?: number): void;
  getObject(key: string): any;
  getPropertyObject(key: string, property: string): void;
  del(key: string): void;
  set(key: string, value: any, expired?: number): void;
  get(key: string): Promise<any>;
}

// export interface ICacheRepositoryStatic {
//     new(host, port, expired, loggerService):ICacheRepository;
//     getInstance(host, port, expired, loggerService);
// }

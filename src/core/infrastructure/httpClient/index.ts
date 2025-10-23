import { correlator } from '@cliengo/logger';
import { logger } from '@Src/core/infrastructure/logger';
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Service } from 'typedi';
import { v4 as uuidv4 } from 'uuid';

export interface IHttpClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  setHeader(keyHeader: string, valueHeader: string): void;
  setAuthorization(token: string): void;
}

declare module 'axios' {
  interface AxiosResponse<T = any> extends Promise<T> {}
}

@Service()
export default class HttpClient implements IHttpClient {
  private axiosInstance: AxiosInstance;
  private headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  constructor() {
    this.axiosInstance = axios.create();
    this.headers['x-correlation-id'] = correlator.getId() || uuidv4();
    this._initializeResponseInterceptor();
    this._initializeRequestInterceptor();
  }

  private _initializeResponseInterceptor = () => {
    this.axiosInstance.interceptors.response.use(this._handleResponse, this._handleError);
  };

  private _initializeRequestInterceptor = () => {
    this.axiosInstance.interceptors.request.use(this._handleRequest);
  };

  private _handleRequest = (config: InternalAxiosRequestConfig) => {
    for (const header of Object.keys(this.headers)) {
      config.headers[header] = this.headers[header];
    }
    return config;
  };

  private _handleResponse = ({ data }: AxiosResponse) => data;

  protected _handleError = (error: unknown): Promise<unknown> => Promise.reject(error);

  public setHeader = (keyHeader: string, valueHeader: string): void => {
    this.headers[keyHeader] = valueHeader;
  };

  public setAuthorization = (token: string): void => {
    this.headers.Authorization = 'Bearer '.concat(token);
  };

  public async get<T>(path: string, context?: string): Promise<T> {
    logger.serviceRequest({
      context,
      metadata: {
        method: 'GET',
        path,
      },
    });

    const req = await this.axiosInstance.get(path);
    logger.serviceResponse({
      context,
      metadata: {
        method: 'GET',
        path,
        response: req,
      },
    });
    return req;
  }

  public async post<T>(path: string, body: any = {}, context?: string): Promise<T> {
    logger.serviceRequest({
      context,
      metadata: {
        method: 'POST',
        path,
        body,
      },
    });
    const req = await this.axiosInstance.post(path, body);
    logger.serviceResponse({
      context,
      metadata: {
        method: 'POST',
        path,
        response: req,
      },
    });
    return req;
  }

  public async put<T>(path: string, body: any = {}, context?: string): Promise<T> {
    logger.serviceRequest({
      context,
      metadata: {
        method: 'PUT',
        path,
        body,
      },
    });
    const req = await this.axiosInstance.put(path, body);
    logger.serviceResponse({
      context,
      metadata: {
        method: 'PUT',
        path,
        response: req,
      },
    });
    return req;
  }

  public async delete<T>(path: string, body: any = {}, context?: string): Promise<T> {
    logger.serviceRequest({
      context,
      metadata: {
        method: 'DELETE',
        path,
        body,
      },
    });
    const req = await this.axiosInstance.delete(path, body);
    logger.serviceResponse({
      context,
      metadata: {
        method: 'DELETE',
        path,
        response: req,
      },
    });
    return req;
  }

  public async patch<T>(path: string, body: any = {}, context?: string): Promise<T> {
    logger.serviceRequest({
      context,
      metadata: {
        method: 'PATCH',
        path,
        body,
      },
    });
    const req = await this.axiosInstance.patch(path, body);
    logger.serviceResponse({
      context,
      metadata: {
        method: 'PATCH',
        path,
        response: req,
      },
    });
    return req;
  }
}

import { DeepPartial } from '@Src/core/domain/types/deep-partial';
import { FilterQuery, UpdateQuery } from 'mongoose';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export interface IBaseRepository<T> {
  getAll(filter?: FilterQuery<T>): Promise<T[]>;
  getPaginated(
    page: number,
    limit: number,
    orderDescBy: keyof T,
    populate?: string | string[],
    select?: any
  ): Promise<T[]>;
  insert(entity: T, filedId: keyof T): Promise<T>;
  getBy(field: keyof T, value: string | number | any): Promise<T | null>;
  update(field: keyof T, value: string | number | any, entity: UpdateQuery<T>): Promise<T>;
  delete(conditions: DeepPartial<T>): Promise<void>;
}

export interface IQueryPagination<T> {
    offset: number,
    limit: number,
    orderBy?: keyof T,
    sortOrder?: SortOrder,
}

export interface IFacetedResult<T> {
  count: number,
  results: T[],
}

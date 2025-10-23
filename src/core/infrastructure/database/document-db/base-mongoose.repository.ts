import { descSort } from '@Database/document-db/constants';
import { IBaseRepository } from '@Database/document-db/types/base-repository.interface';
import { Document, FilterQuery, Model, UpdateQuery } from 'mongoose';

export abstract class BaseMongooseRepository<T extends Document> implements IBaseRepository<T> {
  protected readonly model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  public async getAll(filter?: FilterQuery<T>): Promise<T[]> {
    return await this.model.find(filter ?? {}).lean({ virtuals: true });
  }

  public async getAllDistinct(field: keyof T, filter?: FilterQuery<T>): Promise<any[]> {
    return await this.model.find(filter ?? {}).distinct(field as string).lean({ virtuals: true });
  }

  public async getPaginated(
    page: number,
    limit: number,
    orderDescBy: keyof T,
    populate?: string | string[],
    select?: any,
  ): Promise<T[]> {
    const skip = page * limit;
    const orderBy = { [orderDescBy]: descSort };

    if (populate) {
      return await this.model
        .find()
        .populate(populate, select)
        .skip(skip)
        .limit(limit)
        .sort(orderBy)
        .lean({ virtuals: true });
    } else {
      return await this.model.find().skip(skip).limit(limit).sort(orderBy).lean({ virtuals: true });
    }
  }

  public async getBy(field: keyof T, value: string | number | any): Promise<T | null> {
    const filterQuery = {
      [field]: value,
    };

    return await this.model.findOne(filterQuery as FilterQuery<T>).lean({ virtuals: true });
  }

  public async getOne(filter: FilterQuery<T>): Promise<T | null> {
    return await this.model.findOne(filter).lean({ virtuals: true });
  }

  public async insert(entity: Partial<T>): Promise<any> {
    return await this.model.create(entity);
  }

  public async update(field: keyof T, value: string, entity: UpdateQuery<T>): Promise<T> {
    const filter = {
      [field]: value,
    } as FilterQuery<T>;
    return this.model.findOneAndUpdate(filter, entity, { new: true }).lean({ virtuals: true });
  }

  public async updateOne(id: string, entity: UpdateQuery<T>): Promise<T> {
      return this.update('_id', id, entity);
  }

  public async delete(conditions: FilterQuery<T>): Promise<void> {
    await this.model.deleteOne(conditions);
  }

  public async deleteMany(conditions: FilterQuery<T>): Promise<void> {
    await this.model.deleteMany(conditions);
  }

  public async count(params: FilterQuery<T>): Promise<number> {
    return await this.model.count(params);
  }

  public async bulkInsert(entities: Partial<T>[]): Promise<T[]> {
    const createdDocuments = await this.model.insertMany(entities);
    return createdDocuments.map(doc => {
        return doc.toJSON() as T;
    });
}
}

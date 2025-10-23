import { SortOrder } from '@Database/document-db/types/base-repository.interface';
import { IsArray, IsNumber, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginatedParamsDto {
    @IsOptional()
    @IsNumber()
    @Min(0)
    offset?: number = 0;

    @IsOptional()
    @IsNumber()
    @Max(1000)
    @Min(1)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    orderBy?: string;

    @IsOptional()
    @IsString()
    sortOrder?: SortOrder = SortOrder.DESC;

    @IsOptional()
    @IsString()
    search?: string;
}

export class MetaPaginatedDto {
    @IsNumber()
    offset: number;

    @IsNumber()
    limit: number;

    @IsNumber()
    total: number;
}

export class DefaultResponse<T = object> {
    @IsString()
    message: string;

    @IsOptional()
    @IsObject()
    result?: T;
}

export class PaginatedResponseAttrs<T> {
  @IsArray()
  results: T[];

  @IsNumber()
  count: number;
}

export class DefaultPaginatedResponse<T = object> extends DefaultResponse<PaginatedResponseAttrs<T>> {}

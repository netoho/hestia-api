import { PaginatedResponseAttrs } from '@Src/core/application/global.dto';
import { Service } from 'typedi';

import { AuthService } from '../auth/jwt.auth';
import { envConfigs } from '../get-configs';
import { logger } from '../logger';

import { HermesClient } from './hermes.client';

const MODULE_NAME = 'finance';

export enum RecordType {
  DEAL = 'deal',
  INVOICE = 'invoice',
  PAYMENT_TRACKER = 'payment_tracker',
}

export interface AuditLogAddedField {
    name: string;
    value: string;
}

export interface AuditLogUpdatedField {
    name: string;
    newValue?: string | null;
    oldValue: string | null;
}

export type AuditLogRemovedFieldName = string;

export interface AuditLogDiff {
  added?: AuditLogAddedField[],
  updated?: AuditLogUpdatedField[],
  removed?: AuditLogRemovedFieldName[],
};

export interface AuditLog {
    recordType: RecordType,
    recordKey: string,
    eventType?: string, // Like "CREATED", "UPDATED", "DELETED" or custom like "INVOICE_DOWNLOADED"
    userId: number,
    userFullname: string,
    description: string,
    metadata?: Record<string, unknown>,
    fields: AuditLogDiff
}

export type AuditLogParams = Omit<AuditLog, 'module'>;

@Service()
export class AuditLogsClient extends HermesClient {
  private readonly apiEndpoint: string;

  constructor(
    authService: AuthService,
  ) {
    super(authService);

    this.apiEndpoint = `${this.apiUrl}/audit-logs/modules/${MODULE_NAME}`;
  }

  public async sendLog(logParams: AuditLogParams): Promise<void> {
    if (envConfigs.getConfigs().auditLogs.disabled) {
      logger.debug({
        context: 'AuditLogsClient.sendLog',
        message: logParams.description,
        metadata: logParams,
      });
      return;
    }

    await this.makeRequest(logParams);
  }

  public async getLogs(id: string): Promise<PaginatedResponseAttrs<AuditLog>> {
    if (envConfigs.getConfigs().auditLogs.disabled) {
        logger.debug({
            context: 'AuditLogsClient.getLogs',
            message: `Getting logs for id: ${id}`,
        });
        return { results: [], count: 0 };
      }
      const serviceToken: string = await this.getServiceToken();
      this.setAuthorization(serviceToken);
      const searchParams = new URLSearchParams({ recordKey: id, recordType: RecordType.PAYMENT_TRACKER });
      const allRecordLogs = await this.get<AuditLog[]>(`${this.apiEndpoint}?${searchParams.toString()}`, 'AuditLogsClient.list');
      return { results: allRecordLogs, count: allRecordLogs.length };
    }

  private async makeRequest(auditLog: AuditLogParams): Promise<void> {
    const serviceToken: string = await this.getServiceToken();

    this.setAuthorization(serviceToken);

    await this.post<void>(this.apiEndpoint, auditLog, 'AuditLogsClient.create');
  }
}

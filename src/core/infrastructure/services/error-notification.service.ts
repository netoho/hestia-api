import { ErrorCode } from '@cliengo/logger';
import { logger } from '@Src/core/infrastructure/logger';
import { SQSService } from '@Src/core/infrastructure/services/sqs.service';
import { Service } from 'typedi';

export interface ErrorNotificationData {
    context: string;
    paymentId?: string;
    invoiceId?: string;
    error: any;
    userData?: any;
    additionalData?: Record<string, any>;
}

@Service()
export class ErrorNotificationService {
    constructor(private sqsService: SQSService) {}

    public async notifyDevelopers(data: ErrorNotificationData): Promise<void> {
        try {
            const errorMessage = this.extractErrorMessage(data.error);
            const errorStack = this.extractErrorStack(data.error);

            await this.sqsService.sendErrorNotification(
                {
                    message: errorMessage,
                    stack: errorStack,
                    code: data.error?.code,
                    response: data.error?.response?.data,
                },
                data.context,
                {
                    paymentId: data.paymentId,
                    invoiceId: data.invoiceId,
                    userData: data.userData,
                    ...data.additionalData,
                },
            );

            logger.debug({
                context: 'ErrorNotificationService.notifyDevelopers',
                message: 'Developer notification sent',
                metadata: {
                    errorContext: data.context,
                },
            });
        } catch (notificationError) {
            // Log but don't throw - we don't want notification failures to break the flow
            logger.exception({
                context: 'ErrorNotificationService.notifyDevelopers',
                message: 'Failed to send developer notification',
                errorCode: ErrorCode.UNCAUGHT_EXCEPTION,
                metadata: {
                    error: notificationError,
                    data,
                },
            });
        }
    }

    private extractErrorMessage(error: any): string {
        if (typeof error === 'string') {
            return error;
        }

        if (error?.message) {
            return error.message;
        }

        if (error?.response?.data?.message) {
            return error.response.data.message;
        }

        return 'Unknown error occurred';
    }

    private extractErrorStack(error: any): string | undefined {
        if (error?.stack) {
            return error.stack;
        }

        return undefined;
    }

    public async notifyInvoiceError(
        invoiceId: string,
        paymentId: string,
        error: any,
        fiscalData?: any,
    ): Promise<void> {
        await this.notifyDevelopers({
            context: 'Invoice Generation Failed',
            invoiceId,
            paymentId,
            error,
            additionalData: {
                fiscalData,
                timestamp: new Date().toISOString(),
            },
        });
    }

    public async notifyPaymentError(
        paymentId: string,
        error: any,
        paymentData?: any,
    ): Promise<void> {
        await this.notifyDevelopers({
            context: 'Payment Processing Failed',
            paymentId,
            error,
            additionalData: {
                paymentData,
                timestamp: new Date().toISOString(),
            },
        });
    }
}

import { SQSClient, SendMessageCommand, SendMessageCommandInput } from '@aws-sdk/client-sqs';
import { ErrorCode } from '@cliengo/logger';
import { envConfigs } from '@Src/core/infrastructure/get-configs';
import { logger } from '@Src/core/infrastructure/logger';
import { Invoice } from '@Src/invoicing-system/invoice/domain/entities/invoice.entity';
import { Service } from 'typedi';

export interface EmailMessage {
    to: string;
    subject: string;
    body: string;
    attachments?: Array<{
        filename: string;
        content: string; // Base64 encoded
        contentType: string;
    }>;
}

@Service()
export class SQSService {
    private sqs: SQSClient;
    private queueUrl: string;

    constructor() {
        const configs = envConfigs.getConfigs();

        this.sqs = new SQSClient({
            region: configs.aws.region,
        });

        this.queueUrl = configs.aws.sqsQueueUrl;
    }

    public async sendEmailMessage(emailData: EmailMessage): Promise<void> {
        if (!this.queueUrl) {
            logger.serverError({
                context: 'SQSService.sendEmailMessage',
                message: 'SQS queue URL not configured, skipping email send',
                errorCode: ErrorCode.UNCAUGHT_EXCEPTION,
                metadata: {
                    to: emailData.to,
                },
            });
            return;
        }

        const template = 'generic-message';

        try {
            const messageBody = JSON.stringify({
                notificationType: 'email',
                template,
                targetEmail: emailData.to,
                data: emailData,
                body: emailData.body,
                // attachments: emailData.attachments, // TODO: Check attachments size. Right now it is exceeding the limit of 256 KB
            });

            const params: SendMessageCommandInput = {
                QueueUrl: this.queueUrl,
                MessageGroupId: `EMAIL_MESSAGES-${template}`,
                MessageDeduplicationId: `${template}-${emailData.to}-${Date.now()}`,
                MessageBody: messageBody,
                MessageAttributes: {
                    Type: {
                        DataType: 'String',
                        StringValue: 'EMAIL',
                    },
                    To: {
                        DataType: 'String',
                        StringValue: emailData.to,
                    },
                },
            };

            const result = await this.sqs.send(new SendMessageCommand(params));

            logger.debug({
                context: 'SQSService.sendEmailMessage',
                message: 'Email message queued successfully',
                metadata: {
                    messageId: result.MessageId,
                    to: emailData.to,
                    subject: emailData.subject,
                },
            });
        } catch (error) {
            logger.exception({
                context: 'SQSService.sendEmailMessage',
                message: 'Failed to queue email message',
                errorCode: ErrorCode.UNCAUGHT_EXCEPTION,
                metadata: {
                    error,
                    to: emailData.to,
                    subject: emailData.subject,
                },
            });
            throw error;
        }
    }

    public async sendInvoiceEmail(
        email: string,
        invoice: Invoice,
        pdfBuffer: Buffer,
        xmlBuffer: Buffer,
        fiscalData: {
            rfc: string;
            legal_name: string;
            uuid?: string;
        },
    ): Promise<void> {
        const emailData: EmailMessage = {
            to: email,
            subject: `Factura Electrónica - ${fiscalData.legal_name}`,
            body: `
                <h1>Estimado cliente,</h1>
                
                <p>Adjunto encontrará su factura electrónica con los siguientes datos:</p>
                
                <p>RFC: ${fiscalData.rfc}</p>
                <p>Razón Social: ${fiscalData.legal_name}</p>
                <p>${fiscalData.uuid ? `UUID: ${fiscalData.uuid}` : ''}</p>
                
                <p>Puedes encontrar la factura electrónica en nuestro portal</p>
                <p>
                    <a
                        href="${envConfigs.getConfigs().sites.facturacion}/invoice/${invoice.id}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Ver factura electrónica
                    </a>
                </p>
                
                <p>Saludos cordiales,</p>
                <p>IAD México</p>
            `,
            attachments: [
                {
                    filename: `factura_${invoice.id}.pdf`,
                    content: pdfBuffer.toString('base64'),
                    contentType: 'application/pdf',
                },
                {
                    filename: `factura_${invoice.id}.xml`,
                    content: xmlBuffer.toString('base64'),
                    contentType: 'application/xml',
                },
            ],
        };

        await this.sendEmailMessage(emailData);
    }

    public async sendErrorNotification(
        error: any,
        context: string,
        additionalData?: Record<string, any>,
    ): Promise<void> {
        const emailData: EmailMessage = {
            to: 'developers@iadmexico.mx',
            subject: `[Finance API] Error in ${context}`,
            body: `
                An error occurred in the Finance API:
                
                Context: ${context}
                Timestamp: ${new Date().toISOString()}
                
                Error Details:
                ${JSON.stringify(error, null, 2)}
                
                Additional Data:
                ${additionalData ? JSON.stringify(additionalData, null, 2) : 'None'}
                
                Please investigate and resolve this issue.
            `,
        };

        await this.sendEmailMessage(emailData);
    }
}

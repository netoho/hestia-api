import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';
import { ErrorCode } from '@cliengo/logger';
import { envConfigs } from '@Src/core/infrastructure/get-configs';
import { logger } from '@Src/core/infrastructure/logger';
import { Service } from 'typedi';

@Service()
export class S3Service {
    private s3: S3Client;
    private bucketName: string;

    constructor() {
        const configs = envConfigs.getConfigs();

        this.s3 = new S3Client({
            region: configs.aws.region,
        });

        this.bucketName = configs.aws.s3BucketName;
    }

    public async uploadInvoiceFiles(
        userId: number | undefined,
        invoiceId: string,
        pdf: Buffer,
        xml: Buffer,
    ): Promise<{ pdfKey: string; xmlKey: string }> {
        const timestamp = Date.now();
        const basePath = userId
            ? `/${userId.toString()}/invoices/${invoiceId}`
            : `/invoices/${invoiceId}`;

        const pdfKey = `${basePath}/${timestamp}_invoice.pdf`;
        const xmlKey = `${basePath}/${timestamp}_invoice.xml`;

        try {
            // Upload PDF
            await this.s3.send(new PutObjectCommand({
                Bucket: this.bucketName,
                Key: pdfKey,
                Body: pdf,
                ContentType: 'application/pdf',
                Metadata: {
                    invoiceId,
                },
            }));

            // Upload XML
            await this.s3.send(new PutObjectCommand({
                Bucket: this.bucketName,
                Key: xmlKey,
                Body: xml,
                ContentType: 'application/xml',
                Metadata: {
                    invoiceId,
                },
            }));

            logger.debug({
                context: 'S3Service.uploadInvoiceFiles',
                message: 'Invoice files uploaded successfully',
                metadata: {
                    invoiceId,
                    pdfKey,
                    xmlKey,
                },
            });

            return { pdfKey, xmlKey };
        } catch (error) {
            logger.exception({
                context: 'S3Service.uploadInvoiceFiles',
                message: 'Failed to upload invoice files',
                errorCode: ErrorCode.UNCAUGHT_EXCEPTION,
                metadata: {
                    error,
                    invoiceId,
                },
            });
            throw error;
        }
    }

    public async uploadFile(
        key: string,
        body: Buffer,
        contentType: string,
        metadata?: Record<string, string>,
    ): Promise<string> {
        try {
            await this.s3.send(new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: body,
                ContentType: contentType,
                Metadata: metadata,
            }));

            const url = await this.getSignedUrl(key);

            logger.debug({
                context: 'S3Service.uploadFile',
                message: 'File uploaded successfully',
                metadata: {
                    key,
                },
            });

            return url;
        } catch (error) {
            logger.exception({
                context: 'S3Service.uploadFile',
                message: 'Failed to upload file',
                errorCode: ErrorCode.UNCAUGHT_EXCEPTION,
                metadata: {
                    error,
                    key,
                },
            });
            throw error;
        }
    }

    public async downloadFile(key: string): Promise<Buffer> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            const response = await this.s3.send(command);
            return response.Body as unknown as Buffer;
        } catch (error) {
            logger.exception({
                context: 'S3Service.downloadFile',
                message: 'Failed to download file',
                errorCode: ErrorCode.UNCAUGHT_EXCEPTION,
                metadata: {
                    error,
                    key,
                },
            });
            throw error;
        }
    }

    public async getSignedUrl(key: string, expiresIn: number = 604800): Promise<string> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            return await getS3SignedUrl(this.s3, command, { expiresIn });
        } catch (error) {
            logger.exception({
                context: 'S3Service.getSignedUrl',
                message: 'Failed to generate signed URL',
                errorCode: ErrorCode.UNCAUGHT_EXCEPTION,
                metadata: {
                    error,
                    key,
                },
            });
            throw error;
        }
    }

    public async deleteFile(key: string): Promise<void> {
        try {
            await this.s3.send(new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            }));

            logger.debug({
                context: 'S3Service.deleteFile',
                message: 'File deleted successfully',
                metadata: {
                    key,
                },
            });
        } catch (error) {
            logger.exception({
                context: 'S3Service.deleteFile',
                message: 'Failed to delete file',
                errorCode: ErrorCode.UNCAUGHT_EXCEPTION,
                metadata: {
                    error,
                    key,
                },
            });
            throw error;
        }
    }
}

import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService
 * Wrapper for PrismaClient with TypeDI integration
 * Singleton service that manages database connections
 */
@Service()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
    });

    // Connect to database on initialization
    this.connect();
  }

  /**
   * Connect to the database
   */
  async connect(): Promise<void> {
    try {
      await this.$connect();
      console.log('[PrismaService] Successfully connected to database');
    } catch (error) {
      console.error('[PrismaService] Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the database
   */
  async disconnect(): Promise<void> {
    try {
      await this.$disconnect();
      console.log('[PrismaService] Disconnected from database');
    } catch (error) {
      console.error('[PrismaService] Error disconnecting from database:', error);
    }
  }

  /**
   * Execute a transaction with automatic retry
   */
  async executeTransaction<T>(
    operation: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<T>
  ): Promise<T> {
    return (this as PrismaClient).$transaction(operation, {
      maxWait: 5000,
      timeout: 10000,
      isolationLevel: 'Serializable'
    });
  }

  /**
   * Clean up on application shutdown
   */
  async onApplicationShutdown(): Promise<void> {
    await this.disconnect();
  }
}
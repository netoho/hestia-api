/**
 * Base Service
 * Abstract base class for all services with common error handling
 */
export abstract class BaseService {
  /**
   * Handle and format errors consistently
   */
  protected handleError(context: string, error: any): void {
    console.error(`[${context}] Error:`, error);

    // Log additional error details if available
    if (error.stack) {
      console.error(`[${context}] Stack:`, error.stack);
    }

    // Re-throw with context
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`${context}: ${String(error)}`);
    }
  }

  /**
   * Log debug information (only in development)
   */
  protected debug(context: string, data: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${context}]`, data);
    }
  }

  /**
   * Log information
   */
  protected log(context: string, message: string): void {
    console.log(`[${context}] ${message}`);
  }

  /**
   * Validate required fields
   */
  protected validateRequired(data: any, fields: string[]): void {
    const missingFields = fields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Execute with retry logic
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }

    throw lastError;
  }

  /**
   * Format response with consistent structure
   */
  protected formatResponse<T>(data: T, message?: string): {
    success: boolean;
    data: T;
    message?: string;
  } {
    return {
      success: true,
      data,
      ...(message && { message })
    };
  }

  /**
   * Format error response
   */
  protected formatErrorResponse(error: any, context?: string): {
    success: boolean;
    error: string;
    context?: string;
  } {
    return {
      success: false,
      error: error.message || String(error),
      ...(context && { context })
    };
  }
}
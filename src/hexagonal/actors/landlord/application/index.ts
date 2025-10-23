/**
 * Landlord Application Layer Exports
 * Central export point for services and DTOs
 */

// Services
export * from './services/landlord.service';

// DTOs
export * from './dtos/create-landlord.dto';
export * from './dtos/update-landlord.dto';
export * from './dtos/landlord-financial.dto';
export * from './dtos/landlord-property.dto';
export * from './dtos/co-owner.dto';
export * from './dtos/property-ownership-details.dto';

// Re-export commonly used types for convenience
export { LandlordService } from './services/landlord.service';
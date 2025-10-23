import { Container } from 'typedi';
import { PrismaService } from './prisma.service';

/**
 * Shared PrismaService singleton across all modules
 * This prevents circular dependencies during TypeDI container initialization
 */
let sharedPrisma: PrismaService | null = null;

export function getSharedPrisma(): PrismaService {
  if (!sharedPrisma) {
    sharedPrisma = new PrismaService();
    Container.set(PrismaService, sharedPrisma);
  }
  return sharedPrisma;
}

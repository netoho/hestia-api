import { Policy } from '@/hexagonal/policy';

export class PolicyResponseDto {
  success: boolean;
  data?: Policy;
  error?: string;
  message?: string;
}

export class PolicyListResponseDto {
  success: boolean;
  data?: Policy[];
  total?: number;
  error?: string;
  message?: string;
}

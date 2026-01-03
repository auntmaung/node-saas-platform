import { IsEnum } from 'class-validator';
import { SubscriptionPlan } from '@prisma/client';

export class UpgradeDto {
  @IsEnum(SubscriptionPlan)
  plan!: SubscriptionPlan; // allow PRO only; keep generic for demo
}

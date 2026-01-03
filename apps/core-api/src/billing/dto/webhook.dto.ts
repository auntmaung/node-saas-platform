import { IsObject, IsString } from 'class-validator';

export class BillingWebhookDto {
  @IsString()
  eventId!: string;

  @IsString()
  type!: string;

  @IsObject()
  data!: any;
}

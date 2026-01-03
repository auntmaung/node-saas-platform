import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingService } from './billing.service';
import { BillingWebhookDto } from './dto/webhook.dto';
import crypto from 'crypto';

@Controller('webhooks')
export class WebhookController {
  constructor(
    private readonly billing: BillingService,
    private readonly config: ConfigService,
  ) {}

  @Post('billing')
  async billingWebhook(
    @Headers('x-billing-signature') sig: string | undefined,
    @Body() dto: BillingWebhookDto,
  ) {
    const secret = this.config.get<string>('BILLING_WEBHOOK_SECRET') ?? '';
    const expected = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(dto))
      .digest('hex');

    if (!sig || sig !== expected) throw new UnauthorizedException('Invalid signature');

    return this.billing.applyWebhook('demo', dto.eventId, dto.type, dto);
  }
}

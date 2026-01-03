import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue as BullQueue} from 'bullmq';
import IORedis from 'ioredis';

@Injectable()
export class QueuesService {
  private readonly connection: IORedis;
  private readonly notificationsQueue: BullQueue ;

  constructor(private readonly config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    this.connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

    this.notificationsQueue = new BullQueue ('notifications', {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: false, // keep failed jobs = dead-letter visibility
      },
    });
  }

  queueNotifications() {
    return this.notificationsQueue;
  }
}

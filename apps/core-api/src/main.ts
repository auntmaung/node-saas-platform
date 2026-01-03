import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { randomUUID } from 'crypto';

import basicAuth from 'express-basic-auth';
import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

import { QueuesService } from './queues/queues.service';
import 'dotenv/config';

 async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Request ID middleware (ensure x-request-id exists; return it in response)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use((req: any, res: any, next: any) => {
    const incoming = req.headers['x-request-id'];
    const reqId = typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();
    req.headers['x-request-id'] = reqId;
    res.setHeader('x-request-id', reqId);
    next();
  });

  // Bull Board setup
  const boardPath = '/admin/queues';
  const bullUser = process.env.BULLBOARD_USER ?? 'admin';
  const bullPass = process.env.BULLBOARD_PASS ?? 'admin123';

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath(boardPath);

  // Protect dashboard with basic auth
  expressApp.use(
    boardPath,
    basicAuth({
      users: { [bullUser]: bullPass },
      challenge: true,
    }),
  );

  const queues = app.get(QueuesService);
  createBullBoard({
    queues: [new BullMQAdapter(queues.queueNotifications())],
    serverAdapter,
  });

  expressApp.use(boardPath, serverAdapter.getRouter());
  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log('Listening on port', port);
}
bootstrap();

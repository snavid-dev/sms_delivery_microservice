import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '192.168.114.249',
      port: 3003,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // forbidNonWhitelisted: true,
    }),
  );
  await app.listen();

  console.log(`Sms Delivery app is running at port 3003`);
}
bootstrap();

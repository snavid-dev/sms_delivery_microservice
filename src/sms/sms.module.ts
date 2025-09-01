import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';

@Module({
  imports: [HttpModule],
  providers: [SmsService],
  controllers: [SmsController],
})
export class SmsModule {}

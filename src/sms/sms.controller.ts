import { Controller } from '@nestjs/common';
import { SendSmsDto } from './dto/send-sms.dto';
import { SmsService } from './sms.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @MessagePattern('send_sms')
  sendSms(@Payload() dto: SendSmsDto) {
    return this.smsService.sendSms(dto);
    // return false;
  }
}

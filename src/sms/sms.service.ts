import { Injectable, Logger } from '@nestjs/common';
import * as process from 'node:process';
import { SendSmsDto } from './dto/send-sms.dto';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private client: any;
  private readonly allowedPrefixes = ['+9379', '+9372'];
  private readonly fromNumber = process.env.HTTPSMS_FROM_NUMBER || '+93796597078';

  constructor() {
    // Only import HttpSms using dynamic import for ES module compatibility
    import('httpsms').then((mod) => {
      const HttpSms = mod.default;
      const apiKey = process.env.HTTPSMS_API_KEY;
      if (!apiKey) {
        throw new Error('HTTPSMS_API_KEY is not set in environment variables');
      }
      this.client = new HttpSms(apiKey);
    });
  }

  // Validate Afghanistan phone number format
  private isValidAfghanistanNumber(phone: string): boolean {
    return /^\+937\d{8}$/.test(phone);
  }

  // Check if number is allowed for sending SMS
  private isAllowedPrefix(phone: string): boolean {
    return this.allowedPrefixes.some((prefix) => phone.startsWith(prefix));
  }

  async sendSms(dto: SendSmsDto): Promise<any> {
    const { phoneNumber, message } = dto;
    this.logger.log(JSON.stringify({ event: 'request_received', phoneNumber, message }));
    if (!this.isValidAfghanistanNumber(phoneNumber)) {
      this.logger.warn(JSON.stringify({ event: 'invalid_phone', phoneNumber }));
      return {
        success: false,
        error: 'Invalid Afghanistan phone number format.',
      };
    }
    if (!this.isAllowedPrefix(phoneNumber)) {
      this.logger.warn(JSON.stringify({ event: 'disallowed_prefix', phoneNumber }));
      return {
        success: false,
        error: 'Phone number prefix not allowed for SMS.',
      };
    }
    try {
      this.logger.log(JSON.stringify({ event: 'sms_queued', phoneNumber, message }));
      const response = await this.client.messages.postSend({
        content: message,
        from: this.fromNumber,
        to: phoneNumber,
        encrypted: false,
      });
      this.logger.log(JSON.stringify({ event: 'sms_api_response', phoneNumber, response }));
      return {
        success: true,
        queued: true,
        message: 'SMS request accepted and will be sent as soon as possible (queued).',
        data: response,
      };
    } catch (error: any) {
      this.logger.error(JSON.stringify({ event: 'sms_send_error', phoneNumber, error: error.message, details: error.response?.data }));
      return {
        success: false,
        error: error.message,
        details: error.response?.data,
      };
    }
  }
}

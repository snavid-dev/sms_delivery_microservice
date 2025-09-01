import { Injectable, Logger } from '@nestjs/common';
import HttpSms from 'httpsms';
import * as process from 'node:process';
import { SendSmsDto } from './dto/send-sms.dto';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly client: HttpSms;
  private readonly allowedPrefixes = ['+9379', '+9372'];
  private readonly fromNumber = process.env.HTTPSMS_FROM_NUMBER || '+93796597078';

  constructor() {
    const apiKey = process.env.HTTPSMS_API_KEY;
    if (!apiKey) {
      throw new Error('HTTPSMS_API_KEY is not set in environment variables');
    }
    this.client = new HttpSms(apiKey);
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
    if (!this.isValidAfghanistanNumber(phoneNumber)) {
      this.logger.warn(`Invalid Afghanistan phone number: ${phoneNumber}`);
      return {
        success: false,
        error: 'Invalid Afghanistan phone number format.',
      };
    }
    if (!this.isAllowedPrefix(phoneNumber)) {
      this.logger.warn(`Phone number not allowed for SMS: ${phoneNumber}`);
      return {
        success: false,
        error: 'Phone number prefix not allowed for SMS.',
      };
    }
    try {
      const response = await this.client.messages.postSend({
        content: message,
        from: this.fromNumber,
        to: phoneNumber,
        encrypted: false,
      });
      this.logger.log(`SMS sent to ${phoneNumber}: ${message}, id: ${response.id}`);
      return {
        success: true,
        queued: true,
        message: 'SMS request accepted and will be sent as soon as possible (queued).',
        data: response,
      };
    } catch (error: any) {
      this.logger.error(`Failed to send SMS to ${phoneNumber}: ${error.message}`, error);
      return {
        success: false,
        error: error.message,
        details: error.response?.data,
      };
    }
  }
}

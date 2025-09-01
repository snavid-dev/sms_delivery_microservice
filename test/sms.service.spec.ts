jest.mock('httpsms', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      postSend: jest.fn(),
    },
  }));
});
import { SmsService } from '../src/sms/sms.service';
import { SendSmsDto } from '../src/sms/dto/send-sms.dto';

describe('SmsService', () => {
  let service: SmsService;
  let mockClient: any;
  const fromNumber = '+93796597078';

  beforeEach(() => {
    // Use the mocked client from jest.mock
    mockClient = new (require('httpsms'))();
    service = new SmsService(mockClient);
    (service as any).fromNumber = fromNumber;
  });

  it('should reject invalid Afghanistan phone numbers', async () => {
    const dto: SendSmsDto = { phoneNumber: '+12345678901', message: 'Test' };
    const result = await service.sendSms(dto);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Invalid Afghanistan phone number/);
  });

  it('should reject disallowed prefixes', async () => {
    // Use a valid Afghanistan number format but with a disallowed prefix
    const dto: SendSmsDto = { phoneNumber: '+93760000000', message: 'Test' };
    const result = await service.sendSms(dto);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/prefix not allowed/);
  });

  it('should queue SMS for allowed numbers', async () => {
    mockClient.messages.postSend.mockResolvedValue({ id: 'mock-id' });
    const dto: SendSmsDto = { phoneNumber: '+93796597078', message: 'Test' };
    const result = await service.sendSms(dto);
    expect(result.success).toBe(true);
    expect(result.queued).toBe(true);
    expect(result.message).toMatch(/queued/);
    expect(result.data.id).toBe('mock-id');
  });

  it('should handle API errors gracefully', async () => {
    mockClient.messages.postSend.mockRejectedValue({ message: 'API error', response: { data: 'details' } });
    const dto: SendSmsDto = { phoneNumber: '+93796597078', message: 'Test' };
    const result = await service.sendSms(dto);
    expect(result.success).toBe(false);
    expect(result.error).toBe('API error');
    expect(result.details).toBe('details');
  });
});

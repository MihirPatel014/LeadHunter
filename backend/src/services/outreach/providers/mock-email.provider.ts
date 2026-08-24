import { EmailProvider, SendEmailOptions, SendEmailResult, ProviderStatus } from '../outreach.provider.js';

/**
 * Mock Email Provider
 * Simulates email sending for development and demo environments.
 */
export class MockEmailProvider implements EmailProvider {
  readonly providerName = 'MOCK';

  async getStatus(): Promise<ProviderStatus> {
    return {
      isConnected: true,
      email: 'demo-sender@leadhunter.io',
      provider: 'MOCK',
      mode: 'mock',
    };
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const mockMessageId = `mock_msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const mockThreadId = `mock_thd_${Date.now()}`;

    // Simulate short network latency
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      success: true,
      messageId: mockMessageId,
      threadId: mockThreadId,
      provider: 'MOCK',
      sentAt: new Date(),
    };
  }
}

import fetch from 'node-fetch';

class WhatsAppService {
  constructor() {
    this.provider = process.env.WHATSAPP_PROVIDER || 'none';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'interview_invitation';
    
    this.isConfigured = this.provider !== 'none' && Boolean(this.accessToken && this.phoneNumberId);
  }

  getDiagnosticInfo() {
    return {
      provider: this.provider,
      isConfigured: this.isConfigured,
      phoneNumberId: this.phoneNumberId ? 'CONFIGURED' : 'NOT_CONFIGURED',
      status: this.isConfigured ? 'READY' : 'CONFIGURATION_REQUIRED',
    };
  }

  async sendInvitationWhatsApp(candidate, invitationCode, interviewUrl) {
    if (!this.isConfigured) {
      console.warn(`[WHATSAPP] Dispatch requested for ${candidate.mobile || candidate.phone}, but WhatsApp provider is not configured.`);
      return {
        success: false,
        configured: false,
        status: 'CONFIGURATION_REQUIRED',
        error: 'WhatsApp provider credentials (WHATSAPP_ACCESS_TOKEN & WHATSAPP_PHONE_NUMBER_ID) missing or provider set to none.',
      };
    }

    try {
      const recipientPhone = (candidate.mobile || candidate.phone || '').replace(/\D/g, '');
      if (!recipientPhone) {
        return { success: false, error: 'Invalid candidate phone number for WhatsApp' };
      }

      const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipientPhone,
          type: 'template',
          template: {
            name: this.templateName,
            language: { code: 'en_US' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: candidate.name || candidate.fullName },
                  { type: 'text', text: invitationCode },
                  { type: 'text', text: interviewUrl },
                ],
              },
            ],
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[WHATSAPP] Message dispatched to ${recipientPhone} (ID: ${data.messages?.[0]?.id})`);
        return { success: true, messageId: data.messages?.[0]?.id, status: 'SENT' };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `HTTP ${response.status} ${response.statusText}`;
        console.error(`[WHATSAPP] Delivery failed for ${recipientPhone}:`, errMsg);
        return { success: false, status: 'FAILED', error: errMsg };
      }
    } catch (error) {
      console.error('[WHATSAPP] API error:', error.message);
      return { success: false, status: 'FAILED', error: error.message };
    }
  }
}

let instance = null;
export function getWhatsAppService() {
  if (!instance) {
    instance = new WhatsAppService();
  }
  return instance;
}

export default WhatsAppService;

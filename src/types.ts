export interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  folderPath?: string;
  videoFile?: string;
  videoUrl: string;
  videoName: string;
  captionTemplate: string;
  dailyLimit: number;
  sentToday: number;
  color?: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  category: string;
  notes?: string;
  status: 'new' | 'contacted' | 'interested' | 'converted' | 'unsubscribed';
  lastSentAt?: string;
  messagesSentToday: number;
  createdAt: string;
}

export interface WhatsAppMessage {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  category: string;
  direction: 'outgoing' | 'incoming';
  content: string;
  videoUrl?: string;
  footerText?: string;
  status: 'queued' | 'sending' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  isAiGenerated?: boolean;
}

export interface AiPendingResponse {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  incomingMessage: string;
  category: string;
  generatedAnswer: string;
  scheduledTime: number; // timestamp in ms
  delaySecondsLeft: number;
  status: 'waiting' | 'ready' | 'sending' | 'sent' | 'cancelled';
  createdAt: string;
}

export interface WhatsAppConnectionState {
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected';
  phoneNumber: string;
  deviceInfo: string;
  qrCodeDataUrl: string;
  qrCodeRaw: string;
  connectedAt?: string;
}

export interface SystemSettings {
  senderNumber: string;
  greetingPrefix: string;
  urduFooter: string;
  enableUrduFooter: boolean;
  defaultDailyLimitPerCategory: number;
  minSmartDelaySec: number;
  maxSmartDelaySec: number;
  aiDelayMinutes: number;
  enableAiAutoAnswer: boolean;
  aiSystemInstruction: string;
  supabaseUrl: string;
  supabaseKey: string;
  isSupabaseConnected: boolean;
}

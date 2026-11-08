export type UserRole = 'SUPER_ADMIN' | 'BUSINESS_ADMIN' | 'STAFF';

export type StaffPermission =
  | 'view_inbox'
  | 'send_messages'
  | 'manage_contacts'
  | 'manage_categories'
  | 'view_analytics';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string; // Null for Super Admin, set for Business Admin / Staff
  permissions: StaffPermission[];
  avatarUrl?: string;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  maxContacts: number;
  maxMessagesPerDay: number;
  maxStaffAccounts: number;
  allowAiAutoAnswer: boolean;
  allowCustomVideos: boolean;
}

export interface TenantSubscription {
  id: string;
  tenantId: string;
  planId: string;
  status: 'active' | 'trial' | 'past_due' | 'canceled';
  currentPeriodEnd: string;
  messagesSentThisMonth: number;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  senderNumber: string;
  urduFooter: string;
  enableUrduFooter: boolean;
  dailyLimitPerCategory: number;
  aiDelayMinutes: number;
  aiSystemInstruction: string;
  subscriptionStatus: 'active' | 'trial' | 'past_due' | 'canceled';
  planId?: string;
  createdAt: string;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: UserRole;
  permissions: StaffPermission[];
  createdAt: string;
}

export interface Category {
  id: string;
  tenantId?: string;
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
  tenantId?: string;
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
  tenantId?: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  category: string;
  direction: 'incoming' | 'outgoing';
  content: string;
  videoUrl?: string;
  footerText?: string;
  status: 'queued' | 'sending' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  isAiGenerated?: boolean;
}

export interface Campaign {
  id: string;
  tenantId: string;
  title: string;
  categoryId: string;
  targetCount: number;
  sentCount: number;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'failed';
  scheduledAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  tenantId?: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface ConsentRecord {
  id: string;
  tenantId: string;
  contactPhone: string;
  optedIn: boolean;
  timestamp: string;
}

export interface MessageJob {
  id: string;
  tenantId: string;
  contactId: string;
  content: string;
  videoUrl?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  attempts: number;
  scheduledAt: string;
  createdAt: string;
}

export interface AiPendingResponse {
  id: string;
  tenantId?: string;
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

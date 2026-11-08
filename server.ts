import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import QRCode from 'qrcode';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import type { AppUser, UserRole, StaffPermission } from './src/types';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase Client if env vars provided
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Initialize Gemini AI client
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ===== SITE PASSWORD GATE =====
const APP_PASSWORD = process.env.APP_PASSWORD || '';
const GATE_SECRET =
  process.env.SESSION_SECRET ||
  (APP_PASSWORD ? crypto.createHash('sha256').update('gate:' + APP_PASSWORD).digest('hex') : '');
const GATE_COOKIE = 'wa_gate';
const GATE_DAYS = 30;

app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: false }));

function gateSign(value: string) {
  return crypto.createHmac('sha256', GATE_SECRET).update(value).digest('hex');
}

function gateMakeToken() {
  const exp = String(Date.now() + GATE_DAYS * 86400000);
  return `${exp}.${gateSign(exp)}`;
}

function gateIsValid(token: string | undefined) {
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig) return false;
  if (Number(exp) < Date.now()) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(gateSign(exp));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function gateGetCookie(req: express.Request) {
  const raw = req.headers.cookie || '';
  const found = raw.split(';').map((s) => s.trim()).find((s) => s.startsWith(GATE_COOKIE + '='));
  return found ? decodeURIComponent(found.slice(GATE_COOKIE.length + 1)) : undefined;
}

function gatePasswordOk(input: string) {
  const a = crypto.createHash('sha256').update(input).digest();
  const b = crypto.createHash('sha256').update(APP_PASSWORD).digest();
  return crypto.timingSafeEqual(a, b);
}

const gateFails = new Map<string, { count: number; until: number }>();

function gatePage(msg = '') {
  return `<!doctype html><html lang="ur"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Login</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0f0e;color:#e5e7eb;font-family:system-ui,sans-serif}
form{width:90%;max-width:340px;background:#111816;border:1px solid #1f2d29;border-radius:16px;padding:24px}
h1{font-size:20px;margin:0 0 16px;color:#10b981}
input{width:100%;box-sizing:border-box;padding:12px;border-radius:10px;border:1px solid #2a3b36;background:#0b0f0e;color:#fff;font-size:16px}
button{width:100%;margin-top:12px;padding:12px;border:0;border-radius:10px;background:#10b981;color:#04130e;font-size:16px;font-weight:700}
p{color:#f87171;font-size:14px;margin:10px 0 0}</style></head><body>
<form method="POST" action="/gate-login"><h1>WhatsApp Hub</h1>
<input type="password" name="password" placeholder="Password" autofocus required>
<button type="submit">Login</button>${msg ? `<p>${msg}</p>` : ''}</form></body></html>`;
}

if (APP_PASSWORD) {
  app.post('/gate-login', (req, res) => {
    const ip = req.ip || 'unknown';
    let rec = gateFails.get(ip);
    if (rec && rec.until && rec.until <= Date.now()) {
      gateFails.delete(ip);
      rec = undefined;
    }
    if (rec && rec.until > Date.now()) {
      return res.status(429).send(gatePage('Bohat zyada koshishen. 15 minute baad dobara try karein.'));
    }

    const pw = String(req.body?.password || '');
    if (gatePasswordOk(pw)) {
      gateFails.delete(ip);
      res.setHeader(
        'Set-Cookie',
        `${GATE_COOKIE}=${encodeURIComponent(gateMakeToken())}; Path=/; Max-Age=${GATE_DAYS * 86400}; HttpOnly; SameSite=Lax${req.secure ? '; Secure' : ''}`
      );
      return res.redirect('/');
    }

    const count = (rec?.count || 0) + 1;
    gateFails.set(ip, { count, until: count >= 5 ? Date.now() + 15 * 60 * 1000 : 0 });
    return res.status(401).send(gatePage('Password ghalat hai.'));
  });

  app.use((req, res, next) => {
    const open = ['/manifest.webmanifest', '/icon.svg', '/sw.js'];
    if (open.includes(req.path)) return next();
    if (gateIsValid(gateGetCookie(req))) return next();
    if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Login required' });
    return res.status(401).send(gatePage());
  });
} else {
  console.warn('⚠️ APP_PASSWORD set nahi hai: site par password protection band hai.');
}
// ===== END PASSWORD GATE =====
// Directories setup
const DATA_DIR = path.join(__dirname, 'data');
const MEDIA_DIR = path.join(__dirname, 'media');
const MULTI_TENANT_FILE = path.join(DATA_DIR, 'multi_tenant_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

// Initial Multi-Tenant Seed Database
const initialMultiTenantDb = {
  users: [
    {
      id: 'usr_super',
      email: 'superadmin@saas.com',
      name: 'Platform Super Admin',
      role: 'SUPER_ADMIN' as UserRole,
      tenantId: undefined,
      permissions: ['view_inbox', 'send_messages', 'manage_contacts', 'manage_categories', 'view_analytics'] as StaffPermission[],
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_gourmet_admin',
      email: 'admin@gourmet.com',
      name: 'Gourmet Business Admin',
      role: 'BUSINESS_ADMIN' as UserRole,
      tenantId: 'tenant_default',
      permissions: ['view_inbox', 'send_messages', 'manage_contacts', 'manage_categories', 'view_analytics'] as StaffPermission[],
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_gourmet_staff',
      email: 'staff@gourmet.com',
      name: 'Gourmet Support Agent',
      role: 'STAFF' as UserRole,
      tenantId: 'tenant_default',
      permissions: ['view_inbox', 'send_messages', 'manage_contacts'] as StaffPermission[],
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_royal_admin',
      email: 'admin@royal.com',
      name: 'Royal Properties Owner',
      role: 'BUSINESS_ADMIN' as UserRole,
      tenantId: 'tenant_realestate',
      permissions: ['view_inbox', 'send_messages', 'manage_contacts', 'manage_categories', 'view_analytics'] as StaffPermission[],
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      createdAt: new Date().toISOString(),
    },
  ] as Array<AppUser>,
  subscriptionPlans: [
    {
      id: 'plan_starter',
      name: 'Starter Business Plan',
      priceMonthly: 29.00,
      maxContacts: 500,
      maxMessagesPerDay: 200,
      maxStaffAccounts: 2,
      allowAiAutoAnswer: true,
      allowCustomVideos: false,
    },
    {
      id: 'plan_pro',
      name: 'Business Pro Suite',
      priceMonthly: 79.00,
      maxContacts: 2500,
      maxMessagesPerDay: 1000,
      maxStaffAccounts: 10,
      allowAiAutoAnswer: true,
      allowCustomVideos: true,
    },
    {
      id: 'plan_enterprise',
      name: 'Enterprise Unlimited',
      priceMonthly: 199.00,
      maxContacts: 10000,
      maxMessagesPerDay: 5000,
      maxStaffAccounts: 50,
      allowAiAutoAnswer: true,
      allowCustomVideos: true,
    },
  ],
  subscriptions: [
    {
      id: 'sub_gourmet',
      tenantId: 'tenant_default',
      planId: 'plan_pro',
      status: 'active' as const,
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      messagesSentThisMonth: 142,
    },
    {
      id: 'sub_royal',
      tenantId: 'tenant_realestate',
      planId: 'plan_starter',
      status: 'active' as const,
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      messagesSentThisMonth: 89,
    },
  ],
  tenants: [
    {
      id: 'tenant_default',
      name: 'Gourmet Dining & Hospitality',
      slug: 'gourmet-dining',
      ownerUserId: 'usr_gourmet_admin',
      senderNumber: '+92 300 1234567',
      urduFooter: 'اگر آپ اس میں انٹرسٹڈ ہیں تو مزید معلومات کے لیے اس نمبر پر رابطہ کر سکتے ہیں۔',
      enableUrduFooter: true,
      dailyLimitPerCategory: 3,
      aiDelayMinutes: 5,
      aiSystemInstruction: `CRITICAL BILINGUAL LANGUAGE INSTRUCTION:
You are an AI Customer Sales & Support Assistant for WhatsApp.
Automatically DETECT the language of the incoming client message:
1. If the client writes in Urdu or Roman Urdu, reply in polite, natural Roman Urdu or Urdu text.
2. If the client writes in English, reply in concise, professional English.
Always keep answers under 2-3 short sentences. Mention sender WhatsApp number +92 300 1234567 for direct assistance.`,
      subscriptionStatus: 'active' as const,
      planId: 'plan_pro',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tenant_realestate',
      name: 'Royal Properties & Villas',
      slug: 'royal-properties',
      ownerUserId: 'usr_royal_admin',
      senderNumber: '+92 321 9876543',
      urduFooter: 'برائے مہربانی سائٹ وزٹ اور بکنگ کے لیے رابطہ کریں۔',
      enableUrduFooter: true,
      dailyLimitPerCategory: 3,
      aiDelayMinutes: 5,
      aiSystemInstruction: `Provide professional real estate consultancy in Urdu or English matching client language.`,
      subscriptionStatus: 'active' as const,
      planId: 'plan_starter',
      createdAt: new Date().toISOString(),
    },
  ],
  categories: [
    {
      id: 'restaurants',
      tenantId: 'tenant_default',
      name: 'Restaurants & Dining',
      folderPath: 'media/restaurants',
      videoFile: 'restaurant_promo.mp4',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chef-cooking-food-in-a-restaurant-kitchen-40788-large.mp4',
      captionTemplate: 'Enjoy 25% OFF our exclusive Gourmet Family Combo menu today! Premium dining delivered to your doorstep.\n\n📱 Order Now: {phone}',
      dailyLimit: 3,
      sentToday: 1,
      color: 'amber',
    },
    {
      id: 'hotels',
      tenantId: 'tenant_default',
      name: 'Hotels & Hospitality',
      folderPath: 'media/hotels',
      videoFile: 'hotel_suite.mp4',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-interior-of-a-luxurious-hotel-room-41551-large.mp4',
      captionTemplate: 'Plan your weekend getaway with Royal Suites! Special 30% discount on luxury oceanview rooms.\n\n🏨 Bookings: {phone}',
      dailyLimit: 3,
      sentToday: 2,
      color: 'emerald',
    },
    {
      id: 'medicines',
      tenantId: 'tenant_default',
      name: 'Medicines & Health',
      folderPath: 'media/medicines',
      videoFile: 'pharmacy_delivery.mp4',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-bottle-of-pills-41804-large.mp4',
      captionTemplate: 'Get authentic prescription medicines and health supplements delivered safely with 15% discount.\n\n💊 Pharmacy Contact: {phone}',
      dailyLimit: 3,
      sentToday: 1,
      color: 'blue',
    },
    {
      id: 'villas',
      tenantId: 'tenant_realestate',
      name: 'Luxury Villas & Plots',
      folderPath: 'media/realestate',
      videoFile: 'villas_tour.mp4',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-real-estate-agent-showing-a-house-model-41539-large.mp4',
      captionTemplate: 'Invest in prime city residential plots with easy 3-year installment plans!\n\n🏡 Site Visit Booking: {phone}',
      dailyLimit: 3,
      sentToday: 0,
      color: 'purple',
    },
  ],
  clients: [
    {
      id: 'cnt_1',
      tenantId: 'tenant_default',
      name: 'Muhammad Ali',
      phone: '+92 301 5551234',
      category: 'restaurants',
      notes: 'VIP Dining Client',
      status: 'interested',
      lastSentAt: new Date(Date.now() - 3600000).toISOString(),
      messagesSentToday: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cnt_2',
      tenantId: 'tenant_default',
      name: 'Tariq Mahmood',
      phone: '+92 321 4445566',
      category: 'hotels',
      notes: 'Weekend Booking',
      status: 'contacted',
      lastSentAt: new Date(Date.now() - 7200000).toISOString(),
      messagesSentToday: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cnt_3',
      tenantId: 'tenant_default',
      name: 'Dr. Fatima Zahra',
      phone: '+92 333 7778899',
      category: 'medicines',
      notes: 'Monthly Prescription',
      status: 'converted',
      lastSentAt: new Date(Date.now() - 14400000).toISOString(),
      messagesSentToday: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cnt_4',
      tenantId: 'tenant_realestate',
      name: 'Usman Khan',
      phone: '+92 300 9991122',
      category: 'villas',
      notes: 'Plot Inquiry',
      status: 'new',
      messagesSentToday: 0,
      createdAt: new Date().toISOString(),
    },
  ] as Array<any>,
  messages: [
    {
      id: 'msg_1',
      tenantId: 'tenant_default',
      contactId: 'cnt_1',
      contactName: 'Muhammad Ali',
      contactPhone: '+92 301 5551234',
      category: 'restaurants',
      direction: 'outgoing',
      content: 'السلام علیکم Muhammad Ali,\n\nEnjoy 25% OFF our exclusive Gourmet Family Combo menu today!\n\nاگر آپ اس میں انٹرسٹڈ ہیں تو مزید معلومات کے لیے اس نمبر پر رابطہ کر سکتے ہیں۔ (+92 300 1234567)',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chef-cooking-food-in-a-restaurant-kitchen-40788-large.mp4',
      footerText: 'اگر آپ اس میں انٹرسٹڈ ہیں تو مزید معلومات کے لیے اس نمبر پر رابطہ کر سکتے ہیں۔',
      status: 'delivered',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isAiGenerated: false,
    },
  ] as Array<any>,
  campaigns: [
    {
      id: 'cmp_1',
      tenantId: 'tenant_default',
      title: 'Weekend Gourmet Family Discount',
      categoryId: 'restaurants',
      targetCount: 15,
      sentCount: 12,
      status: 'completed' as const,
      scheduledAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ] as Array<any>,
  auditLogs: [
    {
      id: 'log_1',
      tenantId: 'tenant_default',
      userId: 'usr_gourmet_admin',
      userEmail: 'admin@gourmet.com',
      action: 'TENANT_INIT',
      details: 'Gourmet Business initialized on SaaS multi-tenant platform',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
  ] as Array<any>,
  aiQueue: [] as Array<any>,
  connections: {
    tenant_default: {
      status: 'connected',
      phoneNumber: '+92 300 1234567',
      deviceInfo: 'Baileys Multi-Tenant Socket (Gourmet)',
      qrCodeDataUrl: '',
      qrCodeRaw: '',
      connectedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    tenant_realestate: {
      status: 'connected',
      phoneNumber: '+92 321 9876543',
      deviceInfo: 'Baileys Multi-Tenant Socket (Royal)',
      qrCodeDataUrl: '',
      qrCodeRaw: '',
      connectedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  } as Record<string, any>,
  settings: {
    senderNumber: '+92 300 1234567',
    greetingPrefix: 'السلام علیکم',
    urduFooter: 'اگر آپ اس میں انٹرسٹڈ ہیں تو مزید معلومات کے لیے اس نمبر پر رابطہ کر سکتے ہیں۔',
    enableUrduFooter: true,
    defaultDailyLimitPerCategory: 3,
    minSmartDelaySec: 10,
    maxSmartDelaySec: 30,
    aiDelayMinutes: 5,
    enableAiAutoAnswer: true,
    aiSystemInstruction: `CRITICAL BILINGUAL LANGUAGE INSTRUCTION:
Detect language (Urdu/English) and reply concisely.`,
    supabaseUrl: '',
    supabaseKey: '',
    isSupabaseConnected: false,
  },
};

// Persistent Storage Management
let db = initialMultiTenantDb;
if (!fs.existsSync(MULTI_TENANT_FILE)) {
  fs.writeFileSync(MULTI_TENANT_FILE, JSON.stringify(initialMultiTenantDb, null, 2));
} else {
  try {
    const raw = fs.readFileSync(MULTI_TENANT_FILE, 'utf-8');
    db = { ...initialMultiTenantDb, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Error reading multi_tenant_db.json:', err);
  }
}

function saveDb() {
  try {
    fs.writeFileSync(MULTI_TENANT_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Failed to write multi_tenant_db.json:', err);
  }
}

function logAudit(tenantId: string | undefined, userId: string, userEmail: string, action: string, details: string) {
  const newLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId,
    userId,
    userEmail,
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift(newLog);
  if (db.auditLogs.length > 250) db.auditLogs.pop();
  saveDb();
}

// Generate Tenant-Specific QR Code
async function refreshTenantQrCode(tenantId: string) {
  const qrString = `2@WA_BAILEYS_AUTH:${tenantId}:${Math.random().toString(36).substring(2, 15)}:${Date.now()}`;
  try {
    const dataUrl = await QRCode.toDataURL(qrString, { margin: 2, scale: 6 });
    if (!db.connections[tenantId]) {
      db.connections[tenantId] = {
        status: 'qr_ready',
        phoneNumber: '+92 300 1234567',
        deviceInfo: `Baileys Socket (${tenantId})`,
        qrCodeDataUrl: '',
        qrCodeRaw: '',
      };
    }
    db.connections[tenantId].qrCodeRaw = qrString;
    db.connections[tenantId].qrCodeDataUrl = dataUrl;
    db.connections[tenantId].status = 'qr_ready';
  } catch (err) {
    console.error('Error generating tenant QR code:', err);
  }
}

refreshTenantQrCode('tenant_default');
refreshTenantQrCode('tenant_realestate');

// Authentication & Tenant Resolution Middleware
declare global {
  namespace Express {
    interface Request {
      user?: AppUser;
    }
  }
}

function authenticateUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-auth-token'] as string);
  const emailHeader = req.headers['x-user-email'] as string;
  const roleHeader = req.headers['x-user-role'] as string;

  let matchedUser: AppUser | undefined = undefined;

  if (token) {
    matchedUser = db.users.find((u) => u.id === token || u.email === token);
  }
  if (!matchedUser && emailHeader) {
    matchedUser = db.users.find((u) => u.email.toLowerCase() === emailHeader.toLowerCase());
  }
  if (!matchedUser && roleHeader) {
    matchedUser = db.users.find((u) => u.role === roleHeader);
  }

  // Fallback default user for dev testing
  if (!matchedUser) {
    matchedUser = db.users[1]; // Gourmet Business Admin
  }

  req.user = matchedUser;
  next();
}

app.use(authenticateUser);

function getTenantId(req: express.Request): string {
  const user = req.user;
  if (user && user.role !== 'SUPER_ADMIN' && user.tenantId) {
    // STRICT ISOLATION: Business Admin & Staff MUST stay in their assigned tenant
    return user.tenantId;
  }

  // Super Admin can switch active tenant context via header or query
  const tenantHeader = req.headers['x-tenant-id'] as string;
  const tenantQuery = req.query.tenantId as string;
  const targetId = tenantHeader || tenantQuery || (user?.tenantId || 'tenant_default');
  const tenantExists = db.tenants.some((t) => t.id === targetId);
  return tenantExists ? targetId : 'tenant_default';
}

function requireRole(...allowedRoles: UserRole[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access Denied: Requires ${allowedRoles.join(' or ')} role.` });
    }
    next();
  };
}

function requirePermission(permission: StaffPermission) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'BUSINESS_ADMIN') return next();
    if (req.user.permissions && req.user.permissions.includes(permission)) return next();
    return res.status(403).json({ error: `Access Denied: Missing required permission '${permission}'.` });
  };
}

// REST APIs

// AUTH ENDPOINTS
app.get('/api/auth/me', (req, res) => {
  const user = req.user!;
  const tenantId = getTenantId(req);
  const activeTenant = db.tenants.find((t) => t.id === tenantId) || db.tenants[0];
  const activeSub = db.subscriptions.find((s) => s.tenantId === tenantId);
  const activePlan = db.subscriptionPlans.find((p) => p.id === (activeSub?.planId || activeTenant?.planId || 'plan_pro'));

  res.json({
    success: true,
    user,
    allUsers: user.role === 'SUPER_ADMIN' ? db.users : db.users.filter((u) => u.tenantId === user.tenantId),
    activeTenant,
    subscription: activeSub,
    plan: activePlan,
    plans: db.subscriptionPlans,
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, role } = req.body;
  let targetUser: AppUser | undefined;

  if (email) {
    targetUser = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  } else if (role) {
    targetUser = db.users.find((u) => u.role === role);
  }

  if (!targetUser) {
    return res.status(401).json({ error: 'Invalid user credentials or user not found' });
  }

  logAudit(targetUser.tenantId, targetUser.id, targetUser.email, 'LOGIN', `User ${targetUser.email} logged in with role ${targetUser.role}`);

  res.json({
    success: true,
    user: targetUser,
    token: targetUser.id,
  });
});

app.post('/api/auth/switch-user', requireRole('SUPER_ADMIN'), (req, res) => {
  const { userId } = req.body;
  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User account not found' });

  logAudit(user.tenantId, user.id, user.email, 'USER_SWITCH', `Super Admin switched session to user ${user.email} (${user.role})`);
  res.json({ success: true, user, token: user.id });
});

// TENANT ENDPOINTS (Strict isolation & Super Admin controls)
app.get('/api/tenants', (req, res) => {
  const user = req.user!;
  if (user.role === 'SUPER_ADMIN') {
    return res.json({ success: true, tenants: db.tenants });
  }
  // Business Admin & Staff see ONLY their tenant
  const userTenants = db.tenants.filter((t) => t.id === user.tenantId);
  res.json({ success: true, tenants: userTenants });
});

app.post('/api/tenants', requireRole('SUPER_ADMIN', 'BUSINESS_ADMIN'), (req, res) => {
  const { name, slug, senderNumber, urduFooter, planId } = req.body;
  if (!name) return res.status(400).json({ error: 'Organization name is required' });

  const tenantId = `tenant_${Date.now()}`;
  const ownerUserId = `usr_owner_${Date.now()}`;
  const selectedPlan = planId || 'plan_pro';

  const newTenant = {
    id: tenantId,
    name,
    slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    ownerUserId,
    senderNumber: senderNumber || '+92 300 1234567',
    urduFooter: urduFooter || 'اگر آپ اس میں انٹرسٹڈ ہیں تو مزید معلومات کے لیے اس نمبر پر رابطہ کر سکتے ہیں۔',
    enableUrduFooter: true,
    dailyLimitPerCategory: 3,
    aiDelayMinutes: 5,
    aiSystemInstruction: `Auto detect Urdu / English language and reply politely.`,
    subscriptionStatus: 'active' as const,
    planId: selectedPlan,
    createdAt: new Date().toISOString(),
  };

  db.tenants.push(newTenant);
  db.subscriptions.push({
    id: `sub_${Date.now()}`,
    tenantId,
    planId: selectedPlan,
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    messagesSentThisMonth: 0,
  });

  db.connections[tenantId] = {
    status: 'connected',
    phoneNumber: newTenant.senderNumber,
    deviceInfo: `Baileys Socket (${newTenant.name})`,
    qrCodeDataUrl: '',
    qrCodeRaw: '',
    connectedAt: new Date().toISOString(),
  };

  logAudit(tenantId, req.user!.id, req.user!.email, 'CREATE_TENANT', `Created organization '${newTenant.name}'`);

  saveDb();
  res.json({ success: true, tenant: newTenant, tenants: db.tenants });
});

// STAFF & USER MANAGEMENT
app.get('/api/users', requireRole('SUPER_ADMIN', 'BUSINESS_ADMIN'), (req, res) => {
  const user = req.user!;
  if (user.role === 'SUPER_ADMIN') {
    return res.json({ success: true, users: db.users });
  }
  const tenantUsers = db.users.filter((u) => u.tenantId === user.tenantId);
  res.json({ success: true, users: tenantUsers });
});

app.post('/api/users', requireRole('SUPER_ADMIN', 'BUSINESS_ADMIN'), (req, res) => {
  const currentUser = req.user!;
  const { name, email, role, permissions } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

  const tenantId = currentUser.role === 'SUPER_ADMIN' ? (req.body.tenantId || 'tenant_default') : currentUser.tenantId;

  // Enforce Subscription Plan Limit on Staff Accounts
  const activeSub = db.subscriptions.find((s) => s.tenantId === tenantId);
  const activePlan = db.subscriptionPlans.find((p) => p.id === (activeSub?.planId || 'plan_pro')) || db.subscriptionPlans[0];
  const existingTenantUsersCount = db.users.filter((u) => u.tenantId === tenantId).length;

  if (existingTenantUsersCount >= activePlan.maxStaffAccounts && currentUser.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: `Subscription Limit Reached: Current plan '${activePlan.name}' allows maximum ${activePlan.maxStaffAccounts} staff accounts. Please upgrade plan.`,
    });
  }

  const newUser: AppUser = {
    id: `usr_${Date.now()}`,
    name,
    email,
    role: role || 'STAFF',
    tenantId,
    permissions: permissions || ['view_inbox', 'send_messages', 'manage_contacts'],
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  logAudit(tenantId, currentUser.id, currentUser.email, 'ADD_STAFF', `Added staff user ${newUser.email} with role ${newUser.role}`);
  saveDb();

  const userList = currentUser.role === 'SUPER_ADMIN' ? db.users : db.users.filter((u) => u.tenantId === currentUser.tenantId);
  res.json({ success: true, user: newUser, users: userList });
});

app.delete('/api/users/:id', requireRole('SUPER_ADMIN', 'BUSINESS_ADMIN'), (req, res) => {
  const currentUser = req.user!;
  const targetId = req.params.id;

  const targetUser = db.users.find((u) => u.id === targetId);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });

  if (currentUser.role !== 'SUPER_ADMIN' && targetUser.tenantId !== currentUser.tenantId) {
    return res.status(403).json({ error: 'Forbidden: Cannot delete user of another organization' });
  }

  db.users = db.users.filter((u) => u.id !== targetId);
  logAudit(currentUser.tenantId, currentUser.id, currentUser.email, 'DELETE_STAFF', `Removed staff user ${targetUser.email}`);
  saveDb();

  const userList = currentUser.role === 'SUPER_ADMIN' ? db.users : db.users.filter((u) => u.tenantId === currentUser.tenantId);
  res.json({ success: true, users: userList });
});

// SUBSCRIPTION PLANS & BILLING
app.get('/api/plans', (req, res) => {
  res.json({ success: true, plans: db.subscriptionPlans });
});

app.get('/api/subscriptions', requireRole('SUPER_ADMIN', 'BUSINESS_ADMIN'), (req, res) => {
  const user = req.user!;
  if (user.role === 'SUPER_ADMIN') {
    return res.json({ success: true, subscriptions: db.subscriptions, plans: db.subscriptionPlans });
  }
  const sub = db.subscriptions.find((s) => s.tenantId === user.tenantId);
  const plan = db.subscriptionPlans.find((p) => p.id === sub?.planId);
  res.json({ success: true, subscription: sub, plan, plans: db.subscriptionPlans });
});

app.post('/api/subscriptions/upgrade', requireRole('SUPER_ADMIN', 'BUSINESS_ADMIN'), (req, res) => {
  const tenantId = getTenantId(req);
  const { planId } = req.body;

  const targetPlan = db.subscriptionPlans.find((p) => p.id === planId);
  if (!targetPlan) return res.status(404).json({ error: 'Selected plan not found' });

  let sub = db.subscriptions.find((s) => s.tenantId === tenantId);
  if (sub) {
    sub.planId = planId;
    sub.status = 'active';
  } else {
    sub = {
      id: `sub_${Date.now()}`,
      tenantId,
      planId,
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      messagesSentThisMonth: 0,
    };
    db.subscriptions.push(sub);
  }

  const tenantIdx = db.tenants.findIndex((t) => t.id === tenantId);
  if (tenantIdx !== -1) db.tenants[tenantIdx].planId = planId;

  logAudit(tenantId, req.user!.id, req.user!.email, 'PLAN_UPGRADE', `Upgraded subscription to ${targetPlan.name}`);
  saveDb();

  res.json({ success: true, subscription: sub, plan: targetPlan });
});

// AUDIT LOGS
app.get('/api/audit-logs', requireRole('SUPER_ADMIN', 'BUSINESS_ADMIN'), (req, res) => {
  const user = req.user!;
  if (user.role === 'SUPER_ADMIN') {
    return res.json({ success: true, auditLogs: db.auditLogs || [] });
  }
  const tenantLogs = (db.auditLogs || []).filter((l) => l.tenantId === user.tenantId);
  res.json({ success: true, auditLogs: tenantLogs });
});

// CAMPAIGNS
app.get('/api/campaigns', requirePermission('send_messages'), (req, res) => {
  const tenantId = getTenantId(req);
  const tenantCampaigns = (db.campaigns || []).filter((c) => c.tenantId === tenantId);
  res.json({ success: true, campaigns: tenantCampaigns });
});

app.post('/api/campaigns', requirePermission('send_messages'), (req, res) => {
  const tenantId = getTenantId(req);
  const { title, categoryId, targetCount } = req.body;

  const newCampaign = {
    id: `cmp_${Date.now()}`,
    tenantId,
    title: title || 'New WhatsApp Broadcast',
    categoryId: categoryId || 'restaurants',
    targetCount: targetCount || 10,
    sentCount: 0,
    status: 'scheduled' as const,
    scheduledAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  if (!db.campaigns) db.campaigns = [];
  db.campaigns.unshift(newCampaign);
  logAudit(tenantId, req.user!.id, req.user!.email, 'CREATE_CAMPAIGN', `Created campaign '${newCampaign.title}'`);
  saveDb();

  const tenantCampaigns = db.campaigns.filter((c) => c.tenantId === tenantId);
  res.json({ success: true, campaign: newCampaign, campaigns: tenantCampaigns });
});

// GET /api/state - Scoped State per Authenticated Tenant & User Permissions
app.get('/api/state', (req, res) => {
  const user = req.user!;
  const tenantId = getTenantId(req);
  const activeTenant = db.tenants.find((t) => t.id === tenantId) || db.tenants[0];

  const now = Date.now();
  db.aiQueue = db.aiQueue.map((item) => {
    if (item.tenantId === tenantId && item.status === 'waiting') {
      const leftSec = Math.max(0, Math.ceil((item.scheduledTime - now) / 1000));
      return {
        ...item,
        delaySecondsLeft: leftSec,
        status: leftSec === 0 ? 'ready' : 'waiting',
      };
    }
    return item;
  });

  const tenantCategories = db.categories.filter((c) => c.tenantId === tenantId || !c.tenantId);
  const tenantClients = db.clients.filter((c) => c.tenantId === tenantId || !c.tenantId);
  const tenantMessages = db.messages.filter((m) => m.tenantId === tenantId || !m.tenantId);
  const tenantAiQueue = db.aiQueue.filter((q) => q.tenantId === tenantId || !q.tenantId);
  const tenantConn = db.connections[tenantId] || {
    status: 'connected',
    phoneNumber: activeTenant.senderNumber,
    deviceInfo: 'Baileys Socket',
    qrCodeDataUrl: '',
    qrCodeRaw: '',
  };

  const activeSub = db.subscriptions.find((s) => s.tenantId === tenantId);
  const activePlan = db.subscriptionPlans.find((p) => p.id === (activeSub?.planId || activeTenant?.planId || 'plan_pro'));

  res.json({
    user,
    allUsers: user.role === 'SUPER_ADMIN' ? db.users : db.users.filter((u) => u.tenantId === tenantId),
    activeTenant,
    tenants: user.role === 'SUPER_ADMIN' ? db.tenants : db.tenants.filter((t) => t.id === tenantId),
    categories: tenantCategories,
    contacts: tenantClients,
    messages: tenantMessages,
    aiQueue: tenantAiQueue,
    campaigns: (db.campaigns || []).filter((c) => c.tenantId === tenantId),
    auditLogs: user.role === 'SUPER_ADMIN' ? (db.auditLogs || []) : (db.auditLogs || []).filter((l) => l.tenantId === tenantId),
    subscription: activeSub,
    plan: activePlan,
    plans: db.subscriptionPlans,
    connection: tenantConn,
    settings: {
      senderNumber: activeTenant.senderNumber,
      greetingPrefix: 'السلام علیکم',
      urduFooter: activeTenant.urduFooter,
      enableUrduFooter: activeTenant.enableUrduFooter,
      defaultDailyLimitPerCategory: activeTenant.dailyLimitPerCategory,
      minSmartDelaySec: 10,
      maxSmartDelaySec: 30,
      aiDelayMinutes: activeTenant.aiDelayMinutes,
      enableAiAutoAnswer: true,
      aiSystemInstruction: activeTenant.aiSystemInstruction,
      supabaseUrl: supabaseUrl || '',
      supabaseKey: '',
      isSupabaseConnected: !!supabase,
    },
  });
});

app.post('/api/connection/qr', requireRole('SUPER_ADMIN', 'BUSINESS_ADMIN'), async (req, res) => {
  const tenantId = getTenantId(req);
  await refreshTenantQrCode(tenantId);
  saveDb();
  res.json({ success: true, connection: db.connections[tenantId] });
});

app.post('/api/connection/connect', requireRole('SUPER_ADMIN', 'BUSINESS_ADMIN'), (req, res) => {
  const tenantId = getTenantId(req);
  const { phoneNumber } = req.body;
  if (!db.connections[tenantId]) {
    db.connections[tenantId] = { status: 'connected', phoneNumber: phoneNumber || '+92 300 1234567', deviceInfo: 'Baileys Socket', qrCodeDataUrl: '', qrCodeRaw: '' };
  }
  db.connections[tenantId].status = 'connected';
  if (phoneNumber) db.connections[tenantId].phoneNumber = phoneNumber;
  db.connections[tenantId].connectedAt = new Date().toISOString();

  logAudit(tenantId, req.user!.id, req.user!.email, 'WHATSAPP_CONNECT', `Connected Baileys WhatsApp socket for tenant ${tenantId}`);
  saveDb();
  res.json({ success: true, connection: db.connections[tenantId] });
});

app.post('/api/connection/disconnect', requireRole('SUPER_ADMIN', 'BUSINESS_ADMIN'), (req, res) => {
  const tenantId = getTenantId(req);
  if (db.connections[tenantId]) {
    db.connections[tenantId].status = 'disconnected';
  }
  logAudit(tenantId, req.user!.id, req.user!.email, 'WHATSAPP_DISCONNECT', `Disconnected WhatsApp session for tenant ${tenantId}`);
  saveDb();
  res.json({ success: true, connection: db.connections[tenantId] });
});

app.post('/api/categories', requirePermission('manage_categories'), (req, res) => {
  const tenantId = getTenantId(req);
  const { id, name, folderPath, videoFile, videoUrl, captionTemplate, dailyLimit, color } = req.body;
  const categoryId = id || `cat_${Date.now()}`;

  const existingIdx = db.categories.findIndex((c) => c.id === categoryId && c.tenantId === tenantId);

  if (existingIdx !== -1) {
    db.categories[existingIdx] = {
      ...db.categories[existingIdx],
      name: name || db.categories[existingIdx].name,
      folderPath: folderPath || db.categories[existingIdx].folderPath,
      videoFile: videoFile || db.categories[existingIdx].videoFile,
      videoUrl: videoUrl || db.categories[existingIdx].videoUrl,
      captionTemplate: captionTemplate || db.categories[existingIdx].captionTemplate,
      dailyLimit: dailyLimit ?? db.categories[existingIdx].dailyLimit,
      color: color || db.categories[existingIdx].color,
    };
  } else {
    const newCategory = {
      id: categoryId,
      tenantId,
      name: name || 'New Field',
      folderPath: folderPath || `media/${categoryId}`,
      videoFile: videoFile || 'promo_video.mp4',
      videoUrl: videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-chef-cooking-food-in-a-restaurant-kitchen-40788-large.mp4',
      captionTemplate: captionTemplate || 'Check out our offer for {name}!\n\nContact: {phone}',
      dailyLimit: dailyLimit || 3,
      sentToday: 0,
      color: color || 'emerald',
    };
    db.categories.push(newCategory);
  }

  saveDb();
  const tenantCategories = db.categories.filter((c) => c.tenantId === tenantId);
  res.json({ success: true, categories: tenantCategories });
});

app.delete('/api/categories/:id', requirePermission('manage_categories'), (req, res) => {
  const tenantId = getTenantId(req);
  const { id } = req.params;
  db.categories = db.categories.filter((c) => !(c.id === id && c.tenantId === tenantId));
  saveDb();
  const tenantCategories = db.categories.filter((c) => c.tenantId === tenantId);
  res.json({ success: true, categories: tenantCategories });
});

app.post('/api/contacts', requirePermission('manage_contacts'), (req, res) => {
  const tenantId = getTenantId(req);
  const { id, name, phone, category, notes, status } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  if (id) {
    const idx = db.clients.findIndex((c) => c.id === id && c.tenantId === tenantId);
    if (idx !== -1) {
      db.clients[idx] = {
        ...db.clients[idx],
        name,
        phone,
        category: category || db.clients[idx].category,
        notes: notes !== undefined ? notes : db.clients[idx].notes,
        status: status || db.clients[idx].status,
      };
    }
  } else {
    // Enforce Subscription Plan Limit on Max Contacts
    const activeSub = db.subscriptions.find((s) => s.tenantId === tenantId);
    const activePlan = db.subscriptionPlans.find((p) => p.id === (activeSub?.planId || 'plan_pro')) || db.subscriptionPlans[0];
    const currentTenantContactsCount = db.clients.filter((c) => c.tenantId === tenantId).length;

    if (currentTenantContactsCount >= activePlan.maxContacts && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: `Subscription Limit Reached: Plan '${activePlan.name}' allows up to ${activePlan.maxContacts} contacts. Please upgrade your subscription plan.`,
      });
    }

    const newClient = {
      id: `cnt_${Date.now()}`,
      tenantId,
      name,
      phone,
      category: category || db.categories.find((cat) => cat.tenantId === tenantId)?.id || 'restaurants',
      notes: notes || '',
      status: (status as any) || 'new',
      messagesSentToday: 0,
      createdAt: new Date().toISOString(),
    };
    db.clients.push(newClient);
  }

  saveDb();
  const tenantClients = db.clients.filter((c) => c.tenantId === tenantId);
  res.json({ success: true, clients: tenantClients });
});

app.delete('/api/contacts/:id', requirePermission('manage_contacts'), (req, res) => {
  const tenantId = getTenantId(req);
  const { id } = req.params;
  const existingClient = db.clients.find((c) => c.id === id && c.tenantId === tenantId);

  if (!existingClient) {
    return res.status(404).json({ success: false, error: 'Client record not found' });
  }

  db.clients = db.clients.filter((c) => !(c.id === id && c.tenantId === tenantId));
  db.aiQueue = db.aiQueue.filter((q) => q.contactId !== id);
  db.messages = db.messages.filter((m) => m.contactId !== id);

  logAudit(tenantId, req.user!.id, req.user!.email, 'DELETE_CLIENT', `Deleted client ${existingClient.name} (${existingClient.phone})`);
  saveDb();

  const tenantClients = db.clients.filter((c) => c.tenantId === tenantId);
  res.json({
    success: true,
    message: `Client '${existingClient.name}' deleted successfully!`,
    clients: tenantClients,
  });
});

app.post('/api/messages/send', requirePermission('send_messages'), (req, res) => {
  const tenantId = getTenantId(req);
  const activeTenant = db.tenants.find((t) => t.id === tenantId) || db.tenants[0];
  const { contactId, categoryId } = req.body;

  const client = db.clients.find((c) => c.id === contactId && c.tenantId === tenantId);
  const category = db.categories.find((cat) => cat.id === categoryId && cat.tenantId === tenantId);

  if (!client || !category) {
    return res.status(404).json({ error: 'Client or Category not found' });
  }

  // Consent & Opt-Out Enforcement
  if ((client.status as string) === 'unsubscribed') {
    return res.status(403).json({
      error: `Blocked by Consent Control: Client '${client.name}' (${client.phone}) has opted out/unsubscribed from broadcasts.`,
    });
  }

  if (category.sentToday >= category.dailyLimit) {
    return res.status(429).json({
      error: `Daily limit reached for category "${category.name}". Maximum ${category.dailyLimit} messages allowed per day.`,
      sentToday: category.sentToday,
      dailyLimit: category.dailyLimit,
    });
  }

  const greeting = `السلام علیکم ${client.name},\n\n`;
  const caption = category.captionTemplate.replace('{name}', client.name).replace('{phone}', activeTenant.senderNumber);
  let messageContent = greeting + caption;
  if (activeTenant.enableUrduFooter) {
    messageContent += `\n\n${activeTenant.urduFooter} (${activeTenant.senderNumber})`;
  }

  const newMessage = {
    id: `msg_${Date.now()}`,
    tenantId,
    contactId: client.id,
    contactName: client.name,
    contactPhone: client.phone,
    category: category.id,
    direction: 'outgoing' as const,
    content: messageContent,
    videoUrl: category.videoUrl,
    footerText: activeTenant.enableUrduFooter ? activeTenant.urduFooter : '',
    status: 'delivered' as const,
    timestamp: new Date().toISOString(),
    isAiGenerated: false,
  };

  db.messages.unshift(newMessage);
  category.sentToday += 1;
  client.messagesSentToday += 1;
  client.lastSentAt = newMessage.timestamp;
  if ((client.status as string) === 'new') client.status = 'contacted' as any;

  saveDb();
  res.json({
    success: true,
    message: newMessage,
    categoryStats: { id: category.id, sentToday: category.sentToday, dailyLimit: category.dailyLimit },
  });
});

app.post('/api/messages/reset-daily-limits', requireRole('SUPER_ADMIN', 'BUSINESS_ADMIN'), (req, res) => {
  const tenantId = getTenantId(req);
  db.categories.filter((c) => c.tenantId === tenantId).forEach((c) => (c.sentToday = 0));
  db.clients.filter((c) => c.tenantId === tenantId).forEach((c) => (c.messagesSentToday = 0));
  saveDb();
  res.json({ success: true, message: 'Daily limit counters reset successfully' });
});

// BILINGUAL AI AUTO-ANSWER GENERATION (Scoped per tenant)
app.post('/api/messages/simulate-incoming', async (req, res) => {
  const tenantId = getTenantId(req);
  const activeTenant = db.tenants.find((t) => t.id === tenantId) || db.tenants[0];
  const { contactId, text, customDelaySec } = req.body;

  const client = db.clients.find((c) => c.id === contactId && c.tenantId === tenantId) || db.clients[0];
  const category = db.categories.find((cat) => cat.id === client.category && cat.tenantId === tenantId) || db.categories[0];

  const incomingText = text || 'السلام علیکم! مجھے اس آفر کی مزید تفصیلات چاہیے۔';

  const incomingMsg = {
    id: `msg_inc_${Date.now()}`,
    tenantId,
    contactId: client.id,
    contactName: client.name,
    contactPhone: client.phone,
    category: category ? category.id : 'general',
    direction: 'incoming' as const,
    content: incomingText,
    videoUrl: '',
    footerText: '',
    status: 'read' as const,
    timestamp: new Date().toISOString(),
    isAiGenerated: false,
  };

  db.messages.unshift(incomingMsg);
  if (client && (client.status as string) !== 'converted') client.status = 'interested' as any;

  let generatedAnswer = `وعلیکم السلام ${client ? client.name : ''}! ہم سے رابطہ کرنے کا شکریہ۔ مزید معلومات کے لیے اس نمبر (${activeTenant.senderNumber}) پر رابطہ کر سکتے ہیں۔`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `CLIENT MESSAGE: "${incomingText}"
CLIENT NAME: "${client ? client.name : 'Client'}"
BUSINESS: "${activeTenant.name}"

BILINGUAL RULE:
1. Detect if the CLIENT MESSAGE is in Urdu / Roman Urdu or English.
2. If Urdu/Roman Urdu -> reply in polite Roman Urdu or Urdu text.
3. If English -> reply in professional English.
4. Keep answer under 2-3 short sentences. Mention contact number ${activeTenant.senderNumber}.`,
        config: { systemInstruction: activeTenant.aiSystemInstruction },
      });

      if (response.text) generatedAnswer = response.text.trim();
    } catch (aiErr) {
      console.error('Gemini API Auto-Answer error:', aiErr);
    }
  }

  const delaySec = customDelaySec !== undefined ? Number(customDelaySec) : activeTenant.aiDelayMinutes * 60;
  const scheduledTime = Date.now() + delaySec * 1000;

  const pendingAiItem = {
    id: `ai_queue_${Date.now()}`,
    tenantId,
    contactId: client ? client.id : 'cnt_1',
    contactName: client ? client.name : 'Client',
    contactPhone: client ? client.phone : activeTenant.senderNumber,
    incomingMessage: incomingMsg.content,
    category: category ? category.id : 'general',
    generatedAnswer,
    scheduledTime,
    delaySecondsLeft: delaySec,
    status: delaySec <= 0 ? 'ready' : 'waiting',
    createdAt: new Date().toISOString(),
  };

  db.aiQueue.unshift(pendingAiItem);
  saveDb();

  res.json({
    success: true,
    incomingMessage: incomingMsg,
    pendingAiResponse: pendingAiItem,
  });
});

app.post('/api/ai-queue/send-now', requirePermission('send_messages'), (req, res) => {
  const tenantId = getTenantId(req);
  const activeTenant = db.tenants.find((t) => t.id === tenantId) || db.tenants[0];
  const { queueId } = req.body;
  const itemIdx = db.aiQueue.findIndex((q) => q.id === queueId && q.tenantId === tenantId);
  if (itemIdx === -1) return res.status(404).json({ error: 'Queue item not found' });

  const item = db.aiQueue[itemIdx];

  const aiMessage = {
    id: `msg_ai_${Date.now()}`,
    tenantId,
    contactId: item.contactId,
    contactName: item.contactName,
    contactPhone: item.contactPhone,
    category: item.category,
    direction: 'outgoing' as const,
    content: `🤖 [Bilingual Gemini AI Auto-Reply]:\n${item.generatedAnswer}`,
    videoUrl: '',
    footerText: activeTenant.enableUrduFooter ? activeTenant.urduFooter : '',
    status: 'delivered' as const,
    timestamp: new Date().toISOString(),
    isAiGenerated: true,
  };

  db.messages.unshift(aiMessage);
  db.aiQueue[itemIdx].status = 'sent';
  db.aiQueue[itemIdx].delaySecondsLeft = 0;

  saveDb();
  res.json({ success: true, message: aiMessage, queueItem: db.aiQueue[itemIdx] });
});

app.post('/api/ai-queue/cancel', requirePermission('send_messages'), (req, res) => {
  const tenantId = getTenantId(req);
  const { queueId } = req.body;
  db.aiQueue = db.aiQueue.filter((q) => !(q.id === queueId && q.tenantId === tenantId));
  saveDb();
  res.json({ success: true });
});

app.post('/api/settings', requireRole('SUPER_ADMIN', 'BUSINESS_ADMIN'), (req, res) => {
  const tenantId = getTenantId(req);
  const tenantIdx = db.tenants.findIndex((t) => t.id === tenantId);
  if (tenantIdx !== -1) {
    db.tenants[tenantIdx] = { ...db.tenants[tenantIdx], ...req.body };
  }
  logAudit(tenantId, req.user!.id, req.user!.email, 'UPDATE_SETTINGS', `Updated business & AI settings for tenant ${tenantId}`);
  saveDb();
  res.json({ success: true, tenant: db.tenants[tenantIdx] });
});

// Background Timer Worker for delayed AI answers
setInterval(() => {
  const now = Date.now();
  let changed = false;

  db.aiQueue.forEach((item) => {
    if (item.status === 'waiting' && now >= item.scheduledTime) {
      const activeTenant = db.tenants.find((t) => t.id === item.tenantId) || db.tenants[0];
      item.status = 'sent';
      item.delaySecondsLeft = 0;

      db.messages.unshift({
        id: `msg_ai_auto_${Date.now()}`,
        tenantId: item.tenantId,
        contactId: item.contactId,
        contactName: item.contactName,
        contactPhone: item.contactPhone,
        category: item.category,
        direction: 'outgoing' as const,
        content: `🤖 [Bilingual Gemini AI Reply - 5 Min Delayed]:\n${item.generatedAnswer}`,
        videoUrl: '',
        footerText: activeTenant.enableUrduFooter ? activeTenant.urduFooter : '',
        status: 'delivered' as const,
        timestamp: new Date().toISOString(),
        isAiGenerated: true,
      });

      changed = true;
    }
  });

  if (changed) saveDb();
}, 3000);

// Start Server with Vite Middleware
async function start() {
  app.use('/api/*', (req, res, next) => {
    if (!res.headersSent) {
      res.status(404).json({ error: `API endpoint ${req.originalUrl} not found` });
    } else {
      next();
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.use('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const portNum = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
  app.listen(portNum, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 Multi-Tenant Commercial SaaS Server at http://localhost:${portNum}`);
    console.log(`🏢 Active Tenants: ${db.tenants.length} Organizations`);
    console.log(`👥 Registered Users: ${db.users.length}`);
    console.log(`=======================================================`);
  });
}

start();

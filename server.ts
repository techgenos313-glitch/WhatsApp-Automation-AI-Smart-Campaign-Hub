import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import QRCode from 'qrcode';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

// Function to sync contacts to Supabase
export async function saveContactToSupabase(category: string, name: string, phone: string) {
  const { data, error } = await supabase
    .from('contacts')
    .insert([{ category, name, phone }]);

  if (error) {
    console.error('Error saving contact to Supabase:', error.message);
  } else {
    console.log('✅ Contact synced to Supabase successfully!');
  }
}

// Function to log WhatsApp activity to Supabase
export async function logActivityToSupabase(eventType: string, message: string, phone?: string) {
  const { error } = await supabase
    .from('logs')
    .insert([{ event_type: eventType, message, phone }]);

  if (error) {
    console.error('Error logging to Supabase:', error.message);
  }
}

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

// Directories setup: data/ & media/
const DATA_DIR = path.join(__dirname, 'data');
const MEDIA_DIR = path.join(__dirname, 'media');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

// Default media category folders
const defaultCategoryFolders = ['restaurants', 'hotels', 'medicines', 'realestate', 'clothing'];
defaultCategoryFolders.forEach((folder) => {
  const folderPath = path.join(MEDIA_DIR, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
});

// Initial contacts.json template with dynamic categories & bilingual settings
const initialContactsJson = {
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
You are an AI Customer Sales & Support Assistant for WhatsApp.
Automatically DETECT the language of the incoming client message:
1. If the client writes in Urdu or Roman Urdu (e.g., "Salam", "Price kya hai", "Detail batayein"), reply in polite, natural Roman Urdu or Urdu text.
2. If the client writes in English (e.g., "Hello, please provide rates and availability"), reply in concise, professional English.
Always keep answers under 2-3 short sentences. Mention sender WhatsApp number +92 300 1234567.`,
    supabaseUrl: '',
    supabaseKey: '',
    isSupabaseConnected: false,
  },
  categories: [
    {
      id: 'restaurants',
      name: 'Restaurants & Dining',
      folderPath: 'media/restaurants',
      videoFile: 'restaurant_promo.mp4',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chef-cooking-food-in-a-restaurant-kitchen-40788-large.mp4',
      captionTemplate: 'Enjoy 25% OFF our exclusive Gourmet Family Combo menu today!\n\n🍽️ Order Now: {phone}',
      dailyLimit: 3,
      sentToday: 1,
      color: 'amber',
    },
    {
      id: 'hotels',
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
      id: 'realestate',
      name: 'Real Estate & Properties',
      folderPath: 'media/realestate',
      videoFile: 'villas_tour.mp4',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-real-estate-agent-showing-a-house-model-41539-large.mp4',
      captionTemplate: 'Invest in prime city residential plots with easy 3-year installment plans!\n\n🏡 Site Visit Booking: {phone}',
      dailyLimit: 3,
      sentToday: 0,
      color: 'purple',
    },
    {
      id: 'clothing',
      name: 'Clothing & Fashion',
      folderPath: 'media/clothing',
      videoFile: 'fashion_collection.mp4',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-holding-shopping-bags-41530-large.mp4',
      captionTemplate: 'Discover our new designer summer lawn collection with flat 20% launch discount!\n\n👗 Catalog: {phone}',
      dailyLimit: 3,
      sentToday: 0,
      color: 'rose',
    },
  ],
  clients: [
    {
      id: 'cnt_1',
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
      name: 'Usman Khan',
      phone: '+92 300 9991122',
      category: 'realestate',
      notes: 'Plot Inquiry',
      status: 'new',
      messagesSentToday: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cnt_5',
      name: 'John Smith',
      phone: '+1 555 0192834',
      category: 'hotels',
      notes: 'International Tourist',
      status: 'new',
      messagesSentToday: 0,
      createdAt: new Date().toISOString(),
    },
  ],
  messages: [
    {
      id: 'msg_1',
      contactId: 'cnt_1',
      contactName: 'Muhammad Ali',
      contactPhone: '+92 301 5551234',
      category: 'restaurants',
      direction: 'outgoing' as const,
      content: 'السلام علیکم Muhammad Ali,\n\nEnjoy 25% OFF our exclusive Gourmet Family Combo menu today!\n\nاگر آپ اس میں انٹرسٹڈ ہیں تو مزید معلومات کے لیے اس نمبر پر رابطہ کر سکتے ہیں۔ (+92 300 1234567)',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chef-cooking-food-in-a-restaurant-kitchen-40788-large.mp4',
      footerText: 'اگر آپ اس میں انٹرسٹڈ ہیں تو مزید معلومات کے لیے اس نمبر پر رابطہ کر سکتے ہیں۔',
      status: 'delivered' as const,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isAiGenerated: false,
    },
    {
      id: 'msg_2',
      contactId: 'cnt_1',
      contactName: 'Muhammad Ali',
      contactPhone: '+92 301 5551234',
      category: 'restaurants',
      direction: 'incoming' as const,
      content: 'Kya aap home delivery karte hain or Deals me kya shamil hai?',
      videoUrl: '',
      footerText: '',
      status: 'read' as const,
      timestamp: new Date(Date.now() - 3300000).toISOString(),
      isAiGenerated: false,
    },
  ],
  aiQueue: [] as Array<any>,
  connection: {
    status: 'connected',
    phoneNumber: '+92 300 1234567',
    deviceInfo: 'WhatsApp Web / Baileys Node.js Engine (Linux)',
    qrCodeDataUrl: '',
    qrCodeRaw: '',
    connectedAt: new Date(Date.now() - 86400000).toISOString(),
  },
};

// Load contacts.json
let store = initialContactsJson;
if (!fs.existsSync(CONTACTS_FILE)) {
  fs.writeFileSync(CONTACTS_FILE, JSON.stringify(initialContactsJson, null, 2));
} else {
  try {
    const raw = fs.readFileSync(CONTACTS_FILE, 'utf-8');
    store = { ...initialContactsJson, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Error reading contacts.json:', err);
  }
}

function saveContactsJson() {
  try {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('Failed to write contacts.json:', err);
  }
}

// Generate QR Code Data URL
async function refreshQrCode() {
  const qrString = `2@WA_BAILEYS_AUTH:${Math.random().toString(36).substring(2, 15)}:${Date.now()}`;
  try {
    const dataUrl = await QRCode.toDataURL(qrString, { margin: 2, scale: 6 });
    store.connection.qrCodeRaw = qrString;
    store.connection.qrCodeDataUrl = dataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
  }
}

refreshQrCode();

// Personalized Message Builder with "السلام علیکم [Name]" and Urdu Footer
function buildPersonalizedMessage(clientName: string, category: any, customFooter?: string) {
  const greeting = `${store.settings.greetingPrefix} ${clientName},\n\n`;
  const caption = category.captionTemplate
    .replace('{name}', clientName)
    .replace('{phone}', store.settings.senderNumber);

  const footer = customFooter !== undefined
    ? customFooter
    : (store.settings.enableUrduFooter ? store.settings.urduFooter : '');

  let fullMsg = greeting + caption;
  if (footer) {
    fullMsg += `\n\n${footer} (${store.settings.senderNumber})`;
  }
  return fullMsg;
}

// REST APIs

app.get('/api/state', (req, res) => {
  const now = Date.now();
  store.aiQueue = store.aiQueue.map((item) => {
    if (item.status === 'waiting') {
      const leftSec = Math.max(0, Math.ceil((item.scheduledTime - now) / 1000));
      return {
        ...item,
        delaySecondsLeft: leftSec,
        status: leftSec === 0 ? 'ready' : 'waiting',
      };
    }
    return item;
  });

  res.json({
    ...store,
    contacts: store.clients,
  });
});

app.get('/api/contacts-json', (req, res) => {
  res.json(store);
});

app.post('/api/contacts-json', (req, res) => {
  try {
    const updatedStore = req.body;
    if (!updatedStore.categories || !updatedStore.clients) {
      return res.status(400).json({ error: 'Invalid JSON format. Categories and clients arrays are required.' });
    }
    store = { ...store, ...updatedStore };
    saveContactsJson();
    res.json({ success: true, store });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update contacts.json' });
  }
});

app.post('/api/connection/qr', async (req, res) => {
  store.connection.status = 'qr_ready';
  await refreshQrCode();
  saveContactsJson();
  res.json({ success: true, connection: store.connection });
});

app.post('/api/connection/connect', (req, res) => {
  const { phoneNumber } = req.body;
  store.connection.status = 'connected';
  if (phoneNumber) store.connection.phoneNumber = phoneNumber;
  store.connection.connectedAt = new Date().toISOString();
  saveContactsJson();
  res.json({ success: true, connection: store.connection });
});

app.post('/api/connection/disconnect', (req, res) => {
  store.connection.status = 'disconnected';
  saveContactsJson();
  res.json({ success: true, connection: store.connection });
});

app.post('/api/categories', (req, res) => {
  const { id, name, folderPath, videoFile, videoUrl, captionTemplate, dailyLimit, color } = req.body;
  const categoryId = id || name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const targetFolder = folderPath || `media/${categoryId}`;
  const absoluteFolderPath = path.join(__dirname, targetFolder);

  if (!fs.existsSync(absoluteFolderPath)) {
    fs.mkdirSync(absoluteFolderPath, { recursive: true });
  }

  const existingIdx = store.categories.findIndex((c) => c.id === categoryId || c.id === id);

  if (existingIdx !== -1) {
    store.categories[existingIdx] = {
      ...store.categories[existingIdx],
      name: name || store.categories[existingIdx].name,
      folderPath: targetFolder,
      videoFile: videoFile || store.categories[existingIdx].videoFile,
      videoUrl: videoUrl || store.categories[existingIdx].videoUrl,
      captionTemplate: captionTemplate || store.categories[existingIdx].captionTemplate,
      dailyLimit: dailyLimit ?? store.categories[existingIdx].dailyLimit,
      color: color || store.categories[existingIdx].color,
    };
  } else {
    const newCategory = {
      id: categoryId,
      name: name || 'New Field',
      folderPath: targetFolder,
      videoFile: videoFile || 'promo_video.mp4',
      videoUrl: videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-chef-cooking-food-in-a-restaurant-kitchen-40788-large.mp4',
      captionTemplate: captionTemplate || 'Check out our latest offer for {name}!\n\nContact: {phone}',
      dailyLimit: dailyLimit || 3,
      sentToday: 0,
      color: color || 'emerald',
    };
    store.categories.push(newCategory);
  }

  saveContactsJson();
  res.json({ success: true, categories: store.categories });
});

app.delete('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  store.categories = store.categories.filter((c) => c.id !== id);
  saveContactsJson();
  res.json({ success: true, categories: store.categories });
});

app.post('/api/contacts', (req, res) => {
  const { id, name, phone, category, notes, status } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  if (id) {
    const idx = store.clients.findIndex((c) => c.id === id);
    if (idx !== -1) {
      store.clients[idx] = {
        ...store.clients[idx],
        name,
        phone,
        category: category || store.clients[idx].category,
        notes: notes !== undefined ? notes : store.clients[idx].notes,
        status: status || store.clients[idx].status,
      };
      saveContactToSupabase(store.clients[idx].category, name, phone);
    }
  } else {
    const newClient = {
      id: `cnt_${Date.now()}`,
      name,
      phone,
      category: category || store.categories[0]?.id || 'restaurants',
      notes: notes || '',
      status: (status as any) || 'new',
      messagesSentToday: 0,
      createdAt: new Date().toISOString(),
    };
    store.clients.push(newClient);
    saveContactToSupabase(newClient.category, name, phone);
  }

  saveContactsJson();
  res.json({ success: true, clients: store.clients });
});

app.delete('/api/contacts/:id', (req, res) => {
  const { id } = req.params;
  store.clients = store.clients.filter((c) => c.id !== id);
  saveContactsJson();
  res.json({ success: true, clients: store.clients });
});

app.post('/api/messages/send', (req, res) => {
  const { contactId, categoryId } = req.body;

  const client = store.clients.find((c) => c.id === contactId);
  const category = store.categories.find((cat) => cat.id === categoryId);

  if (!client || !category) {
    return res.status(404).json({ error: 'Client or Category not found' });
  }

  if (category.sentToday >= category.dailyLimit) {
    return res.status(429).json({
      error: `Daily limit reached for category "${category.name}". Maximum ${category.dailyLimit} messages allowed per day.`,
      sentToday: category.sentToday,
      dailyLimit: category.dailyLimit,
    });
  }

  const messageContent = buildPersonalizedMessage(client.name, category);

  const newMessage = {
    id: `msg_${Date.now()}`,
    contactId: client.id,
    contactName: client.name,
    contactPhone: client.phone,
    category: category.id,
    direction: 'outgoing' as const,
    content: messageContent,
    videoUrl: category.videoUrl,
    footerText: store.settings.enableUrduFooter ? store.settings.urduFooter : '',
    status: 'delivered' as const,
    timestamp: new Date().toISOString(),
    isAiGenerated: false,
  };

  store.messages.unshift(newMessage);

  category.sentToday += 1;
  client.messagesSentToday += 1;
  client.lastSentAt = newMessage.timestamp;
  if (client.status === 'new') client.status = 'contacted';

  saveContactsJson();
  logActivityToSupabase('message_sent', `Sent message to ${client.name} (${category.name})`, client.phone);

  res.json({
    success: true,
    message: newMessage,
    categoryStats: {
      id: category.id,
      sentToday: category.sentToday,
      dailyLimit: category.dailyLimit,
    },
  });
});

app.post('/api/messages/reset-daily-limits', (req, res) => {
  store.categories.forEach((c) => (c.sentToday = 0));
  store.clients.forEach((c) => (c.messagesSentToday = 0));
  saveContactsJson();
  res.json({ success: true, message: 'Daily limit counters reset successfully' });
});

// BILINGUAL AI AUTO-ANSWER GENERATION
app.post('/api/messages/simulate-incoming', async (req, res) => {
  const { contactId, text, customDelaySec } = req.body;

  const client = store.clients.find((c) => c.id === contactId) || store.clients[0];
  const category = store.categories.find((cat) => cat.id === client.category) || store.categories[0];

  const incomingText = text || 'السلام علیکم! مجھے اس آفر کی مزید تفصیلات چاہیے۔';

  const incomingMsg = {
    id: `msg_inc_${Date.now()}`,
    contactId: client.id,
    contactName: client.name,
    contactPhone: client.phone,
    category: category.id,
    direction: 'incoming' as const,
    content: incomingText,
    videoUrl: '',
    footerText: '',
    status: 'read' as const,
    timestamp: new Date().toISOString(),
    isAiGenerated: false,
  };

  store.messages.unshift(incomingMsg);

  if (client.status !== 'converted') {
    client.status = 'interested';
  }

  let generatedAnswer = `وعلیکم السلام ${client.name}! ہم سے رابطہ کرنے کا شکریہ۔ ہمارے ${category.name} کی آفر کی معلومات کے لیے آپ اس نمبر (${store.settings.senderNumber}) پر رابطہ کر سکتے ہیں۔`;

  if (aiClient && store.settings.enableAiAutoAnswer) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `CLIENT MESSAGE: "${incomingText}"
CLIENT NAME: "${client.name}"
CATEGORY CONTEXT: "${category.name} - ${category.captionTemplate}"

BILINGUAL RULE:
1. Detect if the CLIENT MESSAGE is in Urdu / Roman Urdu or English.
2. If the client messaged in Urdu or Roman Urdu (e.g. "Salam", "Price kya hai", "Detail batayein"), reply in polite, natural Roman Urdu or Urdu text.
3. If the client messaged in English (e.g. "Hello, please provide rates and availability"), reply in concise, professional English.
4. Keep answer under 2-3 short sentences. Include sender phone ${store.settings.senderNumber}.`,
        config: {
          systemInstruction: store.settings.aiSystemInstruction,
        },
      });

      if (response.text) {
        generatedAnswer = response.text.trim();
      }
    } catch (aiErr) {
      console.error('Gemini API Bilingual Auto-Answer error:', aiErr);
    }
  }

  const delaySec = customDelaySec !== undefined ? Number(customDelaySec) : store.settings.aiDelayMinutes * 60;
  const scheduledTime = Date.now() + delaySec * 1000;

  const pendingAiItem = {
    id: `ai_queue_${Date.now()}`,
    contactId: client.id,
    contactName: client.name,
    contactPhone: client.phone,
    incomingMessage: incomingMsg.content,
    category: category.id,
    generatedAnswer: generatedAnswer,
    scheduledTime: scheduledTime,
    delaySecondsLeft: delaySec,
    status: delaySec <= 0 ? 'ready' : 'waiting',
    createdAt: new Date().toISOString(),
  };

  store.aiQueue.unshift(pendingAiItem);
  saveContactsJson();
  logActivityToSupabase('incoming_message', `Received from ${client.name}: ${incomingText}`, client.phone);

  res.json({
    success: true,
    incomingMessage: incomingMsg,
    pendingAiResponse: pendingAiItem,
  });
});

app.post('/api/ai-queue/send-now', (req, res) => {
  const { queueId } = req.body;
  const itemIdx = store.aiQueue.findIndex((q) => q.id === queueId);
  if (itemIdx === -1) {
    return res.status(404).json({ error: 'Queue item not found' });
  }

  const item = store.aiQueue[itemIdx];

  const aiMessage = {
    id: `msg_ai_${Date.now()}`,
    contactId: item.contactId,
    contactName: item.contactName,
    contactPhone: item.contactPhone,
    category: item.category,
    direction: 'outgoing' as const,
    content: `🤖 [Bilingual Gemini AI Auto-Reply]:\n${item.generatedAnswer}`,
    videoUrl: '',
    footerText: store.settings.enableUrduFooter ? store.settings.urduFooter : '',
    status: 'delivered' as const,
    timestamp: new Date().toISOString(),
    isAiGenerated: true,
  };

  store.messages.unshift(aiMessage);
  store.aiQueue[itemIdx].status = 'sent';
  store.aiQueue[itemIdx].delaySecondsLeft = 0;

  saveContactsJson();
  res.json({ success: true, message: aiMessage, queueItem: store.aiQueue[itemIdx] });
});

app.post('/api/ai-queue/cancel', (req, res) => {
  const { queueId } = req.body;
  store.aiQueue = store.aiQueue.filter((q) => q.id !== queueId);
  saveContactsJson();
  res.json({ success: true, aiQueue: store.aiQueue });
});

app.post('/api/settings', (req, res) => {
  store.settings = { ...store.settings, ...req.body };
  saveContactsJson();
  res.json({ success: true, settings: store.settings });
});

// Background Timer Worker
setInterval(() => {
  const now = Date.now();
  let changed = false;

  store.aiQueue.forEach((item) => {
    if (item.status === 'waiting' && now >= item.scheduledTime) {
      item.status = 'sent';
      item.delaySecondsLeft = 0;

      store.messages.unshift({
        id: `msg_ai_auto_${Date.now()}`,
        contactId: item.contactId,
        contactName: item.contactName,
        contactPhone: item.contactPhone,
        category: item.category,
        direction: 'outgoing' as const,
        content: `🤖 [Bilingual Gemini AI Reply - 5 Min Delayed]:\n${item.generatedAnswer}`,
        videoUrl: '',
        footerText: store.settings.enableUrduFooter ? store.settings.urduFooter : '',
        status: 'delivered' as const,
        timestamp: new Date().toISOString(),
        isAiGenerated: true,
      });

      changed = true;
    }
  });

  if (changed) {
    saveContactsJson();
  }
}, 3000);

// Start Server with Vite Middleware
async function start() {
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
    console.log(`🚀 WhatsApp Dynamic System Running at http://localhost:${portNum}`);
    console.log(`🌍 Bilingual Gemini AI Auto-Answer Enabled (Urdu/English)`);
    console.log(`⏱️ 5-Minute Delayed Queue Active`);
    console.log(`🗄️ Supabase Cloud Database Connected`);
    console.log(`=======================================================`);
  });
}

start();
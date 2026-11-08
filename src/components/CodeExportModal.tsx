import React, { useState } from 'react';
import { Code2, Copy, Check, X, FileCode, Github, Terminal, Download, Sparkles } from 'lucide-react';
import { SystemSettings } from '../types';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<'contactsJson' | 'index' | 'baileys' | 'package' | 'env' | 'readme'>('contactsJson');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const codeFiles = {
    contactsJson: `{
  "settings": {
    "senderNumber": "${settings.senderNumber}",
    "greetingPrefix": "السلام علیکم",
    "urduFooter": "اگر آپ اس میں انٹرسٹڈ ہیں تو مزید معلومات کے لیے اس نمبر پر رابطہ کر سکتے ہیں۔",
    "enableUrduFooter": true,
    "defaultDailyLimitPerCategory": 3,
    "aiDelayMinutes": 5
  },
  "categories": [
    {
      "id": "restaurants",
      "name": "Restaurants",
      "folderPath": "media/restaurants",
      "videoFile": "restaurant_promo.mp4",
      "captionTemplate": "Enjoy 25% OFF our Gourmet Menu today! Contact: {phone}",
      "dailyLimit": 3,
      "sentToday": 0
    },
    {
      "id": "realestate",
      "name": "Real Estate",
      "folderPath": "media/realestate",
      "videoFile": "luxury_villas.mp4",
      "captionTemplate": "Invest in prime city residential plots! Contact: {phone}",
      "dailyLimit": 3,
      "sentToday": 0
    }
  ],
  "clients": [
    {
      "id": "cnt_1",
      "name": "Muhammad Ali",
      "phone": "+92 301 5551234",
      "category": "restaurants",
      "status": "new"
    },
    {
      "id": "cnt_2",
      "name": "Tariq Mahmood",
      "phone": "+92 321 4445566",
      "category": "realestate",
      "status": "new"
    }
  ]
}`,

    index: `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { GoogleGenAI } from '@google/genai';
import { connectToWhatsApp, getWhatsAppSocket } from './baileys.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Load contacts.json dynamically
const CONTACTS_PATH = './contacts.json';
let store = JSON.parse(fs.readFileSync(CONTACTS_PATH, 'utf-8'));

function saveStore() {
  fs.writeFileSync(CONTACTS_PATH, JSON.stringify(store, null, 2));
}

// Gemini AI Client Initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

// Delete Client API Endpoint (Full record & log deletion)
app.delete('/api/contacts/:id', (req, res) => {
  const { id } = req.params;
  const existingClient = store.clients.find(c => c.id === id);

  if (!existingClient) {
    return res.status(404).json({ success: false, error: 'Client not found / کلائنٹ نہیں ملا' });
  }

  // Delete client record
  store.clients = store.clients.filter(c => c.id !== id);

  // Clean up associated message logs & AI queues
  if (store.messages) store.messages = store.messages.filter(m => m.contactId !== id);
  if (store.aiQueue) store.aiQueue = store.aiQueue.filter(q => q.contactId !== id);

  saveStore();
  res.json({ success: true, message: \`Client '\${existingClient.name}' deleted successfully!\`, clients: store.clients });
});

// Helper: Build message with "السلام علیکم [Name]" and Urdu Footer
function buildMessage(clientName, category) {
  const greeting = \`\${store.settings.greetingPrefix} \${clientName},\\n\\n\`;
  const caption = category.captionTemplate.replace('{name}', clientName).replace('{phone}', store.settings.senderNumber);
  const footer = \`\${store.settings.urduFooter} (\${store.settings.senderNumber})\`;
  return \`\${greeting}\${caption}\\n\\n\${footer}\`;
}

// POST API: Send Category Video Message
app.post('/api/send', async (req, res) => {
  const { clientId, categoryId } = req.body;
  const sock = getWhatsAppSocket();

  const client = store.clients.find(c => c.id === clientId);
  const category = store.categories.find(cat => cat.id === categoryId);

  if (!client || !category) return res.status(404).json({ error: 'Client/Category not found' });

  // Rate Limit check (2-3 msg/day per category)
  if (category.sentToday >= category.dailyLimit) {
    return res.status(429).json({ error: \`Daily limit (\${category.dailyLimit}/day) reached for \${category.name}.\` });
  }

  const videoFilePath = path.join(category.folderPath, category.videoFile);
  const fullText = buildMessage(client.name, category);
  const jid = client.phone.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

  await sock.sendMessage(jid, {
    video: { url: videoFilePath },
    caption: fullText
  });

  category.sentToday += 1;
  saveStore();
  res.json({ success: true, sentToday: category.sentToday });
});

app.listen(PORT, () => {
  console.log(\`🚀 Local Dashboard running at http://localhost:\${PORT}\`);
  connectToWhatsApp(store, saveStore, ai);
});`,

    baileys: `import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';
import QRCodeTerminal from 'qrcode-terminal';

export async function connectToWhatsApp(store, saveStore, ai) {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
  const sock = makeWASocket({ auth: state, printQRInTerminal: true });
  sock.ev.on('creds.update', saveCreds);

  // Incoming Message Handler with 5-Minute Delayed Gemini AI Response
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.key.fromMe && msg.message) {
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const senderJid = msg.key.remoteJid;
        console.log(\`📩 Client reply from \${senderJid}: \${text}\`);

        // Wait 5 minutes using setTimeout
        setTimeout(async () => {
          console.log(\`🤖 5 minutes elapsed. Generating Gemini AI answer for \${senderJid}...\`);
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: \`CLIENT MESSAGE: "\${text}". Detect language (Urdu/Roman Urdu vs English) and reply in the same language.\`,
          });

          await sock.sendMessage(senderJid, { text: response.text });
        }, 5 * 60 * 1000);
      }
    }
  });
}`,

    package: `{
  "name": "whatsapp-dynamic-automation",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.6.0",
    "@google/genai": "^2.4.0",
    "express": "^4.21.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "qrcode": "^1.5.3"
  }
}`,

    env: `PORT=3000
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
SENDER_NUMBER="${settings.senderNumber}"`,

    readme: `# WhatsApp Dynamic Automation System

## Features Overview & Client Deletion
1. **Client Deletion API & Confirmation Modal**: Full backend deletion of records, AI queue items, and logs upon confirmation.
2. **Dynamic Categories & Video Folders**: Place promotional videos inside \`media/<category_folder>/\` and configure in \`contacts.json\`.
3. **Bilingual Gemini AI Auto-Answer**: Language detection logic for Urdu/Roman Urdu and English with a forced 5-minute delay.

## Setup Guide
1. Place video files in \`media/<category_folder>/\`.
2. Add clients in \`contacts.json\`.
3. Run \`npm install\` and \`npm start\`.
4. Access dashboard at \`http://localhost:3000\`.`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeFiles[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative flex flex-col h-[750px]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Export Dynamic Code Repository &amp; Client Delete Feature
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Updated with Client Deletion
                </span>
              </h2>
              <p className="text-xs text-slate-400">Complete backend &amp; frontend logic for client deletion &amp; contacts.json.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between my-3 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <div className="flex space-x-1 overflow-x-auto no-scrollbar">
            {(['contactsJson', 'index', 'baileys', 'package', 'env', 'readme'] as const).map((fileKey) => (
              <button
                key={fileKey}
                onClick={() => setActiveTab(fileKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  activeTab === fileKey
                    ? 'bg-indigo-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {fileKey === 'contactsJson' && 'contacts.json'}
                {fileKey === 'index' && 'index.js'}
                {fileKey === 'baileys' && 'baileys.js'}
                {fileKey === 'package' && 'package.json'}
                {fileKey === 'env' && '.env.example'}
                {fileKey === 'readme' && 'README.md'}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow cursor-pointer whitespace-nowrap ml-2"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Code!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code View */}
        <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-4 font-mono text-xs text-slate-200 overflow-y-auto no-scrollbar leading-relaxed">
          <pre>{codeFiles[activeTab]}</pre>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Github className="w-4 h-4 text-white" />
            <span>Copy &amp; push directly to GitHub repository</span>
          </div>
          <span className="font-mono text-emerald-400">Local URL: http://localhost:3000</span>
        </div>
      </div>
    </div>
  );
};

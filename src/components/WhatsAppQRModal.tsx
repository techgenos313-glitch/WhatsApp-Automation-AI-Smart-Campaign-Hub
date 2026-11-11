import React, { useEffect, useState } from 'react';
import { QrCode, CheckCircle2, RefreshCw, X, Copy } from 'lucide-react';
import { WhatsAppConnectionState } from '../types';

interface WhatsAppQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: WhatsAppConnectionState;
  onRefreshQr: () => void;
  onConnect: (phoneNumber?: string) => void;
  onDisconnect: () => void;
}

async function postJson(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export const WhatsAppQRModal: React.FC<WhatsAppQRModalProps> = ({
  isOpen,
  onClose,
  connection,
  onRefreshQr,
  onDisconnect,
}) => {
  const [live, setLive] = useState<any>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [usePairingCode, setUsePairingCode] = useState(false);
  const [pairingBusy, setPairingBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Asli halat server se har 2 second baad lete rahein
  useEffect(() => {
    if (!isOpen) return;
    let stopped = false;
    const load = () => {
      fetch('/api/state')
        .then((r) => r.json())
        .then((d) => {
          if (!stopped && d && d.connection) setLive(d.connection);
        })
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, 2000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [isOpen]);

  const conn: any = live || connection;
  const isConnected = conn.status === 'connected';

  // QR wala tareeqa kholne par server se asli QR shuru karwayein
  useEffect(() => {
    if (!isOpen || usePairingCode || isConnected) return;
    postJson('/api/connection/qr')
      .then((d) => {
        if (d && d.connection) setLive(d.connection);
      })
      .catch(() => {});
    // sirf tab chalay jab modal khule ya tareeqa badle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, usePairingCode]);

  if (!isOpen) return null;

  const rawCode: string = conn.pairingCode || '';
  const pairingCode = rawCode.length === 8 ? `${rawCode.slice(0, 4)}-${rawCode.slice(4)}` : rawCode;

  const handleGetCode = async () => {
    setError('');
    setPairingBusy(true);
    try {
      const d = await postJson('/api/connection/pair', { phone: phoneInput });
      if (d.error) setError(d.error);
      else if (d.connection) setLive(d.connection);
    } catch {
      setError('Server se rabta nahi hua. Dobara koshish karein.');
    } finally {
      setPairingBusy(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Connect WhatsApp</h2>
            <p className="text-xs text-slate-400">Apne phone ka WhatsApp jorein. Messages seedha aap ke number se jayenge.</p>
          </div>
        </div>

        {isConnected ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">WhatsApp connected hai</h3>
              <p className="text-xs text-slate-300 mt-1">
                Number: <span className="font-mono font-bold text-emerald-400">{conn.phoneNumber}</span>
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={onDisconnect}
                className="px-4 py-2 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 text-xs font-semibold hover:bg-rose-600/30 transition-all cursor-pointer"
              >
                Disconnect
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setUsePairingCode(false)}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                  !usePairingCode ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                QR code scan karein
              </button>
              <button
                onClick={() => setUsePairingCode(true)}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                  usePairingCode ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Phone number se code
              </button>
            </div>

            {!usePairingCode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-200 shadow-inner text-center">
                  {conn.qrCodeDataUrl ? (
                    <img src={conn.qrCodeDataUrl} alt="WhatsApp QR code" className="w-48 h-48 rounded-lg shadow" />
                  ) : (
                    <div className="w-48 h-48 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                      QR ban raha hai...
                    </div>
                  )}

                  <button
                    onClick={onRefreshQr}
                    className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 font-semibold hover:text-slate-900 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>QR naya karein</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-emerald-400">Scan karne ka tareeqa</h3>
                  <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Phone mein <strong>WhatsApp</strong> kholein.</li>
                    <li><strong>Settings</strong> &gt; <strong>Linked Devices</strong> mein jayein.</li>
                    <li><strong>Link a Device</strong> dabayein aur is QR par camera rakhein.</li>
                    <li>QR har 20 second mein badalta hai. Jaldi scan karein.</li>
                  </ol>
                  <p className="text-[11px] text-slate-400">
                    Jud jane par ye window khud "connected" dikha degi.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    WhatsApp number (country code ke saath, + ke baghair):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="923001234567"
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                    />
                    <button
                      onClick={handleGetCode}
                      disabled={pairingBusy}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
                    >
                      {pairingBusy ? 'Code ban raha hai...' : 'Code banayein'}
                    </button>
                  </div>
                  {error && <p className="text-[11px] text-rose-400 mt-2">{error}</p>}
                </div>

                {pairingCode && (
                  <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-center space-y-2">
                    <span className="text-xs text-slate-400 font-semibold">Aap ka code</span>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl font-mono font-extrabold text-amber-300 tracking-widest">{pairingCode}</span>
                      <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-lg bg-indigo-900/60 text-slate-300 hover:text-white transition-all cursor-pointer"
                        title="Code copy karein"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    {copied && <span className="text-[10px] text-emerald-400 font-semibold block">Copy ho gaya</span>}
                    <p className="text-[11px] text-slate-300">
                      WhatsApp &gt; Linked Devices &gt; Link a Device &gt; "Link with phone number instead" par ye code daalein.
                      Jud jane par ye window khud "connected" dikha degi.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

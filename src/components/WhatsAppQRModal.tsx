import React, { useState } from 'react';
import { QrCode, Smartphone, CheckCircle2, RefreshCw, X, ShieldCheck, KeyRound, Copy } from 'lucide-react';
import { WhatsAppConnectionState } from '../types';

interface WhatsAppQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: WhatsAppConnectionState;
  onRefreshQr: () => void;
  onConnect: (phoneNumber?: string) => void;
  onDisconnect: () => void;
}

export const WhatsAppQRModal: React.FC<WhatsAppQRModalProps> = ({
  isOpen,
  onClose,
  connection,
  onRefreshQr,
  onConnect,
  onDisconnect,
}) => {
  const [phoneNumberInput, setPhoneNumberInput] = useState(connection.phoneNumber || '+92 300 1234567');
  const [usePairingCode, setUsePairingCode] = useState(false);
  const [generatedPairingCode, setGeneratedPairingCode] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePairingCode = () => {
    // Generate 8-digit Baileys code (e.g. ABC1-XYZ2)
    const code = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    setGeneratedPairingCode(code);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPairingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Connect WhatsApp via Baileys QR Code</h2>
            <p className="text-xs text-slate-400">No Meta Business API required. Send directly from your phone number.</p>
          </div>
        </div>

        {/* Connection Toggle Status */}
        {connection.status === 'connected' ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">WhatsApp Connected Successfully!</h3>
              <p className="text-xs text-slate-300 mt-1">
                Active Number: <span className="font-mono font-bold text-emerald-400">{connection.phoneNumber}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Engine: Baileys WebSocket Socket Engine v6.6.0</p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={onDisconnect}
                className="px-4 py-2 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 text-xs font-semibold hover:bg-rose-600/30 transition-all cursor-pointer"
              >
                Disconnect Session
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
            {/* Toggle QR vs Pairing Code */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setUsePairingCode(false)}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                  !usePairingCode ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Option A: Scan QR Code
              </button>
              <button
                onClick={() => setUsePairingCode(true)}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                  usePairingCode ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Option B: Link with Phone Code
              </button>
            </div>

            {!usePairingCode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* QR Display */}
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-200 shadow-inner text-center">
                  {connection.qrCodeDataUrl ? (
                    <img
                      src={connection.qrCodeDataUrl}
                      alt="WhatsApp Baileys QR Code"
                      className="w-48 h-48 rounded-lg shadow"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                      Generating QR...
                    </div>
                  )}

                  <button
                    onClick={onRefreshQr}
                    className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 font-semibold hover:text-slate-900 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh QR Code</span>
                  </button>
                </div>

                {/* Instructions */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Scan Instructions:</h3>
                  <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Open <strong>WhatsApp</strong> on your mobile phone.</li>
                    <li>Tap <strong>Menu (⋮)</strong> or <strong>Settings</strong> &gt; <strong>Linked Devices</strong>.</li>
                    <li>Tap <strong>Link a Device</strong> and point your camera at this QR Code.</li>
                    <li>Once linked, your personal WhatsApp number will send all category videos.</li>
                  </ol>

                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Your Sender Phone Number:</label>
                    <input
                      type="text"
                      value={phoneNumberInput}
                      onChange={(e) => setPhoneNumberInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                    />
                  </div>

                  <button
                    onClick={() => onConnect(phoneNumberInput)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simulate Successful Pairing</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Enter Your WhatsApp Phone Number:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={phoneNumberInput}
                      onChange={(e) => setPhoneNumberInput(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                    />
                    <button
                      onClick={handleGeneratePairingCode}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
                    >
                      Get 8-Digit Code
                    </button>
                  </div>
                </div>

                {generatedPairingCode && (
                  <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-center space-y-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Your Baileys Pairing Code</span>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl font-mono font-extrabold text-amber-300 tracking-widest">{generatedPairingCode}</span>
                      <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-lg bg-indigo-900/60 text-slate-300 hover:text-white transition-all cursor-pointer"
                        title="Copy Code"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    {copied && <span className="text-[10px] text-emerald-400 font-semibold block">Copied to clipboard!</span>}
                    <p className="text-[11px] text-slate-300">
                      Open WhatsApp &gt; Linked Devices &gt; Link with Phone Number instead and type this code.
                    </p>

                    <button
                      onClick={() => onConnect(phoneNumberInput)}
                      className="mt-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      Verify &amp; Connect Device
                    </button>
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

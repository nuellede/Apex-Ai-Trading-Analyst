import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Share2,
  PlusSquare,
  CheckCircle,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activePlatformTab, setActivePlatformTab] = useState<'android' | 'ios'>(
    isIOS ? 'ios' : 'android'
  );
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0e131d] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Instal Apex AI Trading Analyst
              </h3>
              <p className="text-[11px] text-slate-400">
                Akses instan di Layar Utama HP tanpa browser bar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Platform Switcher (Android vs iPhone / iOS) */}
        <div className="p-4 pb-0">
          <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => setActivePlatformTab('android')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                activePlatformTab === 'android'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>HP Android</span>
            </button>
            <button
              onClick={() => setActivePlatformTab('ios')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                activePlatformTab === 'ios'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-base font-sans leading-none"></span>
              <span>iPhone / iPad (iOS)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* App Preview Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <img
              src="/pwa-192x192.png"
              alt="Apex Trading App Icon"
              className="w-12 h-12 rounded-xl border border-cyan-500/30 shadow-md object-cover"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate font-mono">
                Apex AI Trading Analyst
              </h4>
              <p className="text-[11px] text-slate-400 truncate">
                Quant Terminal & Chart Analyzer
              </p>
              <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-mono mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>PWA Standalone Ready · 100% Ringan</span>
              </div>
            </div>
          </div>

          {/* ANDROID TAB CONTENT */}
          {activePlatformTab === 'android' && (
            <div className="space-y-3 font-sans">
              {isInstalled ? (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Aplikasi sudah terinstal di perangkat ini sebagai aplikasi mandiri!</span>
                </div>
              ) : isInstallable ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Browser Anda mendukung instalasi langsung 1-klik ke layar utama HP Android:
                  </p>
                  <button
                    onClick={handleInstallClick}
                    disabled={isInstalling}
                    className="w-full py-3 px-4 rounded-xl font-mono text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isInstalling ? 'Memproses Instalasi...' : 'Instal ke HP Android Sekarang'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-300 font-semibold">
                    Cara Instal di HP Android (Google Chrome):
                  </p>
                  <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    <li className="leading-relaxed">
                      Buka link aplikasi ini di browser <strong>Google Chrome</strong> di HP Anda.
                    </li>
                    <li className="leading-relaxed">
                      Ketuk tombol <strong>Menu (ikon titik tiga ⋮)</strong> di pojok kanan atas browser.
                    </li>
                    <li className="leading-relaxed">
                      Pilih opsi <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                    </li>
                    <li className="leading-relaxed">
                      Ketuk <strong>"Instal"</strong>. Ikon aplikasi akan langsung terpasang di layar utama HP Anda.
                    </li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* IPHONE (IOS) TAB CONTENT */}
          {activePlatformTab === 'ios' && (
            <div className="space-y-3 font-sans">
              <p className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                <span>Cara Instal di iPhone / iPad (Safari):</span>
              </p>
              
              <div className="space-y-2.5 text-xs text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="leading-relaxed">
                    Buka link web app ini menggunakan browser bawaan <strong>Safari</strong> di iPhone Anda.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="leading-relaxed">
                    Ketuk tombol <strong>Bagikan / Share</strong> di toolbar bawah Safari (ikon kotak dengan panah mengarah ke atas: <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-cyan-400" />).
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="leading-relaxed">
                    Gulir ke bawah dan ketuk opsi <strong>"Add to Home Screen"</strong> (atau <strong>"Tambahkan ke Layar Utama"</strong>: <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-emerald-400" />).
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                    4
                  </div>
                  <p className="leading-relaxed">
                    Ketuk <strong>"Add" / "Tambah"</strong> di pojok kanan atas. Aplikasi siap dibuka seperti aplikasi App Store resmi tanpa bar URL Safari!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Key Advantages of PWA */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono text-slate-400">
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Full Screen Tanpa Browser Bar</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Offline Cache & Load Cepat</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs font-mono text-slate-500">
          <span>Protokol Progressive Web App (PWA)</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

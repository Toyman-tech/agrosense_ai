'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAgroEase } from '../../context/AgroEaseContext';
import { 
  Settings as SettingsIcon, 
  Globe, 
  Database, 
  Key, 
  Save, 
  CheckCircle,
  HelpCircle,
  Cpu
} from 'lucide-react';

export default function SettingsPage() {
  const { language, setLanguage, t, languages } = useLanguage();
  const { 
    firebaseDbUrl, 
    geminiApiKey, 
    saveConfig, 
    simulateHardwareWrites, 
    setSimulateHardwareWrites 
  } = useAgroEase();

  const [inputUrl, setInputUrl] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Sync inputs with AgroEase context values
  useEffect(() => {
    setInputUrl(firebaseDbUrl);
    setInputKey(geminiApiKey);
  }, [firebaseDbUrl, geminiApiKey]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfig(inputUrl.trim(), inputKey.trim());
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
    }, 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in relative">
      
      {/* Toast Alert */}
      {showSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-slide-up border border-emerald-400">
          <CheckCircle className="h-5 w-5 text-slate-950" />
          <span>{t('settingsSaved')}</span>
        </div>
      )}

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
          {t('settingsTitle')}
        </h1>
        <p className="text-slate-400 text-sm">
          {t('settingsSubtitle')}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Card 1: Language Settings */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-3">
            <Globe className="h-5 w-5 text-emerald-450" />
            <span>{t('settingsLangSelect')}</span>
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  language === lang.code
                    ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/5 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                    : 'bg-slate-950/60 text-slate-400 border-slate-850 hover:border-slate-700'
                }`}
              >
                <span className="text-lg uppercase">{lang.code}</span>
                <span className="text-xs font-semibold text-slate-350">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Card 2: Firebase Integration settings */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-3">
            <Database className="h-5 w-5 text-emerald-450" />
            <span>{t('settingsFirebaseSection')}</span>
          </h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-355 uppercase tracking-wider block">
                {t('settingsFirebaseURL')}
              </label>
              <div className="relative">
                <Database className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://your-project-default-rtdb.firebaseio.com/"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all placeholder:text-slate-650 text-slate-205"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Required path structure prefix: `/agroease/`. The system will automatically check connections, pull zone indices, and sync telemetry.
              </p>
            </div>

            {/* Checkbox hardware simulator */}
            <div className="space-y-2 pt-4 border-t border-slate-900/60">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateHardwareWrites}
                  onChange={(e) => setSimulateHardwareWrites(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-550/50 cursor-pointer"
                />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-300">
                    Simulate ESP32 Writes to Firebase (Virtual IoT Hardware)
                  </span>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    When active, triggering a sample cycle on the dashboard will write the simulated ESP32 sensor values directly into your Firebase Realtime Database. This allows you to verify real Firebase database integrations without physical hardware online.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Card 3: Gemini AI configurations */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-3">
            <Key className="h-5 w-5 text-emerald-450" />
            <span>{t('settingsGeminiSection')}</span>
          </h2>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-350 uppercase tracking-wider block">
              {t('settingsGeminiKey')}
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all placeholder:text-slate-650 text-slate-205"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Direct connection to Gemini APIs. Enabling this keys shifts both **Crop AI Vision Diagnostics** and the **Agronomist AI Chatbot** from local simulations to live neural model generation.
            </p>
          </div>
        </div>

        {/* Warning Indicator */}
        <div className="border border-amber-500/25 bg-amber-500/5 text-amber-500 p-4 rounded-xl flex items-start gap-3">
          <HelpCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs leading-relaxed">
            <p className="font-bold uppercase tracking-wider">Simulation Mode Notification</p>
            <p className="text-slate-400">{t('settingsMockWarning')}</p>
          </div>
        </div>

        {/* Save Settings CTA */}
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold py-4 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/25 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          <Save className="h-4.5 w-4.5" />
          <span>{t('save')}</span>
        </button>

      </form>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { 
  Eye, 
  MessageSquareCode, 
  ShoppingBag, 
  LineChart, 
  ArrowRight,
  Sparkles,
  Database,
  CloudSun
} from 'lucide-react';

export default function Home() {
  const { t } = useLanguage();

  const features = [
    {
      title: t('cardCropAI'),
      desc: t('cardCropAIDesc'),
      href: '/crop-ai',
      icon: Eye,
      color: 'from-emerald-500 to-teal-400',
      shadowColor: 'rgba(16, 185, 129, 0.25)'
    },
    {
      title: t('cardChat'),
      desc: t('cardChatDesc'),
      href: '/ai-chat',
      icon: MessageSquareCode,
      color: 'from-indigo-500 to-blue-400',
      shadowColor: 'rgba(99, 102, 241, 0.25)'
    },
    {
      title: t('cardMarket'),
      desc: t('cardMarketDesc'),
      href: '/market',
      icon: ShoppingBag,
      color: 'from-amber-500 to-orange-400',
      shadowColor: 'rgba(245, 158, 11, 0.25)'
    },
    {
      title: t('cardRecs'),
      desc: t('cardRecsDesc'),
      href: '/recommendations',
      icon: LineChart,
      color: 'from-purple-500 to-pink-400',
      shadowColor: 'rgba(168, 85, 247, 0.25)'
    }
  ];

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-10 agri-grid relative">
      {/* Decorative Grid Lines / Shapes */}
      <div className="absolute top-10 right-10 flex gap-2 animate-bounce pointer-events-none opacity-20">
        <Sparkles className="h-6 w-6 text-emerald-400" />
      </div>

      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto space-y-6 mt-6 mb-16 px-4">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-semibold uppercase tracking-wider mx-auto shadow-[0_0_15px_rgba(16,185,129,0.08)]">
          <Sparkles className="h-3 w-3" />
          <span>Next-Gen Agricultural Intelligence</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-450 bg-clip-text text-transparent leading-tight">
          {t('heroTitle')}
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-slate-355 max-w-2xl mx-auto leading-relaxed font-light">
          {t('heroSubtitle')}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold px-8 py-3.5 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer duration-200"
          >
            <span>{t('ctaLaunch')}</span>
            <ArrowRight className="h-5 w-5 text-slate-950" />
          </Link>
          <Link
            href="/market"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-700 bg-slate-900/60 hover:bg-slate-800/85 hover:border-slate-500 text-white font-medium px-8 py-3.5 rounded-xl backdrop-blur-sm transition-all duration-200"
          >
            <span>{t('ctaMarket')}</span>
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="mt-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-350 bg-clip-text text-transparent">
            {t('featureTitle')}
          </h2>
          <p className="text-sm text-slate-400">
            {t('featureSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto px-4 mt-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Link
                key={idx}
                href={feature.href}
                className="group relative block rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md hover:border-emerald-500/30 hover:bg-slate-900/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
              >
                {/* Glow Overlay effect */}
                <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${feature.color} text-slate-950 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6 text-slate-950" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-slate-100 group-hover:text-emerald-400 transition-colors">
                        {feature.title}
                      </h3>
                      <ArrowRight className="h-4 w-4 text-slate-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed font-light">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Platform Quick Facts */}
      <div className="mt-20 max-w-5xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center border-t border-slate-900 pt-10">
        <div className="space-y-1">
          <div className="text-3xl font-extrabold text-emerald-400">98.4%</div>
          <p className="text-xs text-slate-400 uppercase tracking-wider">AI Vision Diagnostic Confidence</p>
        </div>
        <div className="space-y-1 border-y sm:border-y-0 sm:border-x border-slate-900 py-4 sm:py-0">
          <div className="text-3xl font-extrabold text-teal-400">&lt; 3.0s</div>
          <p className="text-xs text-slate-400 uppercase tracking-wider">IoT Soil Packet Latency</p>
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-extrabold text-indigo-450">$0 Fees</div>
          <p className="text-xs text-slate-400 uppercase tracking-wider">Direct peer-to-peer marketplace commission</p>
        </div>
      </div>
    </div>
  );
}

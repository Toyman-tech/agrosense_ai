'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';
import { 
  Sprout, 
  LayoutDashboard, 
  ShoppingBag, 
  Eye, 
  MessageSquareCode, 
  LineChart, 
  Settings, 
  Menu, 
  X, 
  Globe 
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { language, setLanguage, t, languages } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: t('navHome'), icon: Sprout },
    { href: '/dashboard', label: t('navDashboard'), icon: LayoutDashboard },
    { href: '/market', label: t('navMarket'), icon: ShoppingBag },
    { href: '/crop-ai', label: t('navCropAI'), icon: Eye },
    { href: '/ai-chat', label: t('navChat'), icon: MessageSquareCode },
    { href: '/recommendations', label: t('navRecs'), icon: LineChart },
    { href: '/settings', label: t('navSettings'), icon: Settings }
  ];

  const handleLangSelect = (code: typeof language) => {
    setLanguage(code);
    setLangMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-emerald-500/20 bg-slate-950/80 backdrop-blur-md text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-emerald-400 font-extrabold text-xl tracking-wider hover:text-emerald-300 transition-colors">
              <Sprout className="h-7 w-7 text-emerald-500 animate-pulse" />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                Agrosense AI
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side Buttons & Language Switcher */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-sm transition-all focus:outline-none"
              >
                <Globe className="h-4 w-4 text-emerald-400" />
                <span className="uppercase">{language}</span>
              </button>
              
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 origin-top-right rounded-xl border border-slate-800 bg-slate-950 p-1 shadow-2xl ring-1 ring-black ring-opacity-5 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLangSelect(lang.code)}
                      className={`flex w-full items-center px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                        language === lang.code
                          ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                          : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-3">
            {/* Quick Language Toggle on Mobile */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs uppercase"
              >
                <Globe className="h-3.5 w-3.5 text-emerald-400" />
                <span>{language}</span>
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-32 origin-top-right rounded-xl border border-slate-850 bg-slate-950 p-1 shadow-2xl ring-1 ring-black ring-opacity-5 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLangSelect(lang.code)}
                      className={`flex w-full items-center px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors ${
                        language === lang.code
                          ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                          : 'text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-900 bg-slate-950 px-2 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                  isActive 
                    ? 'bg-emerald-500/15 text-emerald-400 border-l-4 border-emerald-500' 
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 text-emerald-400" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};

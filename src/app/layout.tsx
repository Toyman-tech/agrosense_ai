import type { Metadata } from 'next';
import { Outfit, Fira_Code } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '../context/LanguageContext';
import { AgroEaseProvider } from '../context/AgroEaseContext';
import { Navbar } from '../components/Navbar';
import { FloatingChat } from '../components/FloatingChat';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['300', '400', '600', '800']
});

const firaCode = Fira_Code({
  variable: '--font-fira-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Agrosense AI - Intelligent Agriculture Ecosystem',
  description: 'AI Crop disease vision diagnostics, real-time ESP32 multi-zone soil IoT monitoring, smart crop selector, and direct-to-buyer crop marketplace.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${firaCode.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
        <LanguageProvider>
          <AgroEaseProvider>
            <Navbar />
            <main className="flex-1 w-full relative">
              {/* Premium Background Ambience */}
              <div className="absolute top-[-10%] left-[-20%] w-[600px] h-[600px] rounded-full bg-emerald-700/5 blur-[120px] pointer-events-none" />
              <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-700/5 blur-[100px] pointer-events-none" />
              <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-teal-500/[0.02] blur-[150px] pointer-events-none" />
              
              <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </div>
            </main>
            <FloatingChat />
          </AgroEaseProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

'use client';

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAgroEase } from '../../context/AgroEaseContext';
import { 
  Cpu, 
  Activity, 
  Wifi, 
  WifiOff, 
  Droplet, 
  Thermometer, 
  Wind, 
  FlaskConical, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  Sparkles,
  Info
} from 'lucide-react';

export default function Dashboard() {
  const { t } = useLanguage();
  const { 
    currentZone, 
    deviceStatus, 
    deviceOnline, 
    zonesCompleted, 
    zonesData, 
    isLiveMode,
    changeZone, 
    triggerSampling, 
    resetAllZones 
  } = useAgroEase();

  const getStatusText = (status: typeof deviceStatus) => {
    switch (status) {
      case 'waiting': return t('statusWaiting');
      case 'sampling': return t('statusSampling');
      case 'uploading': return t('statusUploading');
      case 'complete': return t('statusComplete');
      case 'error': return t('statusError');
      default: return status;
    }
  };

  const activeZoneKey = `zone${currentZone}` as 'zone1' | 'zone2' | 'zone3';
  const activeZoneData = zonesData[activeZoneKey];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/20 p-6 rounded-2xl border border-slate-900">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            {t('iotTitle')}
          </h1>
          <p className="text-slate-400 text-sm">{t('iotSubtitle')}</p>
        </div>

        {/* Device Status Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            deviceOnline 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {deviceOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span>{deviceOnline ? t('iotConnected') : t('iotDisconnected')}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-slate-950 text-slate-400 border-slate-800">
            <Cpu className="h-4 w-4 text-indigo-400" />
            <span>{isLiveMode ? t('iotModeLive') : t('iotModeSimulated')}</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Control Panel vs Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Control & Zones Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Zones list card */}
          <div className="glass rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-3">
              <Activity className="h-5 w-5 text-emerald-450" />
              <span>Zone Selection Screen</span>
            </h2>

            {/* Zone Buttons */}
            <div className="space-y-3">
              {[1, 2, 3].map((zoneNum) => {
                const zoneKey = `zone${zoneNum}` as 'zone1' | 'zone2' | 'zone3';
                const isCompleted = zonesCompleted[zoneKey];
                const isActive = currentZone === zoneNum;

                return (
                  <button
                    key={zoneNum}
                    onClick={() => changeZone(zoneNum)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-emerald-500/40 shadow-md'
                        : 'bg-slate-950/60 text-slate-400 border-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black ${
                        isActive 
                          ? 'bg-emerald-500 text-slate-950 shadow-md' 
                          : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}>
                        {zoneNum}
                      </div>
                      <span>Zone {zoneNum} Data Reading</span>
                    </div>

                    {isCompleted && (
                      <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 flex items-center justify-center">
                        <CheckCircle className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Current status display */}
            <div className="border-t border-slate-900 pt-5 space-y-2">
              <span className="text-xs text-slate-500 uppercase tracking-widest block font-bold">
                {t('iotDeviceStatus')}
              </span>
              
              <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl flex items-center gap-3">
                {deviceStatus === 'sampling' && (
                  <RefreshCw className="h-5 w-5 text-emerald-400 animate-spin" />
                )}
                {deviceStatus === 'uploading' && (
                  <RefreshCw className="h-5 w-5 text-indigo-400 animate-spin" />
                )}
                {deviceStatus === 'waiting' && (
                  <Info className="h-5 w-5 text-amber-500 animate-pulse" />
                )}
                {deviceStatus === 'complete' && (
                  <CheckCircle className="h-5 w-5 text-emerald-450" />
                )}
                {deviceStatus === 'error' && (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-200 capitalize leading-snug">
                    {deviceStatus}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {getStatusText(deviceStatus)}
                  </p>
                </div>
              </div>
            </div>

            {/* Triggers */}
            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={triggerSampling}
                disabled={deviceStatus === 'sampling' || deviceStatus === 'uploading' || !deviceOnline}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Play className="h-4 w-4" />
                <span>{t('iotTriggerSample')}</span>
              </button>

              <button
                onClick={resetAllZones}
                className="w-full text-center text-xs text-slate-500 hover:text-red-400 font-medium py-1 transition-colors cursor-pointer"
              >
                Reset Dashboard Data
              </button>
            </div>

          </div>

          {/* Zones Completed Check Summary */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider">{t('iotCompletedZones')}</h3>
            <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-900">
              <div className="flex gap-4">
                <span className="flex items-center gap-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${zonesCompleted.zone1 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                  <span>Z1</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${zonesCompleted.zone2 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                  <span>Z2</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${zonesCompleted.zone3 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                  <span>Z3</span>
                </span>
              </div>
              <span className="font-semibold text-emerald-450 uppercase tracking-widest text-[9px]">
                {Object.values(zonesCompleted).every(v => v === true) ? 'Completed' : 'Pending'}
              </span>
            </div>
          </div>

        </div>

        {/* Right Side: Telemetry Gauges Display Panel (8 cols) */}
        <div className="lg:col-span-8 glass rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-3">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            <span>Zone {currentZone} Telemetry Metrics</span>
          </h2>

          {!activeZoneData ? (
            /* Blank state when no reading is run */
            <div className="min-h-[350px] flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
              <Activity className="h-14 w-14 text-slate-800 animate-pulse stroke-1" />
              <p className="text-sm font-bold text-slate-350">No Data Captured</p>
              <p className="text-xs text-slate-600 max-w-sm">Sensor data packet is blank for this zone. Trigger a new sample cycle above to read NPK, moisture, temperature, and pH levels.</p>
            </div>
          ) : (
            /* Gauges view grid */
            <div className="space-y-6">
              
              {/* Top Row: Moisture, Temp, Humidity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Moisture Gauge */}
                <div className="border border-slate-900 bg-slate-950/40 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-450">
                    <span className="flex items-center gap-1.5">
                      <Droplet className="h-4 w-4 text-emerald-400" />
                      <span>{t('moisture')}</span>
                    </span>
                    <span className="text-emerald-400 font-extrabold">{activeZoneData.moisture}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full" 
                      style={{ width: `${activeZoneData.moisture}%` }}
                    />
                  </div>
                </div>

                {/* Temperature Gauge */}
                <div className="border border-slate-900 bg-slate-950/40 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-450">
                    <span className="flex items-center gap-1.5">
                      <Thermometer className="h-4 w-4 text-amber-500" />
                      <span>{t('temperature')}</span>
                    </span>
                    <span className="text-amber-500 font-extrabold">{activeZoneData.temperature}°C</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-orange-400 h-2 rounded-full" 
                      style={{ width: `${(activeZoneData.temperature / 50) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Humidity Gauge */}
                <div className="border border-slate-900 bg-slate-950/40 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-450">
                    <span className="flex items-center gap-1.5">
                      <Wind className="h-4 w-4 text-indigo-400" />
                      <span>{t('humidity')}</span>
                    </span>
                    <span className="text-indigo-450 font-extrabold">{activeZoneData.humidity}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-blue-400 h-2 rounded-full" 
                      style={{ width: `${activeZoneData.humidity}%` }}
                    />
                  </div>
                </div>

              </div>

              {/* Middle Row: Soil pH (special scale) */}
              <div className="border border-slate-900 bg-slate-950/40 p-5 rounded-xl space-y-4">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-450">
                  <span className="flex items-center gap-1.5">
                    <FlaskConical className="h-4 w-4 text-emerald-450" />
                    <span>{t('soilPH')}</span>
                  </span>
                  <span className="text-emerald-450 font-black text-sm">{activeZoneData.pH} pH</span>
                </div>
                <div className="relative">
                  <div className="w-full h-3 rounded-full bg-gradient-to-r from-red-500 via-emerald-500 to-blue-650" />
                  
                  {/* Indicator pin */}
                  <div 
                    className="absolute -top-1 w-1.5 h-5 bg-white border border-slate-950 shadow-md transition-all duration-500"
                    style={{ left: `${(activeZoneData.pH / 14) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-650 font-bold uppercase tracking-wider">
                  <span>Acidic</span>
                  <span>Optimal (6.5)</span>
                  <span>Alkaline</span>
                </div>
              </div>

              {/* Bottom Row: chemical NPK Metrics bar stack */}
              <div className="border border-slate-900 bg-slate-950/40 p-5 rounded-xl space-y-6">
                <h3 className="text-xs font-bold text-slate-355 uppercase tracking-wider">NPK soil constituents</h3>
                
                <div className="space-y-4">
                  {/* Nitrogen */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{t('nitrogen')} (N)</span>
                      <span className="font-extrabold text-slate-200">{activeZoneData.nitrogen} mg/kg</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (activeZoneData.nitrogen / 100) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Phosphorus */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{t('phosphorus')} (P)</span>
                      <span className="font-extrabold text-slate-200">{activeZoneData.phosphorus} mg/kg</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-teal-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (activeZoneData.phosphorus / 80) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Potassium */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{t('potassium')} (K)</span>
                      <span className="font-extrabold text-slate-200">{activeZoneData.potassium} mg/kg</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (activeZoneData.potassium / 300) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamp footer metadata */}
              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-900">
                <span>Data validity: verified package</span>
                <span>Last upload: {activeZoneData.uploadTime}</span>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

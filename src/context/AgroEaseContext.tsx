'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getDatabase, ref as databaseRef, onValue, set } from 'firebase/database';

export interface ZoneData {
  moisture: number;
  temperature: number;
  humidity: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  pH: number;
  timestamp: string;
  uploadTime: string;
  isValid: boolean;
}

export interface IoTControl {
  currentZone: number;
  deviceStatus: 'waiting' | 'sampling' | 'uploading' | 'complete' | 'error';
  totalZones: number;
  deviceOnline: boolean;
  zonesCompleted: {
    zone1: boolean;
    zone2: boolean;
    zone3: boolean;
  };
}

interface AgroEaseContextType {
  // Device State
  currentZone: number;
  deviceStatus: 'waiting' | 'sampling' | 'uploading' | 'complete' | 'error';
  deviceOnline: boolean;
  zonesCompleted: { zone1: boolean; zone2: boolean; zone3: boolean };
  zonesData: {
    zone1: ZoneData | null;
    zone2: ZoneData | null;
    zone3: ZoneData | null;
  };
  
  // App Config
  firebaseDbUrl: string;
  geminiApiKey: string;
  isLiveMode: boolean;
  simulateHardwareWrites: boolean;
  
  // Actions
  changeZone: (zoneNum: number) => Promise<void>;
  triggerSampling: () => void;
  resetAllZones: () => void;
  saveConfig: (firebaseUrl: string, geminiKey: string) => void;
  setSimulateHardwareWrites: (simulate: boolean) => void;
}

const AgroEaseContext = createContext<AgroEaseContextType | undefined>(undefined);

// Web App Firebase credentials (linked to project agroease-ai)
const firebaseConfig = {
  apiKey: "AIzaSyAS8YLxgM8y4V5cvkQXrrZqgAbV7t5ZZdk",
  authDomain: "agroease-ai.firebaseapp.com",
  projectId: "agroease-ai",
  storageBucket: "agroease-ai.firebasestorage.app",
  messagingSenderId: "826477562286",
  appId: "1:826477562286:web:b5923e2203198a5a93203f",
  measurementId: "G-32SLBQM213",
  databaseURL: "https://agroease-ai-default-rtdb.firebaseio.com" // Default RTDB URL
};

// Initialize Firebase App helper (handles config switches dynamically)
const initFirebase = (customDbUrl?: string) => {
  const dbUrl = customDbUrl || firebaseConfig.databaseURL;
  const config = {
    ...firebaseConfig,
    databaseURL: dbUrl
  };

  if (getApps().length > 0) {
    const existingApp = getApps()[0];
    if ((existingApp.options as any).databaseURL !== dbUrl) {
      deleteApp(existingApp);
      return initializeApp(config);
    }
    return existingApp;
  }
  return initializeApp(config);
};

// Initial simulated/fallback values
const defaultZoneData = (zoneNum: number): ZoneData => {
  const baseNPK = [
    { n: 37.2, p: 18.5, k: 175.8 },
    { n: 28.4, p: 14.1, k: 150.2 },
    { n: 45.0, p: 25.3, k: 190.5 }
  ][zoneNum - 1];

  return {
    moisture: Number((40 + Math.random() * 15).toFixed(1)),
    temperature: Number((25 + Math.random() * 5).toFixed(1)),
    humidity: Number((60 + Math.random() * 10).toFixed(1)),
    nitrogen: baseNPK.n,
    phosphorus: baseNPK.p,
    potassium: baseNPK.k,
    pH: Number((6.2 + Math.random() * 1.0).toFixed(1)),
    timestamp: Date.now().toString(),
    uploadTime: new Date().toLocaleTimeString(),
    isValid: true
  };
};

export const AgroEaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseDbUrl, setFirebaseDbUrl] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isLiveMode, setIsLiveMode] = useState(true); // Active by default
  const [simulateHardwareWrites, setSimulateHardwareWritesState] = useState(true);

  // IoT State
  const [currentZone, setCurrentZone] = useState<number>(1);
  const [deviceStatus, setDeviceStatus] = useState<IoTControl['deviceStatus']>('waiting');
  const [deviceOnline, setDeviceOnline] = useState<boolean>(true);
  const [zonesCompleted, setZonesCompleted] = useState<{ zone1: boolean; zone2: boolean; zone3: boolean }>({
    zone1: false,
    zone2: false,
    zone3: false
  });
  const [zonesData, setZonesData] = useState<{
    zone1: ZoneData | null;
    zone2: ZoneData | null;
    zone3: ZoneData | null;
  }>({
    zone1: null,
    zone2: null,
    zone3: null
  });

  // Load configuration from local storage
  useEffect(() => {
    const savedFirebase = localStorage.getItem('agrosense_firebase_url') || 'https://agroease-ai-default-rtdb.firebaseio.com';
    const savedGemini = localStorage.getItem('agrosense_gemini_key') || '';
    const savedSimulate = localStorage.getItem('agrosense_simulate_hardware') !== 'false';
    
    setFirebaseDbUrl(savedFirebase);
    setGeminiApiKey(savedGemini);
    setIsLiveMode(!!savedFirebase);
    setSimulateHardwareWritesState(savedSimulate);
  }, []);

  const setSimulateHardwareWrites = (val: boolean) => {
    setSimulateHardwareWritesState(val);
    localStorage.setItem('agrosense_simulate_hardware', String(val));
  };

  // Helper to initialize default Firebase structure via SDK
  const initializeFirebase = async (db: any) => {
    try {
      await set(databaseRef(db, 'agroease'), {
        control: {
          currentZone: 1,
          deviceStatus: 'waiting',
          totalZones: 3,
          deviceOnline: true,
          zonesCompleted: {
            zone1: false,
            zone2: false,
            zone3: false
          }
        },
        zones: {
          zone1: null,
          zone2: null,
          zone3: null
        }
      });
    } catch (err) {
      console.error('Failed to initialize Firebase database:', err);
    }
  };

  // Sync / Subscribe to Firebase via official Web SDK
  useEffect(() => {
    if (!isLiveMode) return;

    try {
      const app = initFirebase(firebaseDbUrl);
      const db = getDatabase(app);
      const agroeaseRef = databaseRef(db, 'agroease');

      const unsubscribe = onValue(agroeaseRef, async (snapshot) => {
        const data = snapshot.val();
        
        if (data === null) {
          // Initialize database automatically if empty
          await initializeFirebase(db);
          return;
        }

        if (data) {
          if (data.control) {
            setCurrentZone(data.control.currentZone || 1);
            setDeviceStatus(data.control.deviceStatus || 'waiting');
            setDeviceOnline(data.control.deviceOnline !== undefined ? data.control.deviceOnline : true);
            setZonesCompleted({
              zone1: data.control.zonesCompleted?.zone1 || false,
              zone2: data.control.zonesCompleted?.zone2 || false,
              zone3: data.control.zonesCompleted?.zone3 || false
            });
          }
          if (data.zones) {
            setZonesData({
              zone1: data.zones.zone1 || null,
              zone2: data.zones.zone2 || null,
              zone3: data.zones.zone3 || null
            });
          }
        }
      }, (error) => {
        console.error('Firebase SDK subscription error:', error);
        setDeviceOnline(false);
      });

      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error('Firebase SDK initialization failed:', err);
      setDeviceOnline(false);
    }
  }, [isLiveMode, firebaseDbUrl]);

  // Actions
  const saveConfig = (url: string, key: string) => {
    const finalUrl = url || 'https://agroease-ai-default-rtdb.firebaseio.com';
    setFirebaseDbUrl(finalUrl);
    setGeminiApiKey(key);
    setIsLiveMode(!!finalUrl);
    localStorage.setItem('agrosense_firebase_url', finalUrl);
    localStorage.setItem('agrosense_gemini_key', key);
  };

  const changeZone = async (zoneNum: number) => {
    if (zoneNum < 1 || zoneNum > 3) return;
    
    if (isLiveMode) {
      try {
        const app = initFirebase(firebaseDbUrl);
        const db = getDatabase(app);
        await set(databaseRef(db, 'agroease/control/currentZone'), zoneNum);
        await set(databaseRef(db, 'agroease/control/deviceStatus'), 'waiting');
      } catch (err) {
        console.error('Error changing zone on Firebase SDK:', err);
      }
    } else {
      // Simulated local transition
      setCurrentZone(zoneNum);
      setDeviceStatus('waiting');
    }
  };

  const triggerSampling = async () => {
    if (isLiveMode) {
      try {
        const app = initFirebase(firebaseDbUrl);
        const db = getDatabase(app);
        
        // Write status as sampling
        await set(databaseRef(db, 'agroease/control/deviceStatus'), 'sampling');

        if (simulateHardwareWrites) {
          // Virtual ESP32 Hardware Simulator writing to Firebase database nodes
          setTimeout(async () => {
            await set(databaseRef(db, 'agroease/control/deviceStatus'), 'uploading');

            setTimeout(async () => {
              const newData = defaultZoneData(currentZone);

              // 1. Write the zone metrics to Firebase
              await set(databaseRef(db, `agroease/zones/zone${currentZone}`), newData);

              // 2. Mark zone complete in Firebase
              await set(databaseRef(db, `agroease/control/zonesCompleted/zone${currentZone}`), true);

              // 3. Mark status to complete in Firebase
              await set(databaseRef(db, 'agroease/control/deviceStatus'), 'complete');

              // 4. Auto-advance to next zone on Firebase
              if (currentZone < 3) {
                setTimeout(async () => {
                  await set(databaseRef(db, 'agroease/control/currentZone'), currentZone + 1);
                  await set(databaseRef(db, 'agroease/control/deviceStatus'), 'waiting');
                }, 1500);
              }

            }, 2000);
          }, 2500);
        }
      } catch (err) {
        console.error('Error starting sampling write:', err);
      }
    } else {
      // Local client-side simulation (when isLiveMode = false)
      setDeviceStatus('sampling');
      
      setTimeout(() => {
        setDeviceStatus('uploading');
        
        setTimeout(() => {
          const newData = defaultZoneData(currentZone);
          
          setZonesData(prev => ({
            ...prev,
            [`zone${currentZone}`]: newData
          }));

          setZonesCompleted(prev => {
            const nextVal = {
              ...prev,
              [`zone${currentZone}`]: true
            };

            if (currentZone < 3) {
              setTimeout(() => {
                setCurrentZone(prevZone => prevZone + 1);
                setDeviceStatus('waiting');
              }, 1500);
            }
            
            return nextVal;
          });

          setDeviceStatus('complete');
        }, 2000);
      }, 2500);
    }
  };

  const resetAllZones = async () => {
    if (isLiveMode) {
      try {
        const app = initFirebase(firebaseDbUrl);
        const db = getDatabase(app);
        await set(databaseRef(db, 'agroease/control/zonesCompleted'), { zone1: false, zone2: false, zone3: false });
        await set(databaseRef(db, 'agroease/zones'), { zone1: null, zone2: null, zone3: null });
        await set(databaseRef(db, 'agroease/control/currentZone'), 1);
        await set(databaseRef(db, 'agroease/control/deviceStatus'), 'waiting');
      } catch (err) {
        console.error('Error resetting Firebase data:', err);
      }
    } else {
      setZonesCompleted({ zone1: false, zone2: false, zone3: false });
      setZonesData({ zone1: null, zone2: null, zone3: null });
      setCurrentZone(1);
      setDeviceStatus('waiting');
    }
  };

  return (
    <AgroEaseContext.Provider value={{
      currentZone,
      deviceStatus,
      deviceOnline,
      zonesCompleted,
      zonesData,
      firebaseDbUrl,
      geminiApiKey,
      isLiveMode,
      simulateHardwareWrites,
      changeZone,
      triggerSampling,
      resetAllZones,
      saveConfig,
      setSimulateHardwareWrites
    }}>
      {children}
    </AgroEaseContext.Provider>
  );
};

export const useAgroEase = () => {
  const context = useContext(AgroEaseContext);
  if (!context) {
    throw new Error('useAgroEase must be used within an AgroEaseProvider');
  }
  return context;
};

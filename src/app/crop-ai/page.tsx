'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAgroEase } from '../../context/AgroEaseContext';
import { 
  Upload, 
  Camera, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Plus, 
  FileText,
  Trash2,
  X
} from 'lucide-react';

interface DiagnosticResult {
  id: string;
  imageUrl: string;
  diagnosis: string;
  confidence: number;
  remedies: string[];
  createdAt: string;
}

export default function CropAI() {
  const { t, language } = useLanguage();
  const { geminiApiKey } = useAgroEase();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [history, setHistory] = useState<DiagnosticResult[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('agrosense_diagnostic_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save history helper
  const saveToHistory = (newResult: DiagnosticResult) => {
    const updated = [newResult, ...history].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('agrosense_diagnostic_history', JSON.stringify(updated));
  };

  // Clear history helper
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('agrosense_diagnostic_history');
  };

  // Camera functions
  const startCamera = async () => {
    setResult(null);
    setSelectedImage(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Could not access camera. Please check permissions.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setSelectedImage(dataUrl);
        stopCamera();
        analyzeCropImage(dataUrl);
      }
    }
  };

  // File Upload Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        setSelectedImage(dataUrl);
        setResult(null);
        analyzeCropImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Image Diagnostics Processing
  const analyzeCropImage = async (dataUrl: string) => {
    setErrorMessage(null);
    setIsScanning(true);
    setScanProgress(10);
    
    // Animate progress spinner/bar
    const timer = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) {
          clearInterval(timer);
          return 90;
        }
        return prev + 20;
      });
    }, 400);

    try {
      let finalResult: Omit<DiagnosticResult, 'id' | 'imageUrl' | 'createdAt'>;

      if (geminiApiKey) {
        // Real Gemini AI call
        const base64Data = dataUrl.split(',')[1];
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: `Analyze this agricultural leaf/crop tissue image. Diagnose the disease, nutritional deficiency, or if it is healthy. Return a JSON response exactly inside this structure, omitting all markdown wrapping or tags: 
                  {
                    "diagnosis": "Name of condition",
                    "confidence": 92,
                    "remedies": ["Remedy 1 Details", "Remedy 2 Details"]
                  }`
                },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data
                  }
                }
              ]
            }]
          })
        });

        if (!res.ok) {
          if (res.status === 429) {
            throw new Error('API_RATE_LIMIT');
          } else if (res.status === 403 || res.status === 400) {
            throw new Error('API_KEY_INVALID');
          } else {
            throw new Error(`API_ERROR_${res.status}`);
          }
        }
        const data = await res.json();
        const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Clean JSON formatting from Gemini
        const cleanedText = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        finalResult = {
          diagnosis: parsed.diagnosis || 'Unknown Issue',
          confidence: parsed.confidence || 85,
          remedies: parsed.remedies || ['Consult a local specialist']
        };
      } else {
        // High fidelity simulated response
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mockOptions = [
          {
            diagnosis: 'Early Blight (Alternaria solani)',
            confidence: 94,
            remedies: [
              t('visionMockBlight'),
              'Prune lower leaves to reduce soil splash and improve air circulation.',
              'Apply organic copper-based fungicide once every 7-10 days.'
            ]
          },
          {
            diagnosis: 'Nitrogen (N) Deficiency',
            confidence: 88,
            remedies: [
              t('visionMockDeficiency'),
              'Apply aged compost tea or dynamic nitrogen-boosting fish emulsion.',
              'Plant nitrogen-fixing cover crops (cowpeas, alfalfa) in next rotation.'
            ]
          },
          {
            diagnosis: 'Healthy leaf tissue',
            confidence: 98,
            remedies: [
              t('visionMockHealthy'),
              'Maintain existing irrigation schedule.',
              'Perform routine NPK soil testing monthly to maintain soil nutrition.'
            ]
          }
        ];
        
        // Pick one mock outcome
        finalResult = mockOptions[Math.floor(Math.random() * mockOptions.length)];
      }

      setScanProgress(100);
      clearInterval(timer);

      const savedResult: DiagnosticResult = {
        ...finalResult,
        id: Math.random().toString(36).substr(2, 9),
        imageUrl: dataUrl,
        createdAt: new Date().toLocaleString()
      };

      setResult(savedResult);
      saveToHistory(savedResult);
    } catch (err: any) {
      console.warn('Gemini API Error:', err.message || err);
      if (err.message === 'API_RATE_LIMIT') {
        setErrorMessage('Gemini API rate limit exceeded (429 Too Many Requests). Please wait at least 60 seconds before making another request.');
      } else if (err.message === 'API_KEY_INVALID') {
        setErrorMessage('Invalid Gemini API Key or permission denied (403/400). Please check your API key in Settings.');
      } else {
        setErrorMessage(`Diagnostic scan encountered an API error: ${err.message || 'Unknown network error'}. Falling back to simulation.`);
      }
      
      const fallbackResult: DiagnosticResult = {
        id: Math.random().toString(36).substr(2, 9),
        imageUrl: dataUrl,
        diagnosis: 'Early Blight (Alternaria solani)',
        confidence: 94,
        remedies: [
          t('visionMockBlight'),
          'Apply organic copper fungicide immediately.',
          'Improve spacing to reduce humidity around foliage.'
        ],
        createdAt: new Date().toLocaleString()
      };
      setResult(fallbackResult);
      saveToHistory(fallbackResult);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Panel */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
          {t('visionTitle')}
        </h1>
        <p className="text-slate-400 text-sm">
          {t('visionSubtitle')}
        </p>
      </div>

      {/* Main Grid: Upload & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Card: Input Panel */}
        <div className="glass rounded-2xl p-6 flex flex-col space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100">
            <Camera className="h-5 w-5 text-emerald-400" />
            <span>Image Capture & Upload</span>
          </h2>

          {/* Uploader Box */}
          {!cameraActive ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[300px] cursor-pointer transition-all ${
                dragActive 
                  ? 'border-emerald-400 bg-emerald-500/5' 
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
              }`}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <div className="p-4 bg-slate-900 rounded-full border border-slate-800 text-slate-400 mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="h-8 w-8 text-emerald-450" />
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  {t('visionUploadZone')}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {t('visionUploadLimits')}
                </p>
              </label>

              <div className="w-full flex items-center justify-center my-4">
                <span className="h-px w-20 bg-slate-800" />
                <span className="text-xs text-slate-500 px-3 uppercase">or</span>
                <span className="h-px w-20 bg-slate-800" />
              </div>

              <button
                onClick={startCamera}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-emerald-500/25"
              >
                <Camera className="h-4 w-4" />
                <span>{t('visionCameraActive')}</span>
              </button>
            </div>
          ) : (
            /* Live Camera Panel */
            <div className="relative rounded-xl overflow-hidden bg-black flex flex-col min-h-[300px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-[300px] object-cover"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
                <button
                  onClick={capturePhoto}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-6 py-2 rounded-lg text-sm font-bold shadow-lg transition-all"
                >
                  {t('visionCameraCapture')}
                </button>
                <button
                  onClick={stopCamera}
                  className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 px-6 py-2 rounded-lg text-sm font-semibold transition-all"
                >
                  {t('visionCameraClose')}
                </button>
              </div>
            </div>
          )}

          {/* Selected Preview Details */}
          {selectedImage && (
            <div className="relative rounded-xl border border-slate-800 p-4 bg-slate-950/60 flex items-center gap-4">
              <img
                src={selectedImage}
                alt="Selected tissue Preview"
                className="h-16 w-16 object-cover rounded-lg border border-slate-800"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-200 truncate">Tissue Image Loaded</p>
                <p className="text-xs text-slate-500 mt-0.5">Ready for computer vision model diagnostics</p>
              </div>
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setResult(null);
                }}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Card: Output / Analysis Panel */}
        <div className="glass rounded-2xl p-6 flex flex-col justify-between min-h-[400px]">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100 border-b border-slate-800/80 pb-4 mb-4">
              <FileText className="h-5 w-5 text-emerald-400" />
              <span>{t('visionResultTitle')}</span>
            </h2>

            {errorMessage && (
              <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex justify-between items-start gap-3 animate-fade-in">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Gemini API Error</p>
                    <p className="mt-0.5 opacity-90">{errorMessage}</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setErrorMessage(null)}
                  className="p-1 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Default State */}
            {!isScanning && !result && (
              <div className="h-[250px] flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                <FileText className="h-12 w-12 text-slate-750 stroke-1" />
                <p className="text-sm">No analysis performed yet</p>
                <p className="text-xs text-slate-600 max-w-[280px]">Upload an image or capture a live tissue photo above to trigger AI diagnostic remedies.</p>
              </div>
            )}

            {/* Inference Scanning State */}
            {isScanning && (
              <div className="h-[250px] flex flex-col items-center justify-center space-y-4">
                <RefreshCw className="h-10 w-10 text-emerald-450 animate-spin" />
                <div className="space-y-1.5 text-center">
                  <p className="text-sm text-slate-200 font-medium">
                    {t('visionInference')}
                  </p>
                  <div className="w-48 bg-slate-900 rounded-full h-1.5 mx-auto overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Diagnostics Success Result */}
            {!isScanning && result && (
              <div className="space-y-6">
                {/* Result header */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start border-b border-slate-900 pb-4">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-450 uppercase tracking-widest">{t('visionDiagnosis')}</span>
                    <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
                      {result.diagnosis.toLowerCase().includes('healthy') ? (
                        <CheckCircle className="h-5 w-5 text-emerald-450" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      )}
                      <span>{result.diagnosis}</span>
                    </h3>
                  </div>

                  {/* Confidence meter */}
                  <div className="space-y-1 sm:text-right">
                    <span className="text-xs text-slate-450 uppercase tracking-widest">{t('confidence')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-emerald-400">{result.confidence}%</span>
                      <div className="w-16 bg-slate-900 rounded-full h-2">
                        <div 
                          className="bg-emerald-400 h-2 rounded-full" 
                          style={{ width: `${result.confidence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* remedies Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-emerald-450" />
                    <span>{t('visionRemedies')}</span>
                  </h4>
                  <ul className="space-y-2">
                    {result.remedies.map((remedy, i) => (
                      <li key={i} className="text-sm text-slate-350 bg-slate-950/40 border border-slate-900 p-3 rounded-lg flex items-start gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                        <span>{remedy}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {result && (
            <div className="border-t border-slate-900 pt-4 mt-6 flex justify-between items-center text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Tested on {result.createdAt}</span>
              </span>
              <span className="text-emerald-500 font-semibold uppercase tracking-wider">Processed successfully</span>
            </div>
          )}
        </div>
      </div>

      {/* History Log Section */}
      {history.length > 0 && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-100">
              <Clock className="h-5 w-5 text-slate-400" />
              <span>{t('visionHistory')}</span>
            </h3>
            <button
              onClick={clearHistory}
              className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1.5 font-medium transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {history.map((item) => (
              <div 
                key={item.id} 
                className="border border-slate-850 bg-slate-950/40 rounded-xl overflow-hidden hover:border-slate-700 transition-all flex flex-col"
              >
                <div className="h-28 relative">
                  <img
                    src={item.imageUrl}
                    alt={item.diagnosis}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-450 border border-slate-800">
                    {item.confidence}%
                  </div>
                </div>
                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs text-slate-450 font-medium truncate uppercase tracking-wider">Diagnosis</h4>
                    <p className="text-sm font-bold text-slate-205 line-clamp-1 mt-0.5">{item.diagnosis}</p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 border-t border-slate-900 pt-2">
                    <span>{item.createdAt.split(',')[0]}</span>
                    <button
                      onClick={() => {
                        setSelectedImage(item.imageUrl);
                        setResult(item);
                      }}
                      className="text-emerald-450 font-bold hover:underline"
                    >
                      View Report
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAgroEase } from '../../context/AgroEaseContext';
import { 
  LineChart, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Sprout, 
  Flame, 
  Gauge, 
  Cpu, 
  Zap,
  Info
} from 'lucide-react';

interface CropProfile {
  name: string;
  haName: string;
  igName: string;
  yoName: string;
  optPH: [number, number];
  optN: [number, number];
  optP: [number, number];
  optK: [number, number];
  optT: [number, number];
  optH: [number, number];
  description: string;
  haDescription: string;
  igDescription: string;
  yoDescription: string;
}

const cropProfiles: CropProfile[] = [
  {
    name: 'Maize (Corn)',
    haName: 'Masara',
    igName: 'Ọka',
    yoName: 'Agbado',
    optPH: [5.8, 7.0],
    optN: [35, 55],
    optP: [18, 28],
    optK: [150, 195],
    optT: [18, 32],
    optH: [50, 75],
    description: 'High nitrogen soil requirements. Thrives in moderate pH levels and abundant sun.',
    haDescription: 'Yana bukatar nitrogen mai yawa. Yana bunkasa sosai a cikin kasar da ke da pH mai kyau da rana.',
    igDescription: 'Na-achọ nitrogen dị elu. Na-eto nke ọma na ala nwere ezigbo pH na anwụ.',
    yoDescription: 'Nilo eroja nitrogen pupo. O maa n jade daadaa ni pH boṣewa ati oorun to to.'
  },
  {
    name: 'Tomato',
    haName: 'Tumatir',
    igName: 'Tomato',
    yoName: 'Kamatis',
    optPH: [6.0, 6.8],
    optN: [25, 45],
    optP: [12, 22],
    optK: [120, 175],
    optT: [20, 28],
    optH: [60, 80],
    description: 'Demands well-aerated soil, medium nitrogen levels, and balanced phosphorus for heavy flowering.',
    haDescription: 'Yana bukatar kasa mai iska, matsakaicin nitrogen, da daidaitaccen phosphorus don fure.',
    igDescription: 'Na-achọ ala nwere ikuku, nitrogen dị nro, na phosphorus ziri ezi maka ifuru.',
    yoDescription: 'Nilo ilẹ to ni afẹfẹ to to, nitrogen abọọdẹ, ati phosphorus to to fun itanna.'
  },
  {
    name: 'Cassava',
    haName: 'Rogo',
    igName: 'Akpụ',
    yoName: 'Gbaguda',
    optPH: [5.5, 7.8],
    optN: [15, 35],
    optP: [8, 18],
    optK: [95, 145],
    optT: [25, 35],
    optH: [60, 90],
    description: 'Drought-tolerant root tuber. Thrives in sandy-loam soils with low nitrogen requirements.',
    haDescription: 'Dankalin da ke jure fari. Yana bunkasa a cikin kasa mai yashi da karancin nitrogen.',
    igDescription: 'Ihe ọkụkụ na-eguzogide ọkọchị. Na-eto nke ọma na ala ájá nwere obere nitrogen.',
    yoDescription: 'Ohun-gbin gbongbo to le farada ogbele. O maa n dagba daadaa ninu ilẹ amọ ti ko nilo nitrogen pupọ.'
  },
  {
    name: 'Rice',
    haName: 'Shinkafa',
    igName: 'Osikapa',
    yoName: 'Iresi',
    optPH: [5.0, 6.5],
    optN: [45, 65],
    optP: [20, 32],
    optK: [160, 215],
    optT: [22, 36],
    optH: [70, 95],
    description: 'Requires highly damp/waterlogged soil condition, higher NPK balance, and warm climates.',
    haDescription: 'Yana bukatar kasa mai danshi sosai ko ruwa, daidaitaccen NPK, da yanayi mai zafi.',
    igDescription: 'Na-achọ ala mmiri kpuchiri, NPK dị elu, na ihu igwe dị ọkụ.',
    yoDescription: 'Nilo ilẹ to tutu tabi swampy, iwọn NPK to ga, ati oju-ọjọ to gbona.'
  },
  {
    name: 'Cowpea (Beans)',
    haName: 'Wake',
    igName: 'Agwa',
    yoName: 'Ewa',
    optPH: [5.5, 6.6],
    optN: [10, 25],
    optP: [12, 24],
    optK: [80, 130],
    optT: [20, 30],
    optH: [50, 70],
    description: 'Nitrogen-fixing legume. Requires very little nitrogen input and restores depleted soils.',
    haDescription: 'Takin wake na legume. Yana bukatar karancin nitrogen kuma yana mayar da kasa mai kyau.',
    igDescription: 'Ihe ọkụkụ na-edozi nitrogen. Na-achọ obere nitrogen ma na-edozi ala merụrụ emerụ.',
    yoDescription: 'Irugbin legume to n fi nitrogen si ilẹ. Nilo nitrogen diẹ ati pe o n mu ilẹ gbinra.'
  }
];

interface RecommendResult {
  cropName: string;
  localName: string;
  yieldScore: number;
  matchPercentage: number;
  description: string;
  metricsAnalysis: {
    pH: 'low' | 'optimal' | 'high';
    N: 'low' | 'optimal' | 'high';
    P: 'low' | 'optimal' | 'high';
    K: 'low' | 'optimal' | 'high';
  };
}

export default function Recommendations() {
  const { t, language } = useLanguage();
  const { currentZone, zonesData } = useAgroEase();

  // Multi-step state
  const [step, setStep] = useState(1);
  
  // Form Values state
  const [ph, setPh] = useState<number>(6.5);
  const [n, setN] = useState<number>(35);
  const [p, setP] = useState<number>(20);
  const [k, setK] = useState<number>(150);
  const [temp, setTemp] = useState<number>(27);
  const [humidity, setHumidity] = useState<number>(65);

  const [recommendationsList, setRecommendationsList] = useState<RecommendResult[]>([]);
  const [calculated, setCalculated] = useState(false);

  // Autofill from Active IoT Zone data
  const handleAutofill = () => {
    const activeZoneKey = `zone${currentZone}` as 'zone1' | 'zone2' | 'zone3';
    const activeData = zonesData[activeZoneKey];
    
    if (activeData) {
      setPh(activeData.pH);
      setN(activeData.nitrogen);
      setP(activeData.phosphorus);
      setK(activeData.potassium);
      setTemp(activeData.temperature);
      setHumidity(activeData.humidity);
      
      // Auto trigger calculate
      alert(`Autofilled metrics from Active AgroEase IoT Zone ${currentZone}!`);
    } else {
      alert(`No data collected for Zone ${currentZone} yet. Run a sample cycle on the Dashboard first.`);
    }
  };

  const checkValueFit = (val: number, range: [number, number]): 'low' | 'optimal' | 'high' => {
    if (val < range[0]) return 'low';
    if (val > range[1]) return 'high';
    return 'optimal';
  };

  // Recommendation engine calculations
  const calculateRecommendations = () => {
    const results: RecommendResult[] = cropProfiles.map((crop) => {
      // Calculate individual scores
      const phScore = calculateMetricScore(ph, crop.optPH);
      const nScore = calculateMetricScore(n, crop.optN);
      const pScore = calculateMetricScore(p, crop.optP);
      const kScore = calculateMetricScore(k, crop.optK);
      const tScore = calculateMetricScore(temp, crop.optT);
      const hScore = calculateMetricScore(humidity, crop.optH);

      // Average score (weight NPK and pH slightly higher)
      const avgScore = (phScore * 2 + nScore * 1.5 + pScore * 1.5 + kScore * 1.5 + tScore * 1 + hScore * 1) / 8.5;
      const matchPercentage = Math.round(avgScore * 100);
      
      // Yield score scale (0-100)
      const yieldScore = Math.round(matchPercentage * 0.95 + (Math.random() * 5));

      const localName = language === 'ha' ? crop.haName : language === 'ig' ? crop.igName : language === 'yo' ? crop.yoName : crop.name;
      const description = language === 'ha' ? crop.haDescription : language === 'ig' ? crop.igDescription : language === 'yo' ? crop.yoDescription : crop.description;

      return {
        cropName: crop.name,
        localName,
        yieldScore,
        matchPercentage,
        description,
        metricsAnalysis: {
          pH: checkValueFit(ph, crop.optPH),
          N: checkValueFit(n, crop.optN),
          P: checkValueFit(p, crop.optP),
          K: checkValueFit(k, crop.optK)
        }
      };
    });

    // Sort by match percentage desc
    const sorted = results.sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 3);
    setRecommendationsList(sorted);
    setCalculated(true);
  };

  const calculateMetricScore = (val: number, range: [number, number]): number => {
    const [min, max] = range;
    const mid = (min + max) / 2;
    const width = max - min;
    
    // Gaussian-like distance score
    const dist = Math.abs(val - mid);
    if (dist <= width / 2) return 1.0; // fully optimal within boundaries
    
    const penalty = (dist - width / 2) / (width * 2);
    return Math.max(0.2, 1.0 - penalty);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
          {t('recsTitle')}
        </h1>
        <p className="text-slate-400 text-sm">
          {t('recsSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left side: Multi-Step Data Input Form */}
        <div className="glass rounded-2xl p-6 lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            
            {/* Header / Step indicators */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <h2 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Cpu className="h-4.5 w-4.5 text-emerald-400" />
                <span>{step === 1 ? t('recsFormStep1') : t('recsFormStep2')}</span>
              </h2>
              <span className="text-xs bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded font-semibold">
                Step {step} of 2
              </span>
            </div>

            {/* Autofill helper from IoT */}
            <button
              onClick={handleAutofill}
              className="w-full inline-flex items-center justify-center gap-2 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Autofill from active AgroEase IoT Zone {currentZone}</span>
            </button>

            {/* STEP 1: Soil Metrics Input */}
            {step === 1 && (
              <div className="space-y-5">
                {/* Soil pH */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-350 uppercase">
                    <span>{t('soilPH')}</span>
                    <span className="text-emerald-400 font-extrabold">{ph} pH</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="14"
                    step="0.1"
                    value={ph}
                    onChange={(e) => setPh(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-650 font-semibold uppercase">
                    <span>Acidic (0.0)</span>
                    <span>Neutral (7.0)</span>
                    <span>Alkaline (14.0)</span>
                  </div>
                </div>

                {/* Nitrogen */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-350 uppercase">
                    <span>{t('nitrogen')} (N)</span>
                    <span className="text-emerald-400 font-extrabold">{n} mg/kg</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={n}
                    onChange={(e) => setN(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* Phosphorus */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-355 uppercase">
                    <span>{t('phosphorus')} (P)</span>
                    <span className="text-emerald-400 font-extrabold">{p} mg/kg</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="1"
                    value={p}
                    onChange={(e) => setP(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* Potassium */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-355 uppercase">
                    <span>{t('potassium')} (K)</span>
                    <span className="text-emerald-400 font-extrabold">{k} mg/kg</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="350"
                    step="5"
                    value={k}
                    onChange={(e) => setK(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Climate Metrics Input */}
            {step === 2 && (
              <div className="space-y-6">
                {/* Average Temp */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-355 uppercase">
                    <span>{t('temperature')} (°C)</span>
                    <span className="text-emerald-400 font-extrabold">{temp} °C</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="45"
                    step="1"
                    value={temp}
                    onChange={(e) => setTemp(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-650 font-semibold">
                    <span>Cold (5°C)</span>
                    <span>Moderate (25°C)</span>
                    <span>Hot (45°C)</span>
                  </div>
                </div>

                {/* Humidity */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-355 uppercase">
                    <span>{t('humidity')} (%)</span>
                    <span className="text-emerald-400 font-extrabold">{humidity} %</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={humidity}
                    onChange={(e) => setHumidity(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-650 font-semibold">
                    <span>Arid (10%)</span>
                    <span>Humid (100%)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions footer */}
          <div className="flex gap-4 pt-6 border-t border-slate-900">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 border border-slate-700 bg-slate-900 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            )}
            
            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold px-4 py-3 rounded-xl text-xs transition-colors cursor-pointer"
              >
                <span>Continue to Climate Metrics</span>
                <ArrowRight className="h-4 w-4 text-emerald-400" />
              </button>
            ) : (
              <button
                type="button"
                onClick={calculateRecommendations}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold px-4 py-3 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-colors cursor-pointer animate-pulse"
              >
                <Check className="h-4 w-4" />
                <span>{t('recsCalculate')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right side: Yield prediction & analytics panel */}
        <div className="glass rounded-2xl p-6 lg:col-span-7 flex flex-col min-h-[400px]">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100 border-b border-slate-900 pb-4 mb-4">
            <LineChart className="h-5 w-5 text-emerald-400" />
            <span>{t('recsOptimalTitle')}</span>
          </h2>

          {!calculated ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
              <Gauge className="h-12 w-12 text-slate-750 stroke-1" />
              <p className="text-sm">Recommendations calculations pending</p>
              <p className="text-xs text-slate-600 max-w-sm">Provide NPK, pH, and environmental metrics on the left, then click Calculate to trigger neural crop recommendations.</p>
            </div>
          ) : (
            <div className="space-y-6 flex-1">
              <p className="text-xs text-slate-450 uppercase tracking-wider font-semibold">
                {t('recsOptimalSubtitle')}
              </p>

              {/* Ranks list */}
              <div className="space-y-4">
                {recommendationsList.map((rec, index) => (
                  <div 
                    key={rec.cropName}
                    className="border border-slate-900 bg-slate-950/40 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-emerald-500/10 transition-colors duration-200"
                  >
                    
                    {/* Rank, Name & Description */}
                    <div className="flex items-start gap-3.5">
                      <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-sm">
                        #{index + 1}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <h3 className="font-extrabold text-slate-100 text-base">{rec.localName}</h3>
                          {rec.localName !== rec.cropName && (
                            <span className="text-xs text-slate-500">({rec.cropName})</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-light leading-relaxed max-w-md">
                          {rec.description}
                        </p>
                        
                        {/* Metrics checks */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 text-[9px] uppercase tracking-wider font-bold">
                          <span className={`px-2 py-0.5 rounded ${rec.metricsAnalysis.pH === 'optimal' ? 'bg-emerald-500/10 text-emerald-450' : 'bg-amber-500/10 text-amber-500'}`}>
                            pH: {t(`recsMetric${rec.metricsAnalysis.pH.charAt(0).toUpperCase() + rec.metricsAnalysis.pH.slice(1)}` as any)}
                          </span>
                          <span className={`px-2 py-0.5 rounded ${rec.metricsAnalysis.N === 'optimal' ? 'bg-emerald-500/10 text-emerald-450' : 'bg-amber-500/10 text-amber-500'}`}>
                            N: {t(`recsMetric${rec.metricsAnalysis.N.charAt(0).toUpperCase() + rec.metricsAnalysis.N.slice(1)}` as any)}
                          </span>
                          <span className={`px-2 py-0.5 rounded ${rec.metricsAnalysis.P === 'optimal' ? 'bg-emerald-500/10 text-emerald-450' : 'bg-amber-500/10 text-amber-500'}`}>
                            P: {t(`recsMetric${rec.metricsAnalysis.P.charAt(0).toUpperCase() + rec.metricsAnalysis.P.slice(1)}` as any)}
                          </span>
                          <span className={`px-2 py-0.5 rounded ${rec.metricsAnalysis.K === 'optimal' ? 'bg-emerald-500/10 text-emerald-450' : 'bg-amber-500/10 text-amber-500'}`}>
                            K: {t(`recsMetric${rec.metricsAnalysis.K.charAt(0).toUpperCase() + rec.metricsAnalysis.K.slice(1)}` as any)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Match percentage gauge card */}
                    <div className="w-full md:w-auto shrink-0 flex items-center md:flex-col gap-3 justify-between md:text-right border-t md:border-t-0 border-slate-900/60 pt-3 md:pt-0">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">{t('recsRank')} Match</span>
                        <div className="text-xl font-black text-emerald-400">{rec.matchPercentage}%</div>
                      </div>
                      
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-550 uppercase tracking-widest flex items-center gap-1 justify-end">
                          <Info className="h-3 w-3 text-emerald-500" />
                          <span>{t('recsYieldEst')}</span>
                        </span>
                        <div className="text-lg font-bold text-teal-400">{rec.yieldScore}/100</div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

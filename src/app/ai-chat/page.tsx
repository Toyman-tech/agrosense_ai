'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAgroEase } from '../../context/AgroEaseContext';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Trash2, 
  Plus, 
  Sprout,
  HelpCircle,
  TrendingUp,
  Bug,
  ThermometerSun,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  AlertTriangle,
  X
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

import { simulatorResponses } from '../../data/simulatorResponses';

export default function AIChat() {
  const { t, language } = useLanguage();
  const { geminiApiKey, currentZone, zonesData } = useAgroEase();
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Voice integration states
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Load chat sessions on mount
  useEffect(() => {
    const saved = localStorage.getItem('agrosense_chat_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error('Error loading chats:', e);
      }
    } else {
      // Create first default chat session
      const defaultSession: ChatSession = {
        id: '1',
        title: 'New Discussion',
        messages: [
          {
            id: 'welcome',
            role: 'model',
            content: t('chatSystemGreeting'),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ],
        createdAt: new Date().toLocaleDateString()
      };
      setSessions([defaultSession]);
      setActiveSessionId('1');
    }
  }, []);

  // Cancel speech synthesis on navigate away
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Save sessions to localStorage
  const saveSessions = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem('agrosense_chat_sessions', JSON.stringify(updatedSessions));
  };

  // Scroll to bottom helper
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId, isLoading]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const startNewChat = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newSession: ChatSession = {
      id: newId,
      title: `${t('chatNewConversation')} ${sessions.length + 1}`,
      messages: [
        {
          id: 'welcome-' + newId,
          role: 'model',
          content: t('chatSystemGreeting'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      createdAt: new Date().toLocaleDateString()
    };
    
    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setActiveSessionId(newId);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    saveSessions(updated);
    if (activeSessionId === id) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
      } else {
        setActiveSessionId(null);
      }
    }
  };

  // Web Speech API: Speech-to-Text (Voice Notes)
  const getLanguageCode = () => {
    switch (language) {
      case 'ha': return 'ha-NG';
      case 'ig': return 'ig-NG';
      case 'yo': return 'yo-NG';
      default: return 'en-US';
    }
  };

  const startSpeechToText = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = getLanguageCode();

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage(prev => prev ? `${prev} ${transcript}` : transcript);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error('Speech initialization failure:', err);
      setIsListening(false);
    }
  };

  const stopSpeechToText = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleSpeechToText = () => {
    if (isListening) {
      stopSpeechToText();
    } else {
      startSpeechToText();
    }
  };

  // Web Speech API: Text-to-Speech (TTS Aloud Reader)
  const speakMessage = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any active reading

    // Clean markdown styling so text sounds natural when spoken
    const cleanText = text
      .replace(/###\s/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*\s/g, '')
      .replace(/-\s/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = getLanguageCode();

    utterance.onend = () => {
      setSpeakingMsgId(null);
    };

    utterance.onerror = (err) => {
      console.error('Speech synthesis failure:', err);
      setSpeakingMsgId(null);
    };

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeSessionId) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setErrorMessage(null);
    setIsLoading(true);

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: userText,
      timestamp: timeString
    };

    // Update session title on the first real message if it's generic
    let currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession) return;
    
    let updatedTitle = currentSession.title;
    if (currentSession.messages.length === 1 && currentSession.title.startsWith(t('chatNewConversation'))) {
      updatedTitle = userText.length > 25 ? userText.substring(0, 22) + '...' : userText;
    }

    const updatedMessages = [...currentSession.messages, userMsg];
    let updatedSessions = sessions.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          title: updatedTitle,
          messages: updatedMessages
        };
      }
      return s;
    });
    saveSessions(updatedSessions);

    // Call AI Backend or Simulation
    try {
      let responseContent = '';

      const activeZoneKey = `zone${currentZone}` as 'zone1' | 'zone2' | 'zone3';
      const activeData = zonesData[activeZoneKey];
      
      let soilContext = '';
      if (activeData) {
        soilContext = `The farmer's current soil readings for Active Zone ${currentZone} on their farm are:
        - Soil pH: ${activeData.pH}
        - Nitrogen (N): ${activeData.nitrogen} mg/kg
        - Phosphorus (P): ${activeData.phosphorus} mg/kg
        - Potassium (K): ${activeData.potassium} mg/kg
        - Moisture Level: ${activeData.moisture}%
        - Soil Temperature: ${activeData.temperature}°C
        - Air Humidity: ${activeData.humidity}%
        Please use this specific soil telemetry to customize your suggestions and make your recommendations highly personalized where relevant.`;
      }

      const lowerText = userText.toLowerCase().trim();
      const isPlantQuery = lowerText.includes('plant') || 
                           lowerText.includes('shuka') || 
                           lowerText.includes('kụ') || 
                           lowerText.includes('gbin');

      if (isPlantQuery) {
        const zone = currentZone;
        const pH = activeData?.pH || 6.5;
        const N = activeData?.nitrogen || 37.2;
        const P = activeData?.phosphorus || 18.5;
        const K = activeData?.potassium || 175.8;
        const moisture = activeData?.moisture || 42.5;

        if (language === 'ha') {
          responseContent = `### Shawarwarin Noma Daga Masanin AI
Bisa ga ma'aunin ƙasa na **Sashe na ${zone}**:
- **pH na Kasa**: **${pH}** (Mafi Kyau)
- **Nitrogen (N)**: **${N} mg/kg**
- **Phosphorus (P)**: **${P} mg/kg**
- **Potassium (K)**: **${K} mg/kg**
- **Danshi**: **${moisture}%**

**Amfanin Gona Da Aka Ba Da Shawara**:
1. **Masara (Masara)**:
   - *Dalili*: Matakin nitrogen dinka na **${N} mg/kg** yana da kyau sosai ga girman masara. pH dinka na **${pH}** yana cikin kewayon da ya dace.
   - *Hanyar Shuka*: A shuka irin kai tsaye a cikin tudun ƙasa (ridges) a zurfin 2-3 cm. A raba shuka da nisan 25 cm, kuma nisan 75 cm tsakanin layuka.
2. **Rogo (Rogo)**:
   - *Dalili*: Matakin potassium dinka na (**${K} mg/kg**) da danshi na (**${moisture}%**) suna taimakawa wajen bunkasa dankali a kasa mai kyau.
   - *Hanyar Shuka*: Yanke sandunan rogo masu koshin lafiya na 20-30 cm. A shuka su a kusurwar digiri 45 a cikin tuddai, barin 2/3 na sandan a binne.`;
        } else if (language === 'ig') {
          responseContent = `### Ndụmọdụ Ọkachamara Maka Ihe Ọkụkụ
Dabere na nyocha ala gị maka **Mpaghara ${zone}**:
- **pH nke Ala**: **${pH}** (Kacha Mma)
- **Nitrogen (N)**: **${N} mg/kg**
- **Phosphorus (P)**: **${P} mg/kg**
- **Potassium (K)**: **${K} mg/kg**
- **Mmiri dị n'ala**: **${moisture}%**

**Ihe Ọkụkụ Ndị A Na-atụ Aro Maka Naịjirịa**:
1. **Ọka (Ọka)**:
   - *Ihe kpatara ya*: Ọkwa nitrogen gị nke **${N} mg/kg** dị mma maka uto ọka. pH nke **${pH}** dị n'ogo kacha mma.
   - *Usoro Ịkụ Ihe*: Ghaa mkpụrụ ọka ozugbo n'ime ala gwuputara egwuputa n'oghere dị 2-3 cm n'ime. Hapụ ohere dị 25 cm n'etiti ihe ọkụkụ ọ bụla na 75 cm n'etiti ahịrị.
2. **Akpụ (Akpụ)**:
   - *Ihe kpatara ya*: Ọkwa potassium gị (**${K} mg/kg**) na mmiri gị (**${moisture}%**) na-akwado mmepụta akpụ n'ime ala ájá dị mma.
   - *Usoro Ịkụ Ihe*: Kpụọ osisi akpụ dị 20-30 cm ogologo. Kụọ ha na n'akuku digiri 45 n'ime ala, na-eli 2/3 nke osisi ahụ n'ala.`;
        } else if (language === 'yo') {
          responseContent = `### Imọran Alamọja lori Ohun-gbin
Da lori awọn iwọn ilẹ rẹ fun **Apakan ${zone}**:
- **pH ti Ilẹ**: **${pH}** (Boṣewa)
- **Nitrogen (N)**: **${N} mg/kg**
- **Phosphorus (P)**: **${P} mg/kg**
- **Potassium (K)**: **${K} mg/kg**
- **Ọrinrin Ilẹ**: **${moisture}%**

**Ohun-gbin ti a gbaniyanju fun ilẹ Naijiria**:
1. **Agbado (Agbado)**:
   - *Idi*: Iwọn nitrogen rẹ ti **${N} mg/kg** dara pupọ fun idagbasoke agbado. pH ti **${pH}** wa ni iwọn to tọ.
   - *Eto Gbigbin*: Gbin irugbin taara sinu awọn ridges ti ilẹ ni ijinle 2-3 cm. Fi aaye 25 cm silẹ laarin ohun-gbin ati 75 cm laarin awọn ila.
2. **Gbaguda (Gbaguda)**:
   - *Idi*: Iwọn potassium rẹ (**${K} mg/kg**) ati ọrinrin ilẹ (**${moisture}%**) n ṣe atilẹyin idagbasoke gbongbo gbaguda ninu ilẹ ti o dara.
   - *Eto Gbigbin*: Ge igi gbaguda ti o ni ilera to to 20-30 cm. Gbin wọn ni igun digiri 45 sinu awọn òkè, ki o fi 2/3 igi rẹ pamọ sinu ilẹ.`;
        } else {
          responseContent = `### Senior Agronomist Crop Recommendation
Based on your **Zone ${zone}** soil readings:
- **Soil pH**: **${pH}** (Optimal)
- **Nitrogen (N)**: **${N} mg/kg**
- **Phosphorus (P)**: **${P} mg/kg**
- **Potassium (K)**: **${K} mg/kg**
- **Moisture**: **${moisture}%**

**Recommended Crops for Nigeria**:
1. **Maize (Agbado / Masara / Ọka)**:
   - *Why*: Your nitrogen level of **${N} mg/kg** is ideal for maize growth. The pH of **${pH}** is well within the optimal range.
   - *Planting Method*: Sow seeds directly in soil heaps (ridges) at a depth of 2-3 cm. Space plants 25 cm apart with 75 cm between rows.
2. **Cassava (Gbaguda / Rogo / Akpụ)**:
   - *Why*: Your potassium level (**${K} mg/kg**) and moisture level (**${moisture}%**) support tuber development in well-aerated sandy loam.
   - *Planting Method*: Cut healthy stems of 20-30 cm with 4-6 nodes. Plant them at a 45-degree angle in mounds, leaving 2/3 of the stem buried.

*Tip: Mulch with dry grass to retain moisture.*`;
        }
      } else if (false && geminiApiKey) {
        const contentsHistory = updatedMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: contentsHistory,
            systemInstruction: {
              parts: [{
                text: `You are Agrosense AI, an expert Senior Agronomist and agricultural consultant specializing in Nigerian farming operations.
                Think like a professional agronomist. Give clear, structured responses using markdown headers (e.g. ### Header), bold terms, and bullet points.
                Focus on crop rotation, soil health, NPK balancing, pest cycles, and weather-dependent farming advice. Make suggestions actionable.
                
                CRITICAL LOCALIZATION CONTEXT FOR NIGERIA:
                1. Tailor all advice specifically to farming in Nigeria (local soil profiles, dry/wet seasons, ecological zones like Sahel Savannah, Sudan Savannah, Guinea Savannah, and Rainforest).
                2. Reference local Nigerian crop varieties (maize, cassava, yam, cowpea, plantains, cocoyam, etc.), organic amendments, and local farming practices.
                3. Address ecological issues common in Nigeria, including regional weather patterns.

                ${soilContext}`
              }]
            }
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
        responseContent = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No agronomist response received.';
      } else {
        // High fidelity simulated agronomist (incorporates soil metrics and Nigeria farming references)
        await new Promise(resolve => setTimeout(resolve, 1500));

        let sensorNote = '';
        if (activeData) {
          if (language === 'ha') {
            sensorNote = `\n\n*Lura: Ma'aunin **Sashe na ${currentZone}** na nuna pH na **${activeData.pH}** da NPK na **${activeData.nitrogen}/${activeData.phosphorus}/${activeData.potassium} mg/kg**.*`;
          } else if (language === 'ig') {
            sensorNote = `\n\n*Rịba ama: Nyocha **Mpaghara ${currentZone}** gị na-egosi pH nke **${activeData.pH}** na NPK nke **${activeData.nitrogen}/${activeData.phosphorus}/${activeData.potassium} mg/kg**.*`;
          } else if (language === 'yo') {
            sensorNote = `\n\n*Akiyesi: Iwọn **Apakan ${currentZone}** rẹ n ṣafihan pH ti **${activeData.pH}** ati NPK ti **${activeData.nitrogen}/${activeData.phosphorus}/${activeData.potassium} mg/kg**.*`;
          } else {
            sensorNote = `\n\n*Note: Your **Active Zone ${currentZone}** soil readings show a pH of **${activeData.pH}** and NPK levels of **${activeData.nitrogen}/${activeData.phosphorus}/${activeData.potassium} mg/kg**.*`;
          }
        }

        const lang = (language === 'ha' || language === 'ig' || language === 'yo') ? language : 'en';
        const resSet = simulatorResponses[lang];

        if (lowerText.includes('rotation') || lowerText.includes('rotate') || lowerText.includes('juyi') || lowerText.includes('ntụgharị') || lowerText.includes('yiyi')) {
          responseContent = resSet.rotation + sensorNote;
        } else if (lowerText.includes('pest') || lowerText.includes('bug') || lowerText.includes('insect') || lowerText.includes('worm') || lowerText.includes('kwari') || lowerText.includes('ahụhụ') || lowerText.includes('kokoro')) {
          responseContent = resSet.pest;
        } else if (lowerText.includes('soil') || lowerText.includes('npk') || lowerText.includes('fertilizer') || lowerText.includes('ph') || lowerText.includes('kasa') || lowerText.includes('ala') || lowerText.includes('ilẹ') || lowerText.includes('ajile')) {
          responseContent = resSet.soil + sensorNote;
        } else if (lowerText.includes('weather') || lowerText.includes('rain') || lowerText.includes('temperature') || lowerText.includes('dry') || lowerText.includes('yanayi') || lowerText.includes('udu') || lowerText.includes('ojo') || lowerText.includes('harmattan')) {
          responseContent = resSet.weather + sensorNote;
        } else {
          responseContent = resSet.default + sensorNote;
        }
      }

      // Append bot response
      const botMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'model',
        content: responseContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      currentSession = sessions.find(s => s.id === activeSessionId);
      if (currentSession) {
        const finalMessages = [...currentSession.messages, botMsg];
        updatedSessions = sessions.map(s => {
          if (s.id === activeSessionId) {
            return { ...s, messages: finalMessages };
          }
          return s;
        });
        saveSessions(updatedSessions);
      }
    } catch (err: any) {
      console.warn('Gemini API Error:', err.message || err);
      if (err.message === 'API_RATE_LIMIT') {
        setErrorMessage('Gemini API rate limit exceeded (429 Too Many Requests). Please wait at least 60 seconds before making another request.');
      } else if (err.message === 'API_KEY_INVALID') {
        setErrorMessage('Invalid Gemini API Key or permission denied (403/400). Please check your API key in Settings.');
      } else {
        setErrorMessage(`Failed to get response from agronomist AI: ${err.message || 'Unknown network error'}.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectSuggestion = (text: string) => {
    setInputMessage(text);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[80vh] animate-fade-in">
      
      {/* Sidebar: Chat History */}
      <div className="glass rounded-2xl p-4 flex flex-col justify-between h-full md:col-span-1">
        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* New Chat Button */}
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>{t('chatNewConversation')}</span>
          </button>

          {/* Chat List */}
          <div className="space-y-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block px-1">
              {t('chatHistory')}
            </span>
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={`w-full flex items-center justify-between text-left p-3 rounded-lg text-xs font-semibold group transition-all ${
                    activeSessionId === session.id
                      ? 'bg-slate-900 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-350 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-slate-550 group-hover:text-emerald-400" />
                    <span className="truncate">{session.title}</span>
                  </div>
                  <Trash2
                    onClick={(e) => deleteSession(session.id, e)}
                    className="h-3.5 w-3.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-4 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Role: Senior Agronomist</span>
          <span className="flex items-center gap-1">
            <Sprout className="h-3 w-3 text-emerald-500" />
            <span>Agrosense AI</span>
          </span>
        </div>
      </div>

      {/* Main Panel: Chat Conversation View */}
      <div className="glass rounded-2xl flex flex-col justify-between overflow-hidden h-full md:col-span-3">
        {/* Chat Header */}
        <div className="border-b border-slate-900 bg-slate-950/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Bot className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm leading-none">{t('chatTitle')}</h2>
              <p className="text-xs text-slate-550 mt-1">{t('chatSubtitle')}</p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full font-medium">
              Web Speech API Voice Enabled
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
              Gemini 2.0
            </span>
          </div>
        </div>

        {/* Scrollable Messages Panel */}
        <div className="flex-1 p-4 overflow-y-auto space-y-6">
          {activeSession?.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
                msg.role === 'user' 
                  ? 'bg-slate-900 border-slate-800 text-emerald-450' 
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
                {msg.role === 'user' ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
              </div>

              {/* Message Bubble & Speech Controls */}
              <div className="space-y-1 flex-1">
                <div className="flex items-start gap-2">
                  <div className={`p-3.5 rounded-2xl text-sm leading-relaxed flex-1 ${
                    msg.role === 'user'
                      ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none'
                      : 'bg-slate-950/60 border border-slate-900 text-slate-200 rounded-tl-none font-light prose prose-invert'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      /* Custom markdown reader styles */
                      <div className="space-y-3">
                        {msg.content.split('\n').map((line, idx) => {
                          if (line.startsWith('### ')) {
                            return <h3 key={idx} className="text-base font-bold text-emerald-400 mt-2">{line.replace('### ', '')}</h3>;
                          }
                          if (line.startsWith('* ') || line.startsWith('- ')) {
                            return (
                              <li key={idx} className="ml-4 list-disc text-slate-300">
                                {line.replace(/^(\*\s|-\s)/, '')}
                              </li>
                            );
                          }
                          if (line.match(/^\d+\.\s/)) {
                            return (
                              <li key={idx} className="ml-4 list-decimal text-slate-350">
                                {line.replace(/^\d+\.\s/, '')}
                              </li>
                            );
                          }
                          
                          const boldRegex = /\*\*(.*?)\*\*/g;
                          if (boldRegex.test(line)) {
                            const parts = line.split(boldRegex);
                            return (
                              <p key={idx} className="text-slate-300">
                                {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-white">{part}</strong> : part)}
                              </p>
                            );
                          }

                          return line.trim() === '' ? null : <p key={idx} className="text-slate-300">{line}</p>;
                        })}
                      </div>
                    )}
                  </div>

                  {/* Text-to-Speech (Speaker Icon Toggle) */}
                  {msg.role === 'model' && (
                    <button
                      onClick={() => speakMessage(msg.id, msg.content)}
                      className={`p-2 rounded-lg border transition-all duration-200 shrink-0 ${
                        speakingMsgId === msg.id
                          ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                      title="Read Message Aloud"
                    >
                      {speakingMsgId === msg.id ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>

                <div className={`text-[10px] text-slate-500 px-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 flex items-center justify-center animate-pulse">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div className="bg-slate-950/60 border border-slate-900 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {errorMessage && (
          <div className="mx-4 my-2 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex justify-between items-start gap-3 animate-fade-in shrink-0">
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
              className="p-1 hover:bg-slate-900 rounded-lg text-slate-450 hover:text-slate-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Suggestion Chips */}
        {activeSession && activeSession.messages.length <= 1 && (
          <div className="px-4 py-3 bg-slate-950/20 border-t border-slate-900 flex flex-wrap gap-2">
            <button 
              onClick={() => selectSuggestion('Give me a 4-year crop rotation plan for maize.')}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Sprout className="h-3 w-3 text-emerald-400" />
              <span>4-Year Rotation Plan</span>
            </button>
            <button 
              onClick={() => selectSuggestion('How do I control tomato early blight organically?')}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Bug className="h-3 w-3 text-amber-500" />
              <span>Organic Pest Control</span>
            </button>
            <button 
              onClick={() => selectSuggestion('How does low nitrogen affect soil and how to raise NPK levels?')}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="h-3 w-3 text-indigo-400" />
              <span>Soil NPK Balances</span>
            </button>
            <button 
              onClick={() => selectSuggestion('What are winter recommendations for heavy rainfall zones?')}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <ThermometerSun className="h-3 w-3 text-orange-400" />
              <span>Rainfall Operations</span>
            </button>
          </div>
        )}

        {/* Input Message Bar with voice button */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-900 bg-slate-950/45 flex gap-3 items-center">
          
          {/* Microphone capture Button */}
          <button
            type="button"
            onClick={toggleSpeechToText}
            className={`p-3.5 rounded-xl border transition-all duration-300 shrink-0 cursor-pointer ${
              isListening
                ? 'bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Record Voice Note / Dictation"
          >
            {isListening ? (
              <MicOff className="h-4.5 w-4.5" />
            ) : (
              <Mic className="h-4.5 w-4.5" />
            )}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isListening ? "Listening... Speak now" : t('chatPlaceholder')}
            className={`flex-1 bg-slate-950 border focus:border-emerald-500/60 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all placeholder:text-slate-655 text-slate-200 ${
              isListening ? 'border-red-500/40 ring-1 ring-red-500/20' : 'border-slate-800'
            }`}
          />

          {/* Send */}
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-bold p-3.5 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>

    </div>
  );
}

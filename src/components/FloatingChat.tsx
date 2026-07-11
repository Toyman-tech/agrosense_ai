'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAgroEase } from '../context/AgroEaseContext';
import { simulatorResponses } from '../data/simulatorResponses';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  X, 
  Sprout,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  AlertTriangle,
  Bug,
  HelpCircle,
  ThermometerSun
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export const FloatingChat: React.FC = () => {
  const { t, language } = useLanguage();
  const { currentZone, zonesData } = useAgroEase();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Voice integration states
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize welcome message when opened for the first time
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          content: t('chatSystemGreeting'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [isOpen, messages.length, t]);

  // Scroll to bottom helper
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Cancel speech synthesis on navigate/close
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getLanguageCode = () => {
    switch (language) {
      case 'ha': return 'ha-NG';
      case 'ig': return 'ig-NG';
      case 'yo': return 'yo-NG';
      default: return 'en-US';
    }
  };

  // Speech-to-Text dictation
  const toggleSpeechToText = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
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

  // Text-to-Speech reader
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

    window.speechSynthesis.cancel();

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
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: userText,
      timestamp: timeString
    };

    setMessages(prev => [...prev, userMsg]);

    // Local simulation response with telemetry binding
    setTimeout(() => {
      const activeZoneKey = `zone${currentZone}` as 'zone1' | 'zone2' | 'zone3';
      const activeData = zonesData[activeZoneKey];

      const lowerText = userText.toLowerCase().trim();
      const isPlantQuery = lowerText.includes('plant') || 
                           lowerText.includes('shuka') || 
                           lowerText.includes('kụ') || 
                           lowerText.includes('gbin');

      let responseContent = '';

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
      } else {
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

      const botMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'model',
        content: responseContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
      setIsLoading(false);
    }, 1500);
  };

  const selectSuggestion = (text: string) => {
    setInputMessage(text);
  };

  return (
    <>
      {/* Floating Bubble Button Fixed at Bottom-Right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
        title="Consult AI Agronomist"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6 animate-pulse" />}
      </button>

      {/* Floating Chat Box Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[520px] rounded-2xl border border-emerald-500/20 bg-slate-950/95 backdrop-blur-xl shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-up">
          
          {/* Widget Header */}
          <div className="bg-slate-900/60 border-b border-slate-900 p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <Bot className="h-4.5 w-4.5 text-emerald-450" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-100 leading-tight">Agrosense AI Chat</h3>
                <span className="text-[10px] text-emerald-400 font-medium">Nigerian Agronomist Advisor (Offline)</span>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-200 transition-colors p-1"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Message List Panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 border ${
                  msg.role === 'user'
                    ? 'bg-slate-900 border-slate-800 text-emerald-400'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450'
                }`}>
                  {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>

                {/* Bubble Content */}
                <div className="space-y-1 flex-1">
                  <div className="flex items-start gap-1">
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed flex-1 ${
                      msg.role === 'user'
                        ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none'
                        : 'bg-slate-900/60 border border-slate-850 text-slate-250 rounded-tl-none font-light'
                    }`}>
                      {msg.role === 'user' ? (
                        msg.content
                      ) : (
                        <div className="space-y-2">
                          {msg.content.split('\n').map((line, idx) => {
                            if (line.startsWith('### ')) {
                              return <h4 key={idx} className="text-xs font-bold text-emerald-400 mt-1">{line.replace('### ', '')}</h4>;
                            }
                            if (line.startsWith('* ') || line.startsWith('- ')) {
                              return (
                                <li key={idx} className="ml-3 list-disc text-slate-300">
                                  {line.replace(/^(\*\s|-\s)/, '')}
                                </li>
                              );
                            }
                            if (line.match(/^\d+\.\s/)) {
                              return (
                                <li key={idx} className="ml-3 list-decimal text-slate-350">
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

                    {msg.role === 'model' && (
                      <button
                        onClick={() => speakMessage(msg.id, msg.content)}
                        className={`p-1.5 rounded-lg border transition-all shrink-0 ${
                          speakingMsgId === msg.id
                            ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                            : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Read aloud"
                      >
                        {speakingMsgId === msg.id ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                  <div className={`text-[9px] text-slate-650 px-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 max-w-[80%]">
                <div className="h-7 w-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 flex items-center justify-center animate-pulse">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="bg-slate-900/60 border border-slate-850 px-3 py-2 rounded-2xl rounded-tl-none flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 bg-slate-900/20 border-t border-slate-900 flex flex-wrap gap-1.5 shrink-0">
              <button
                onClick={() => selectSuggestion(language === 'ha' ? 'Me zan iya shuka?' : language === 'ig' ? 'Gịnị ka m nwere ike ịkụ?' : language === 'yo' ? 'Kini mo le gbin?' : 'What can I plant?')}
                className="text-[10px] bg-slate-900 hover:bg-slate-850 text-slate-350 border border-slate-850 px-2 py-1 rounded-lg flex items-center gap-1 transition-all"
              >
                <Sprout className="h-3 w-3 text-emerald-400" />
                <span>{language === 'ha' ? 'Me zan iya shuka?' : language === 'ig' ? 'M nwere ike ịkụ?' : language === 'yo' ? 'Kini mo le gbin?' : 'What can I plant?'}</span>
              </button>
              <button
                onClick={() => selectSuggestion(language === 'ha' ? 'Yaya ake magance kwari?' : language === 'ig' ? 'Otu esi egbu ụmụ ahụhụ?' : language === 'yo' ? 'Iṣakoso kokoro oko?' : 'How to manage pests?')}
                className="text-[10px] bg-slate-900 hover:bg-slate-850 text-slate-355 border border-slate-850 px-2 py-1 rounded-lg flex items-center gap-1 transition-all"
              >
                <Bug className="h-3 w-3 text-amber-500" />
                <span>{language === 'ha' ? 'Kwari' : language === 'ig' ? 'Ụmụ ahụhụ' : language === 'yo' ? 'Kokoro oko' : 'Pests control'}</span>
              </button>
            </div>
          )}

          {/* Message Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-900 bg-slate-950 flex gap-2 items-center shrink-0">
            <button
              type="button"
              onClick={toggleSpeechToText}
              className={`p-2.5 rounded-xl border transition-all duration-300 shrink-0 cursor-pointer ${
                isListening
                  ? 'bg-red-500 text-white border-red-500 shadow-md animate-pulse'
                  : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'
              }`}
              title="Speak voice note"
            >
              {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isListening ? "Listening... Speak now" : t('chatPlaceholder')}
              className={`flex-1 bg-slate-900 border focus:border-emerald-500/60 rounded-xl px-3 py-2 text-xs focus:outline-none transition-all placeholder:text-slate-600 text-slate-200 ${
                isListening ? 'border-red-500/40 ring-1 ring-red-500/10' : 'border-slate-850'
              }`}
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-bold p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

        </div>
      )}
    </>
  );
};

import { GoogleGenAI } from '@google/genai';
import React, { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';

const MODEL = 'gemini-2.5-flash';

const SYSTEM_INSTRUCTION = `
Eres el Comandante Elian, un explorador espacial atrapado en una anomalía temporal. 
Tu tono es aventurero y dependes de los cálculos del usuario para sobrevivir.
ROL: El usuario es el "Director de Navegación del Centro de Control".
OBJETIVO: Guiar mediante método socrático en matemáticas. Nunca des la respuesta directamente.
FORMATO: Reportes de misión cortos, narrativa espacial, usa LaTeX para fórmulas.
ERRORES: Trátalos como "interferencias de señal".
`;

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState<{ id: number; left: string; top: string; duration: string; size: string }[]>([]);

  useEffect(() => {
    const newStars = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${Math.random() * 3 + 2}s`,
      size: `${Math.random() * 2 + 1}px`,
    }));
    setStars(newStars);

    setTimeout(() => {
      setMessages([{
        role: 'model',
        text: "¡Centro de Control! Aquí el Comandante Elian. He cruzado una brecha cuántica y mis sistemas de navegación están bloqueados. Necesito sus coordenadas matemáticas para estabilizar el reactor. ¿Están operativos?"
      }]);
    }, 500);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY missing. Please configure it in AI Studio settings.');
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const currentHistory = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const chat = ai.chats.create({
        model: MODEL,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION
        },
        history: currentHistory
      });

      const response = await chat.sendMessage({ message: userMessage });
      
      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: `CENTRO DE CONTROL: Error crítico de comunicación (${error.message}). La anomalía es demasiado fuerte. Reintente el enlace.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen text-[#f8fafc] bg-[#020617] font-sans overflow-hidden border-[12px] border-[#1e293b]">
      <header className="h-20 border-b border-[#334155] bg-[#0f172a] flex items-center px-6 justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-400 bg-slate-800 flex items-center justify-center text-2xl">
            👨‍🚀
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-[0.2em] text-cyan-400 uppercase">Command Console: Elian-V</h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Quantum Link: Stabilized</span>
            </div>
          </div>
        </div>
        <div className="hidden md:flex gap-8">
          <div className="text-right">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Mission Time</p>
            <p className="text-sm font-mono text-blue-300">04:12:09:55</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Coordinate Stream</p>
            <p className="text-sm font-mono text-blue-300 uppercase">DIM-X84 // 42.09.11</p>
          </div>
          <div className="text-right border-l border-slate-700 pl-8">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Reactor Temp</p>
            <p className="text-sm font-mono text-orange-400">412.5 K</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden z-10">
        <section className="flex-1 flex flex-col border-r border-[#334155] bg-[#020617] p-6 relative">
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none space-background">
            {stars.map(star => (
              <div
                key={star.id}
                className="star"
                style={{
                  width: star.size,
                  height: star.size,
                  left: star.left,
                  top: star.top,
                  '--duration': star.duration
                } as React.CSSProperties}
              />
            ))}
          </div>
          
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto chat-scrollbar relative z-10 pb-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-xl ${
                  msg.role === 'user'
                    ? 'bg-[#1e3a8a]/40 border border-blue-500/50 rounded-tr-none'
                    : 'bg-[#1e293b] border border-slate-700 rounded-tl-none'
                }`}>
                  <span className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${msg.role === 'user' ? 'text-blue-300' : 'text-cyan-400'}`}>
                    {msg.role === 'user' ? 'Centro de Control' : 'Comandante Elian'}
                  </span>
                  <div className="text-sm leading-relaxed text-slate-200 markdown-body">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-[80%] bg-[#1e293b] border border-slate-700 p-4 rounded-xl rounded-tl-none flex items-center gap-2 text-cyan-500 font-mono text-sm">
                  <span className="pulse-dot">●</span>
                  <span>PROCESANDO TRANSMISIÓN DE LARGO ALCANCE...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="mt-4 border-t border-slate-800 pt-4 relative z-10 shrink-0">
            <div className="relative flex items-center">
              <div className="absolute left-4 text-cyan-500 font-mono">{'>'}</div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg py-4 pl-10 pr-24 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="Esperando entrada de comando matemático..."
                autoFocus
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 bg-blue-600 hover:bg-cyan-500 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest text-[#f8fafc] disabled:opacity-50 transition-colors"
              >
                Transmitir
              </button>
            </div>
          </div>
        </section>

        <aside className="w-80 bg-[#0f172a]/50 p-6 flex-col gap-8 hidden lg:flex z-10">
          <div className="space-y-4">
            <h2 className="text-[11px] font-serif italic text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Diagnostic HUD</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] uppercase text-slate-400">Oxygen Levels</span>
                <span className="text-xs font-mono text-slate-200">94%</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-[94%]"></div>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] uppercase text-slate-400">Fuel Reserve</span>
                <span className="text-xs font-mono text-slate-200">12%</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full w-[12%]"></div>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] uppercase text-slate-400">Encryption Strength</span>
                <span className="text-xs font-mono text-cyan-400">Secure</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-[11px] font-serif italic text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Active Parameters</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/20 border border-slate-800 p-2 rounded">
                <p className="text-[9px] text-slate-500">VAL_X</p>
                <p className="text-xs font-mono text-slate-200">2.0004</p>
              </div>
              <div className="bg-black/20 border border-slate-800 p-2 rounded">
                <p className="text-[9px] text-slate-500">VAL_Y</p>
                <p className="text-xs font-mono text-slate-200">-0.0091</p>
              </div>
              <div className="bg-black/20 border border-slate-800 p-2 rounded">
                <p className="text-[9px] text-slate-500">VEL_ROT</p>
                <p className="text-xs font-mono text-slate-200">14.2/s</p>
              </div>
              <div className="bg-black/20 border border-slate-800 p-2 rounded">
                <p className="text-[9px] text-slate-500">GRAV_U</p>
                <p className="text-xs font-mono text-slate-200">0.88 g</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-end">
            <div className="p-3 bg-cyan-950/20 border border-cyan-900/50 rounded-lg">
              <h3 className="text-[10px] font-bold text-cyan-500 uppercase mb-2">Tactical Note</h3>
              <p className="text-[11px] leading-relaxed italic text-cyan-100/70">"Elian, recuerda: la clave para sobrevivir a las cuadráticas es encontrar dos números que sumen el opuesto de b y multipliquen c."</p>
            </div>
          </div>
        </aside>
      </main>

      <footer className="h-8 bg-[#1e293b] border-t border-slate-800 px-6 flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] z-10 shrink-0">
        <span>System: Nav-OS v7.2</span>
        <span className="hidden sm:inline">Sector: Orion Belt / Quadrant 4</span>
        <span>Latency: 44ms</span>
      </footer>
    </div>
  );
}

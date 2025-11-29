import React, { useState } from 'react';
import { Mic, Send, Sparkles } from 'lucide-react';

export const VoiceAI: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'Hello! I am Nexdom AI. How can I help you manage your home today?' }
  ]);

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm currently in demo mode. Once the AI SDK is fully integrated, I'll be able to control your devices and answer questions intelligently." }]);
    }, 1000);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col lg:pl-32 lg:pr-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white tracking-wide">Nexdom Assistant</h2>
      </div>

      <div className="flex-1 glass-panel rounded-[2rem] border border-white/10 overflow-hidden flex flex-col relative">
        {/* Background Ambient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex-1 p-8 overflow-y-auto space-y-6 relative z-10">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-5 rounded-2xl backdrop-blur-md border ${msg.role === 'user'
                  ? 'bg-blue-600/20 border-blue-500/30 text-white rounded-br-none shadow-[0_0_15px_rgba(37,99,235,0.1)]'
                  : 'bg-white/5 border-white/10 text-gray-200 rounded-bl-none'
                }`}>
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/5 bg-black/20 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button className="p-4 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/5 hover:border-white/20">
              <Mic className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a command or ask a question..."
                className="w-full p-4 pl-6 rounded-full bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-nexdom-lime/50 transition-all"
              />
            </div>
            <button
              onClick={handleSend}
              className="p-4 rounded-full bg-nexdom-lime text-black hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(0,255,136,0.3)] hover:shadow-[0_0_25px_rgba(0,255,136,0.5)]"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

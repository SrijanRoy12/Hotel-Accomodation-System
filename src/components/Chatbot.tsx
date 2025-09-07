import React, { useMemo, useRef, useState } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TravelerPersona, RecommendedHotel } from '../types/hotel';
import { useAI } from '../hooks/useAI';

interface ChatbotProps {
  persona: TravelerPersona;
  city: string;
}

type ChatRole = 'user' | 'assistant' | 'system';
interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ persona, city }) => {
  const [open, setOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'sys-1',
      role: 'assistant',
      content:
        `Hi! I'm your StayAI assistant. Tell me your preferences (budget, location, amenities), and I can recommend hotels in ${city || 'your city'}.`
    }
  ]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const provider = useMemo<'openai' | 'groq' | 'gemini' | 'none'>(() => {
    if (import.meta?.env?.VITE_OPENAI_API_KEY) return 'openai';
    if (import.meta?.env?.VITE_GROQ_API_KEY) return 'groq';
    if (import.meta?.env?.VITE_GEMINI_API_KEY) return 'gemini';
    return 'none';
  }, []);

  const geminiModel = import.meta?.env?.VITE_GEMINI_MODEL || 'gemini-1.5-pro';
  const groqModel = import.meta?.env?.VITE_GROQ_MODEL || 'llama3-8b-8192';
  const openaiModel = import.meta?.env?.VITE_OPENAI_MODEL || 'gpt-4o-mini';

  const { analyzePreferences } = useAI();

  const defaultPrompts = [
    'Find 3 hotels under ₹4000 near city center with great breakfast',
    'Show top 5 4+ star hotels for a family with kids',
    'Business-friendly hotels near the airport with fast Wi‑Fi',
    'Beachside stays with pool and free parking',
  ];

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  const addMessage = (role: ChatRole, content: string) => {
    const msg: ChatMessage = { id: Math.random().toString(36).slice(2), role, content };
    setMessages(prev => [...prev, msg]);
    setTimeout(scrollToBottom, 50);
  };

  const callModel = async (history: ChatMessage[]): Promise<string> => {
    if (provider === 'openai') {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
      const url = 'https://api.openai.com/v1/chat/completions';
      // Map chat history to OpenAI messages format
      const messages = [
        {
          role: 'system',
          content: `You are StayAI, a helpful travel assistant. Be concise and helpful. When asked for hotels, prefer recommending options in ${city || 'the given city'} and tailor suggestions to the user's persona (${persona}).`
        },
        ...history.map(h => ({ role: h.role, content: h.content }))
      ];
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ model: openaiModel, messages })
      });
      if (!resp.ok) {
        let detail = '';
        try {
          const data = await resp.json();
          detail = data?.error?.message || JSON.stringify(data);
        } catch {
          try { detail = await resp.text(); } catch {}
        }
        throw new Error(`OpenAI error ${resp.status}: ${detail}`);
      }
      const data = await resp.json();
      return data?.choices?.[0]?.message?.content || 'I could not generate a response.';
    }
    if (provider === 'gemini') {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
      // Map chat history to Gemini contents format
      const contents = history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      }));
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });
      if (!resp.ok) {
        let detail = '';
        try {
          const data = await resp.json();
          detail = data?.error?.message || JSON.stringify(data);
        } catch {
          try { detail = await resp.text(); } catch {}
        }
        throw new Error(`Gemini error ${resp.status}: ${detail}`);
      }
      const data = await resp.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response.';
    }
    if (provider === 'groq') {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY as string;
      const url = 'https://api.groq.com/openai/v1/chat/completions';
      // Map chat history to OpenAI-compatible messages format
      const messages = [
        {
          role: 'system',
          content: `You are StayAI, a helpful travel assistant. Be concise and helpful. When asked for hotels, prefer recommending options in ${city || 'the given city'} and tailor suggestions to the user's persona (${persona}).`
        },
        ...history.map(h => ({ role: h.role, content: h.content }))
      ];
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ model: groqModel, messages })
      });
      if (!resp.ok) {
        let detail = '';
        try {
          const data = await resp.json();
          detail = (data as any)?.error?.message || JSON.stringify(data);
        } catch {
          try { detail = await resp.text(); } catch {}
        }
        throw new Error(`Groq error ${resp.status}: ${detail}`);
      }
      const data = await resp.json();
      return (data as any)?.choices?.[0]?.message?.content || 'I could not generate a response.';
    }

    // No provider configured
    return 'LLM not configured. Add API keys in .env to enable chat.';
  };

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;

    addMessage('user', content);
    setInput('');
    setLoading(true);

    // Try to parse a recommendation intent and provide hotel suggestions too
    // Simple heuristic: if mentions budget, stars, area, or amenities, call analyzePreferences
    const lower = content.toLowerCase();
    const wantsRecs = /hotel|recommend|budget|₹|rs|star|near|airport|city center|beach|pool|breakfast|wifi|wi-fi/.test(lower);

    try {
      // Model response in parallel with recs if applicable
      const history = messages.concat({ id: 'temp', role: 'user', content });

      const [modelReply, recs] = await Promise.all([
        callModel(history),
        wantsRecs
          ? analyzePreferences(persona, city, [content])
          : Promise.resolve(null)
      ]);

      addMessage('assistant', modelReply);

      if (recs && recs.length) {
        const lines = recs.map((h: RecommendedHotel, i: number) => {
          const star = h.hotel_star_rating ? ` • ${h.hotel_star_rating}★` : '';
          const avg = (h.average_platform_rating ?? 0) ? ` • Avg ${h.average_platform_rating?.toFixed(1)}/5` : '';
          const price = h.price_range ? ` • ~₹${h.price_range}` : '';
          return `${i + 1}. ${h.name}${star}${avg}${price} — ${h.address || h.city || ''}`;
        }).join('\n');
        addMessage('assistant', `Here are some options I found:\n${lines}`);
      }
    } catch (e: any) {
      addMessage('assistant', `Sorry, I had trouble processing that. ${e?.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Intro bubble */}
      <AnimatePresence>
        {showIntro && !open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 max-w-xs bg-white shadow-xl border rounded-2xl p-4 z-40"
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm text-gray-700">
                <div className="font-semibold mb-1">Need help deciding?</div>
                Tell me your budget, preferred area, and must-have amenities. I’ll suggest hotels instantly.
              </div>
              <button aria-label="dismiss" onClick={() => setShowIntro(false)} className="ml-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-40 rounded-full p-4 shadow-2xl text-white bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
        aria-label="Open chat"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 w-96 max-w-[95vw] h-[70vh] bg-white border rounded-2xl shadow-2xl z-50 flex flex-col"
          >
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="font-semibold">StayAI Assistant</div>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Suggestions */}
            <div className="px-4 py-2 border-b flex flex-wrap gap-2">
              {defaultPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p)}
                  className="text-xs px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3" />
                  {p}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${m.role === 'user' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-800'} px-3 py-2 rounded-2xl max-w-[80%] whitespace-pre-wrap`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="text-xs text-gray-500 flex items-center gap-2"><Sparkles className="w-3 h-3"/>Thinking…</div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="p-3 border-t flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask about hotels in ${city || 'your city'}…`}
                className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl px-3 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm disabled:opacity-60 flex items-center gap-1"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>

            {/* Footer note */}
            {provider === 'none' && (
              <div className="px-4 py-2 text-[11px] text-gray-500 border-t bg-gray-50">
                Tip: Set VITE_OPENAI_API_KEY, VITE_GROQ_API_KEY, or VITE_GEMINI_API_KEY in .env to enable live AI responses.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;

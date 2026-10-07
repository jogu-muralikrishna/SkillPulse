import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, ShieldCheck, Database, AlertCircle, Wrench, CheckCircle2 } from 'lucide-react';
import { MasterGeographySelect } from '../components/MasterGeographySelect';

export interface AssistantSource {
  endpoint: string;
  source: string;
}

export interface AssistantToolCall {
  name: string;
  params?: Record<string, any>;
  endpoint?: string;
  source?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: AssistantSource[];
  toolCalls?: AssistantToolCall[];
  isFallback?: boolean;
  isError?: boolean;
  isDataUnavailable?: boolean;
}

export const AssistantView: React.FC = () => {
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello. I am the SkillPulse Assistant. I provide data-grounded insights strictly based on our verified public labour-market datasets (NCS, PMKVY, e-Shram). I do not invent or extrapolate statistics beyond the empirical database. You can select a State/District context or ask about any Indian location directly. How can I assist your planning analysis today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      // Notice: No fake source chips on initial welcome greeting
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const samplePrompts = [
    'Which skills show a potential shortage in Hyderabad?',
    'What is the demand forecast for Python Development in Hyderabad?',
    'Compare current demand for Python Development in Hyderabad with its projected forecast.',
    'What is the demand forecast for Quantum Computing in Arunachal Pradesh?',
    'What are the highest priority skills in Hyderabad?',
    'Where did this data come from?'
  ];

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.text,
          state: selectedState || undefined,
          district: selectedDistrict || undefined
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.error && !data.answer && !data.reply) {
        throw new Error(data.error);
      }

      const rawAnswer = data.answer || data.reply || '';
      const isUnavailable = rawAnswer.toLowerCase().includes('data not available') ||
                            rawAnswer.toLowerCase().includes('not available');
      const isFallback = Boolean(
        data.isFallback ||
        rawAnswer.includes('External AI model service encountered a temporary constraint')
      );

      // Strip internal fallback notice sentence so we can render it cleanly as a dedicated badge
      let displayText = rawAnswer;
      if (isFallback) {
        displayText = displayText
          .replace('(Notice: External AI model service encountered a temporary constraint; response was generated directly from verified database records).', '')
          .trim();
      }

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: displayText || 'data not available for the requested parameters.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: Array.isArray(data.sources) ? data.sources : [],
        toolCalls: Array.isArray(data.toolCalls) ? data.toolCalls : [],
        isFallback,
        isDataUnavailable: isUnavailable
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'The assistant could not retrieve verified analytics at this moment. The service may be experiencing connectivity limits or temporarily unavailable. Please refer to the verified tables in the Demand and Skill Gap dashboards.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
        sources: []
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-indigo-600" />
            <span>SkillPulse Assistant</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Strictly grounded in verified application datasets via Gemini function calling. Never hallucinates statistics.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Factual Grounding Enforced</span>
        </div>
      </div>

      {/* Geography Context Selector */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs shrink-0">
        <MasterGeographySelect
          selectedState={selectedState}
          selectedDistrict={selectedDistrict}
          onStateChange={(st) => setSelectedState(st)}
          onDistrictChange={(dist) => setSelectedDistrict(dist)}
          showAllOption={true}
        />
      </div>

      {/* Suggested Questions Strip */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 shrink-0">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
          Suggested:
        </span>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(p)}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-full whitespace-nowrap transition-colors shadow-2xs"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-indigo-600 text-white font-semibold text-xs'
                    : m.isError
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-slate-900 text-indigo-400'
                }`}
              >
                {isUser ? (
                  <User className="w-4 h-4" />
                ) : m.isError ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : m.isError
                    ? 'bg-rose-50/80 border border-rose-200 text-rose-900 shadow-2xs'
                    : 'bg-slate-50 border border-slate-200/90 text-slate-800 shadow-2xs'
                }`}
              >
                {/* Fallback Notice Badge */}
                {m.isFallback && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-2.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Deterministic Fallback: Response calculated directly from verified database records</span>
                  </div>
                )}

                {/* Data Unavailable Notice Badge */}
                {m.isDataUnavailable && !m.isError && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mb-2 rounded bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-medium">
                    <AlertCircle className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>Status: Data Not Available</span>
                  </div>
                )}

                {/* Message Body */}
                <div className="whitespace-pre-line leading-relaxed font-normal">{m.text}</div>

                {/* Subtle Tool Usage Metadata (Requirement 7) */}
                {m.toolCalls && m.toolCalls.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="text-slate-400 font-medium">Tools:</span>
                    {Array.from(new Set(m.toolCalls.map((t) => t.name))).map((toolName, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-100/90 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/80"
                      >
                        <Wrench className="w-2.5 h-2.5 text-slate-400" />
                        Used: {toolName}
                      </span>
                    ))}
                  </div>
                )}

                {/* Source Chips (Requirements 4, 5, 6, 15, 16) */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
                      <Database className="w-3 h-3 text-slate-400" />
                      Sources:
                    </span>
                    {m.sources.map((s, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-700 shadow-2xs transition-colors"
                        title={`Verified API Endpoint: ${s.endpoint}`}
                      >
                        <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100 font-semibold">
                          Source: {s.endpoint}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-600 text-[11px]">{s.source}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Message Footer */}
                <div
                  className={`mt-2 pt-1 flex items-center justify-between text-[10px] ${
                    isUser ? 'border-t border-indigo-500/40 text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {m.sender === 'assistant' && !m.isError && (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      Grounded
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-indigo-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-center gap-2.5 shadow-2xs">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></div>
              <span>Consulting SkillPulse analytics tools & verifying dataset grounding...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="flex gap-2 shrink-0">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask a question grounded in application data (e.g., Which skills show a potential shortage in Hyderabad?)..."
          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !inputMessage.trim()}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors shadow-xs"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

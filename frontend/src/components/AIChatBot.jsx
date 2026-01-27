import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../api';
import { Sparkles, Send, X, MessageSquareText } from 'lucide-react';

const AIChatBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null); // 자동 스크롤을 위한 ref

  // 메시지가 추가될 때마다 하단으로 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const quickQueries = [
    {
      id: 1,
      label: 'Spending Summary',
      text: 'Give me a summary of my spending this month.',
    },
    {
      id: 2,
      label: 'Saving Tips',
      text: 'How can I save more money based on my data?',
    },
    {
      id: 3,
      label: 'Budget Check',
      text: 'Am I spending too much compared to last month?',
    },
  ];

  const handleSend = async (textToSend) => {
    const targetText = typeof textToSend === 'string' ? textToSend : input;
    if (!targetText.trim()) return;

    const userMessage = { role: 'user', content: targetText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: targetText });
      if (res.data && res.data.answer) {
        setMessages((prev) => [...prev, { role: 'ai', content: res.data.answer }]);
      }
    } catch (err) {
      console.log(err);
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Error: Could not connect to the AI advisor.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999]">
      {isOpen ? (
        <div className="w-80 sm:w-96 bg-white rounded-[32px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
          {/* Header */}
          <div className="bg-gray-100 p-6 flex justify-between items-center border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" />
              <span className="font-black tracking-tighter uppercase text-sm text-indigo-700">
                AI Financial Advisor
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-black"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat Content */}
          <div
            ref={scrollRef}
            className="h-96 overflow-y-auto p-6 space-y-6 bg-gray-50 flex flex-col scroll-smooth"
          >
            {messages.length === 0 && (
              <div className="flex flex-col gap-3 mt-4">
                <div className="flex justify-center mb-2 text-indigo-200">
                  <MessageSquareText size={40} />
                </div>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest text-center mb-2">
                  Choose a topic to start
                </p>
                {quickQueries.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleSend(q.text)}
                    className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-black hover:border-indigo-500 hover:text-indigo-600 transition-all text-left shadow-sm hover:translate-x-1"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-white text-black border border-gray-200'
                  }`}
                >
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <div className="markdown-content">
                      <ReactMarkdown
                        components={{
                          // 리스트 및 문단 간격 조정으로 가독성 향상
                          ol: ({ children }) => (
                            <ol className="list-decimal ml-4 space-y-3 my-2">
                              {children}
                            </ol>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc ml-4 space-y-2 my-2">
                              {children}
                            </ul>
                          ),
                          li: ({ children }) => (
                            <li className="text-black font-bold tracking-tight">
                              {children}
                            </li>
                          ),
                          p: ({ children }) => (
                            <p className="mb-3 last:mb-0 font-medium">{children}</p>
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start items-center gap-2 p-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
            <input
              className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-black font-bold"
              placeholder="Your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={() => handleSend()}
              className="bg-indigo-600 text-black p-3 rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-90 flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-950 text-white px-6 py-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all border border-indigo-800 flex items-center gap-3 group"
        >
          <Sparkles
            size={20}
            className="text-indigo-400 group-hover:rotate-12 transition-transform"
          />
          <span className="font-bold uppercase text-[10px] tracking-[0.2em] text-indigo-700">
            Ask AI Advisor
          </span>
        </button>
      )}
    </div>
  );
};

export default AIChatBox;

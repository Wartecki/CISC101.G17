import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, ChefHat, User, RefreshCcw, Info, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getMealResponse } from "./lib/gemini";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const history = newMessages.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      }));

      const response = await getMealResponse(history);
      setMessages((prev) => [...prev, { role: "model", content: response || "I'm sorry, I couldn't generate a response." }]);
    } catch (error) {
      console.error("Error getting meal response:", error);
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "I encountered an error. Please check your connection and try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-[#2563EB] selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#1A1A1A]/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2563EB] rounded-full flex items-center justify-center text-white">
            <ChefHat size={24} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">MealWise</h1>
        </div>
        <button
          onClick={handleReset}
          className="p-2 hover:bg-[#1A1A1A]/5 rounded-full transition-colors"
          title="Reset Conversation"
        >
          <RefreshCcw size={20} />
        </button>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8 pb-32">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <h2 className="text-5xl font-light tracking-tight mb-6 leading-tight">
              What are we <span className="italic font-serif">cooking</span> today?
            </h2>
            <p className="text-[#1A1A1A]/60 max-w-md mx-auto mb-12 text-lg">
              Share your ingredients, dietary needs, or a cuisine you're craving.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {[
                "I want a recipe for cookies.",
                "Give me recipes for something healthy.",
                "I have tuna, honey, and avocado.",
                "Low carb lunch recipes for 4 people.",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="p-4 text-left border border-[#1A1A1A]/10 rounded-2xl hover:border-[#2563EB] hover:bg-[#2563EB]/5 transition-all group"
                >
                  <p className="text-sm font-medium text-[#1A1A1A]/40 group-hover:text-[#2563EB] mb-1 uppercase tracking-wider">
                    Try asking
                  </p>
                  <p className="font-medium">{suggestion}</p>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user" ? "bg-[#1E40AF] text-white" : "bg-[#2563EB] text-white"
                    }`}
                  >
                    {message.role === "user" ? <User size={16} /> : <ChefHat size={16} />}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-3xl px-6 py-4 ${
                      message.role === "user"
                        ? "bg-[#DBEAFE] text-[#1E40AF] rounded-tr-none user-bubble"
                        : "bg-white border border-[#1A1A1A]/10 rounded-tl-none shadow-sm"
                    }`}
                  >
                    <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:mb-2 prose-p:leading-relaxed prose-table:border-collapse prose-th:border prose-th:border-[#1A1A1A]/10 prose-th:p-2 prose-td:border prose-td:border-[#1A1A1A]/10 prose-td:p-2 prose-ul:list-disc prose-ol:list-decimal">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center animate-pulse">
                  <ChefHat size={16} />
                </div>
                <div className="bg-white border border-[#1A1A1A]/10 rounded-3xl rounded-tl-none px-6 py-4 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#FDFCFB] via-[#FDFCFB] to-transparent pt-10 pb-8 px-6">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center bg-[#EFF6FF] border border-[#2563EB]/20 rounded-full shadow-lg focus-within:border-[#2563EB] transition-all px-2 py-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me what you're in the mood for..."
              className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 text-lg outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 bg-[#2563EB] text-white rounded-full flex items-center justify-center hover:bg-[#1D4ED8] disabled:opacity-50 disabled:hover:bg-[#2563EB] transition-all"
            >
              <Send size={20} />
            </button>
          </form>
          <p className="text-center text-[10px] text-[#1A1A1A]/40 mt-4 uppercase tracking-[0.2em]">
            Powered by Gemini AI • MealWise Generator
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";

const EXAMPLE_QUERIES = [
  "근처 다이소에 AA건전지 있어?",
  "물티슈 찾고 있는데 재고 있나요?",
  "양면테이프 파는 매장 알려줘",
];

export default function Home() {
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat();

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const requestLocation = () => {
    setLocationRequested(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // Geolocation denied - will handle via chat
        }
      );
    }
  };

  const handleSend = (text: string) => {
    if (!text.trim() || isLoading) return;

    if (!locationRequested) {
      requestLocation();
    }

    sendMessage({ text });
    setInputValue("");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputValue);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-dvh bg-white">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-gray-100 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">🏪 다이소 재고 검색</h1>
        <p className="text-xs text-gray-500">
          근처 다이소에서 찾는 물건이 있는지 확인해보세요
        </p>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold text-gray-800">
                다이소에서 뭘 찾고 계세요?
              </p>
              <p className="text-sm text-gray-500">
                찾는 물건을 말씀하시면 가까운 매장의 재고를 확인해드려요
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {EXAMPLE_QUERIES.map((query) => (
                <button
                  key={query}
                  onClick={() => handleSend(query)}
                  className="text-left px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`mb-3 flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <div className="whitespace-pre-wrap">
                {m.parts?.map((p, i) => {
                  if (p.type === "text") {
                    return <span key={i}>{p.text}</span>;
                  }
                  if (p.type === "tool-invocation") {
                    return (
                      <span key={i} className="text-xs text-gray-400 block my-1">
                        🔍 {p.toolInvocation.toolName === "searchNearbyStores" && "매장 검색 중..."}
                        {p.toolInvocation.toolName === "searchProducts" && "상품 검색 중..."}
                        {p.toolInvocation.toolName === "checkInventory" && "재고 확인 중..."}
                        {p.toolInvocation.toolName === "findAlternatives" && "쿠팡 검색 중..."}
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="mb-3 flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-500">
              <span className="animate-pulse">검색 중...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3 bg-white">
        {location && (
          <p className="text-xs text-green-600 mb-2">📍 위치 확인됨</p>
        )}
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="찾는 물건을 입력하세요..."
            className="flex-1 px-4 py-2.5 rounded-full border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2.5 bg-blue-500 text-white rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            검색
          </button>
        </form>
      </div>
    </div>
  );
}

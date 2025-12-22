'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './ChatBot.module.scss';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatBotProps {
  type: 'user' | 'admin';
}

export default function ChatBot({ type }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 세션 ID 초기화
  useEffect(() => {
    // localStorage에서 세션 ID 가져오거나 새로 생성
    const storageKey = `chat_session_${type}`;
    const storedSessionId = localStorage.getItem(storageKey);
    
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(storageKey, newSessionId);
      setSessionId(newSessionId);
    }
  }, [type]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // 초기 환영 메시지
      const welcomeMessage: Message = {
        id: '1',
        text:
          type === 'user'
            ? '안녕하세요! 제주 해양환경 예측 서비스입니다. 궁금하신 점을 물어보세요.'
            : '안녕하세요! 행정업무 지원 챗봇입니다. 데이터 분석, 보고서 생성 등을 도와드립니다.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, type]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // API 호출
      const apiHost = process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:8000';
      const endpoint = type === 'user' ? '/api/v1/chat/message/user' : '/api/v1/chat/message/admin';
      
      const response = await fetch(`${apiHost}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        console.log('챗봇 응답!!!!!!!!')
        console.log(response.body)
        throw new Error('챗봇 응답을 가져오는데 실패했습니다.');
      }

      const data = await response.json();
      
      // 서버에서 받은 session_id로 업데이트
      if (data.session_id && data.session_id !== sessionId) {
        setSessionId(data.session_id);
        localStorage.setItem(`chat_session_${type}`, data.session_id);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('챗봇 에러:', error);
      
      // 에러 발생 시 fallback 응답
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 챗봇 버튼 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={styles.chatButton}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>

          {/* Notification Badge */}
          <span className={styles.notificationBadge}>
            <span className={styles.ping}></span>
            <span className={styles.badge}>
              <span>1</span>
            </span>
          </span>

          {/* Shimmer Effect */}
          <div className={styles.shimmer}></div>
        </button>
      )}

      {/* 챗봇 창 */}
      {isOpen && (
        <div className={styles.chatWindow}>
          {/* 헤더 */}
          <div className={`${styles.chatHeader} ${type === 'user' ? styles.user : styles.admin}`}>
            {/* 배경 패턴 */}
            <div className={styles.headerPattern}>
              <div className={styles.circle1}></div>
              <div className={styles.circle2}></div>
            </div>

            <div className={styles.headerContent}>
              <div className={styles.headerLeft}>
                <div className={styles.headerIcon}>
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    <circle cx="9" cy="10" r="1" fill="white" />
                    <circle cx="15" cy="10" r="1" fill="white" />
                  </svg>
                </div>
                <div className={styles.headerInfo}>
                  <h3>
                    {type === 'user' ? '해양환경 챗봇' : '행정업무 챗봇'}
                  </h3>
                  <p>
                    <span className={styles.onlineIndicator}></span>
                    온라인
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={styles.closeButton}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* 메시지 영역 */}
          <div className={styles.messagesArea}>
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`${styles.messageWrapper} ${message.sender === 'user' ? styles.user : styles.bot}`}
                style={{
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                <div className={`${styles.messageBubble} ${message.sender === 'user' ? styles.user : styles.bot}`}>
                  {message.sender === 'bot' ? (
                    <div className={styles.markdownContent}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p>{message.text}</p>
                  )}
                  <p className={`${styles.messageTime} ${message.sender === 'user' ? styles.user : styles.bot}`}>
                    {message.sender === 'user' && (
                      <svg viewBox="0 0 12 12" fill="currentColor">
                        <path d="M10.97 4.97a.75.75 0 0 1 1.071 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.236.236 0 0 1 .02-.022z"/>
                      </svg>
                    )}
                    {message.timestamp.toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {/* 로딩 인디케이터 */}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="max-w-[75%] rounded-2xl border border-gray-100 bg-white px-5 py-3.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }}></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className={styles.inputArea}>
            <div className={styles.inputContainer}>
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
                placeholder="메시지를 입력하세요..."
                className={styles.messageInput}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className={`${styles.sendButton} ${inputValue.trim() && !isLoading ? styles.active : styles.disabled}`}
              >
                {isLoading ? (
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
                {inputValue.trim() && !isLoading && (
                  <div className={styles.ripple}></div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

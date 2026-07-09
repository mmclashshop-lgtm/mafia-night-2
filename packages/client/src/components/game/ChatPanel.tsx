import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import { useSocket as useSocketHook } from '../../hooks/useSocket';
import { getSocket } from '../../lib/socket';
import { MessageSquare, Skull, ChevronDown, MessageCircle } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface ChatMsg {
  from: string;
  name: string;
  text: string;
  timestamp: number;
}

interface ChatPanelProps {
  isNight?: boolean;
  isDead?: boolean;
}

export const ChatPanel = memo(function ChatPanel({ isNight = false, isDead = false }: ChatPanelProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [mafiaMessages, setMafiaMessages] = useState<ChatMsg[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<'all' | 'mafia'>('all');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const playerId = useGameStore((s) => s.playerId);
  const gameState = useGameStore((s) => s.gameState);
  const { sendChat, sendMafiaChat } = useSocketHook();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const currentPlayer = gameState?.players.find(p => p.id === playerId);
  const isMafia = currentPlayer?.team === 'mafia' || currentPlayer?.role?.id === 'godfather';
  const canChat = (!isNight || isDead);
  const activeMessages = tab === 'mafia' ? mafiaMessages : messages;

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
    isAtBottomRef.current = true;
    setShowScrollBtn(false);
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    isAtBottomRef.current = atBottom;
    setShowScrollBtn(!atBottom && activeMessages.length > 10);
  }, [activeMessages.length]);

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom(true);
    }
  }, [activeMessages, scrollToBottom]);

  useEffect(() => {
    const socket = getSocket();
    const handler = (data: ChatMsg) => {
      setMessages((prev) => [...prev, data]);
      if (data.from === 'system') {
        setMafiaMessages((prev) => [...prev, data]);
      }
    };
    const mafiaHandler = (data: ChatMsg) => setMafiaMessages((prev) => [...prev, data]);
    socket.on('chat:message', handler);
    socket.on('chat:mafia', mafiaHandler);
    return () => {
      socket.off('chat:message', handler);
      socket.off('chat:mafia', mafiaHandler);
    };
  }, []);

  const handleSend = useCallback((text: string) => {
    if (tab === 'mafia') sendMafiaChat(text);
    else if (canChat) sendChat(text);
  }, [tab, canChat, sendChat, sendMafiaChat]);

  const unreadMafia = mafiaMessages.length;

  return (
    <div className="flex flex-col h-64 md:h-[400px] bg-[#0F0F1A]/80 border border-[#8B0000]/15 rounded-xl overflow-hidden backdrop-blur-sm">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 px-4 py-3 border-b border-[#8B0000]/20 hover:bg-[#8B0000]/5 transition-colors"
      >
        <MessageCircle className="w-4 h-4 text-[#8B0000]" />
        <span className="text-sm font-semibold text-gray-200">{t('chatPanel.chat')}</span>
        {unreadMafia > 0 && tab !== 'mafia' && (
          <span className="text-[10px] bg-[#8B0000] text-white px-1.5 py-0.5 rounded-full font-bold">{unreadMafia}</span>
        )}
        {!canChat && tab !== 'mafia' && <span className="text-[10px] text-gray-600 ml-auto">({t('chatPanel.night')})</span>}
        {isDead && <span className="text-[10px] text-purple-400 ml-auto">({t('chatPanel.spectating')})</span>}
      </button>

      <div className={`flex-1 flex flex-col ${collapsed ? 'hidden' : ''}`}>
        {isMafia && isNight && (
          <div className="flex border-b border-[#8B0000]/10">
            <button
              onClick={() => setTab('all')}
              className={`flex-1 text-xs py-2 transition-all ${tab === 'all' ? 'bg-[#1A1A2E] text-white border-b-2 border-[#2563EB]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'}`}
            >
              <MessageSquare className="w-3 h-3 inline ml-1" />
              {t('chatPanel.general')}
            </button>
            <button
              onClick={() => setTab('mafia')}
              className={`flex-1 text-xs py-2 transition-all ${tab === 'mafia' ? 'bg-[#1A1A2E] text-[#FF6B6B] border-b-2 border-[#8B0000]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'}`}
            >
              <Skull className="w-3 h-3 inline ml-1" />
              {t('chatPanel.mafia')} {unreadMafia > 0 && `(${unreadMafia})`}
            </button>
          </div>
        )}

        <div className="flex-1 relative">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="absolute inset-0 overflow-y-auto scroll-smooth"
          >
            {activeMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-600 text-center px-4">
                  {tab === 'mafia' ? t('chatPanel.mafiaChat') : canChat ? t('chatPanel.noMessages') : t('chatPanel.chatDayOnly')}
                </p>
              </div>
            ) : (
              <div className="py-1">
                {activeMessages.map((msg, idx) => {
                  const prev = idx > 0 ? activeMessages[idx - 1] : null;
                  const showHeader = !prev || prev.from !== msg.from || (msg.timestamp - prev.timestamp) > 120000;
                  return (
                    <div key={idx} className={showHeader ? '' : '-mt-1'}>
                      {showHeader && idx > 0 && (
                        <div className="h-2" />
                      )}
                      <ChatMessage
                        msg={msg}
                        isOwn={msg.from === playerId}
                        isMafia={tab === 'mafia' || (msg.from !== 'system' && currentPlayer?.team === 'mafia')}
                        isSystem={msg.from === 'system'}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {showScrollBtn && (
            <button
              onClick={() => scrollToBottom(true)}
              className="absolute bottom-3 right-3 w-8 h-8 bg-[#8B0000] hover:bg-[#B22222] rounded-full flex items-center justify-center shadow-lg shadow-[#8B0000]/30 transition-all animate-bounce"
            >
              <ChevronDown className="w-4 h-4 text-white" />
            </button>
          )}
        </div>

        <ChatInput
          onSend={handleSend}
          placeholder={tab === 'mafia' ? t('chatPanel.mafiaWhisper') : t('chatPanel.typeMessage')}
          disabled={!(canChat || tab === 'mafia')}
        />
      </div>
    </div>
  );
});

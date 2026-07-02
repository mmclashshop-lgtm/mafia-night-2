import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useSocket as useSocketHook } from '../../hooks/useSocket';
import { getSocket } from '../../lib/socket';
import { Send, MessageSquare, Skull } from 'lucide-react';

interface ChatMessage {
  from: string;
  name: string;
  text: string;
  timestamp: number;
}

interface ChatPanelProps {
  isNight?: boolean;
  isDead?: boolean;
}

export function ChatPanel({ isNight = false, isDead = false }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mafiaMessages, setMafiaMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<'all' | 'mafia'>('all');
  const playerId = useGameStore((s) => s.playerId);
  const gameState = useGameStore((s) => s.gameState);
  const { sendChat, sendMafiaChat } = useSocketHook();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentPlayer = gameState?.players.find(p => p.id === playerId);
  const isMafia = currentPlayer?.team === 'mafia' || currentPlayer?.role?.id === 'godfather';
  const canChat = (!isNight || isDead);

  const activeMessages = tab === 'mafia' ? mafiaMessages : messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  useEffect(() => {
    const socket = getSocket();
    const handler = (data: ChatMessage) => setMessages((prev) => [...prev, data]);
    const mafiaHandler = (data: ChatMessage) => setMafiaMessages((prev) => [...prev, data]);
    socket.on('chat:message', handler);
    socket.on('chat:mafia', mafiaHandler);
    return () => {
      socket.off('chat:message', handler);
      socket.off('chat:mafia', mafiaHandler);
    };
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    if (tab === 'mafia') {
      sendMafiaChat(input.trim());
    } else if (canChat) {
      sendChat(input.trim());
    }
    setInput('');
  };

  return (
    <div className="card flex flex-col h-64 md:h-[400px]">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 p-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
      >
        <MessageSquare className="w-4 h-4" />
        <span className="text-sm font-medium">Chat</span>
        {mafiaMessages.length > 0 && tab !== 'mafia' && (
          <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded-full">{mafiaMessages.length}</span>
        )}
        {!canChat && tab !== 'mafia' && <span className="text-xs text-gray-500 ml-auto">(night)</span>}
        {isDead && <span className="text-xs text-purple-400 ml-auto">(spectating)</span>}
      </button>

      <div className={`flex-1 flex flex-col ${collapsed ? 'hidden' : ''}`}>
        {isMafia && isNight && (
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setTab('all')}
              className={`flex-1 text-xs py-2 transition-colors ${tab === 'all' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <MessageSquare className="w-3 h-3 inline mr-1" />
              General
            </button>
            <button
              onClick={() => setTab('mafia')}
              className={`flex-1 text-xs py-2 transition-colors ${tab === 'mafia' ? 'bg-red-900/50 text-red-300' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Skull className="w-3 h-3 inline mr-1" />
              Mafia {mafiaMessages.length > 0 && `(${mafiaMessages.length})`}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeMessages.length === 0 && (
            <p className="text-sm text-gray-500 text-center mt-4">
              {tab === 'mafia' ? 'Mafia chat - coordinate secretly' : canChat ? 'No messages yet' : 'Chat is only available during the day'}
            </p>
          )}
          {activeMessages.map((msg, idx) => (
            <div key={idx} className={`text-sm ${msg.from === playerId ? 'text-right' : ''}`}>
              {msg.from !== playerId && (
                <span className="text-xs text-gray-500 mr-1">{msg.name}:</span>
              )}
              <span className="text-gray-200">{msg.text}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {(canChat || tab === 'mafia') && (
          <div className="p-3 border-t border-gray-800 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={tab === 'mafia' ? 'Mafia whisper...' : 'Type a message...'}
              className="input-field flex-1"
              maxLength={500}
            />
            <button onClick={handleSend} disabled={!input.trim()} className="btn-primary px-3">
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

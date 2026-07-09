import { memo, useState, useRef, useCallback, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';

const EMOJIS = ['😀','😂','😍','🤔','😎','🙏','💀','🔥','👀','🎭','🗡️','🩸','🌙','⭐','💀','🔪','💊','🎲','♠️','♥️'];

interface ChatInputProps {
  onSend: (text: string) => void;
  placeholder: string;
  disabled?: boolean;
  onTyping?: () => void;
}

export const ChatInput = memo(function ChatInput({ onSend, placeholder, disabled, onTyping }: ChatInputProps) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSend = useCallback(() => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
    setShowEmoji(false);
  }, [text, disabled, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const insertEmoji = useCallback((emoji: string) => {
    setText(prev => prev + emoji);
    inputRef.current?.focus();
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    onTyping?.();
  }, [onTyping]);

  return (
    <div className="relative p-3 border-t border-[#8B0000]/20 bg-[#0F0F1A]/80">
      {showEmoji && (
        <div ref={pickerRef} className="absolute bottom-full left-0 right-0 p-2 bg-[#1A1A2E] border border-[#8B0000]/20 rounded-t-xl flex flex-wrap gap-1 max-h-32 overflow-y-auto">
          {EMOJIS.map((emoji, i) => (
            <button
              key={i}
              onClick={() => insertEmoji(emoji)}
              className="w-8 h-8 flex items-center justify-center hover:bg-[#8B0000]/20 rounded text-lg transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className="p-1.5 text-gray-500 hover:text-[#FFD700] hover:bg-[#8B0000]/10 rounded-lg transition-all"
        >
          <Smile className="w-4 h-4" />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={500}
          className="flex-1 bg-[#0A0A0A] text-sm text-white placeholder-gray-600 px-3 py-2 rounded-lg border border-[#8B0000]/15 focus:border-[#8B0000]/50 focus:outline-none focus:ring-1 focus:ring-[#8B0000]/30 transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="p-2 bg-[#8B0000] hover:bg-[#B22222] disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
});

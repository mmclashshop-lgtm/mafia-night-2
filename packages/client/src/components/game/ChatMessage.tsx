import { memo } from 'react';
import { MessageSquare, Skull } from 'lucide-react';

interface ChatMessageData {
  from: string;
  name: string;
  text: string;
  timestamp: number;
}

interface ChatMessageProps {
  msg: ChatMessageData;
  isOwn: boolean;
  isMafia: boolean;
  isSystem?: boolean;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}

function highlightMentions(text: string): React.ReactNode {
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('@')
      ? <span key={i} className="text-[#FFD700] font-semibold">{part}</span>
      : part
  );
}

export const ChatMessage = memo(function ChatMessage({ msg, isOwn, isMafia, isSystem }: ChatMessageProps) {
  const teamColor = isMafia
    ? 'border-l-[#8B0000] bg-[#8B0000]/5'
    : isSystem
      ? 'border-l-[#9333EA] bg-[#9333EA]/5'
      : 'border-l-[#2563EB] bg-[#2563EB]/5';

  return (
    <div className={`flex items-start gap-2.5 px-3 py-1.5 border-l-2 ${teamColor} group hover:bg-white/[0.02] transition-colors`}>
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8B0000] to-[#B22222] flex items-center justify-center flex-shrink-0 mt-0.5">
        {isMafia ? (
          <Skull className="w-3.5 h-3.5 text-white" />
        ) : (
          <MessageSquare className="w-3.5 h-3.5 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={`text-xs font-semibold ${isOwn ? 'text-[#FFD700]' : isMafia ? 'text-[#FF6B6B]' : 'text-[#60A5FA]'}`}>
            {isOwn ? 'You' : msg.name}
          </span>
          <span className="text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(msg.timestamp)}
          </span>
        </div>
        <p className="text-sm text-gray-200 break-words leading-snug mt-0.5">
          {isSystem ? (
            <span className="text-[#A855F7] italic">{msg.text}</span>
          ) : (
            highlightMentions(msg.text)
          )}
        </p>
      </div>
    </div>
  );
});

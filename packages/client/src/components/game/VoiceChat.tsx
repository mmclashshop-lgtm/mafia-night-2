import { Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';
import { useVoiceChat } from '../../hooks/useVoiceChat';

export function VoiceChat() {
  const { enabled, muted, peers, hasMedia, enable, disable, toggleMute } = useVoiceChat();

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium">Voice</span>
          {enabled && (
            <span className="text-xs text-gray-500">
              ({peers.length + 1} connected)
            </span>
          )}
        </div>
        {!enabled ? (
          <button
            onClick={enable}
            className="btn-ghost text-xs flex items-center gap-1"
            title="Join voice chat"
          >
            <Phone className="w-3.5 h-3.5 text-green-400" />
            Join
          </button>
        ) : (
          <button
            onClick={toggleMute}
            className={`btn-ghost text-xs flex items-center gap-1 ${
              muted ? 'text-red-400' : 'text-green-400'
            }`}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {muted ? 'Muted' : 'Live'}
          </button>
        )}
      </div>

      {enabled && (
        <>
          <div className="space-y-1 mb-2">
            {peers.map((peer) => (
              <div
                key={peer.userId}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200 ${
                  peer.speaking
                    ? 'bg-green-900/20 ring-1 ring-green-500/30'
                    : 'bg-white/5'
                }`}
              >
                <div className="relative">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      peer.speaking ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-600'
                    }`}
                  />
                  {peer.speaking && (
                    <div className="absolute -inset-1 rounded-full bg-green-500/20 animate-ping" />
                  )}
                </div>
                <span className="text-sm flex-1 truncate">{peer.name}</span>
                {peer.speaking && (
                  <div className="flex items-end gap-0.5 h-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-0.5 bg-green-400 rounded-full animate-bounce"
                        style={{
                          height: `${Math.max(4, peer.volume * 16 * (i / 2))}px`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '0.3s',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={disable}
            className="btn-ghost text-xs text-red-400 hover:text-red-300 w-full flex items-center justify-center gap-1"
            title="Leave voice chat"
          >
            <PhoneOff className="w-3 h-3" />
            Leave
          </button>
        </>
      )}

      {!hasMedia && enabled && (
        <p className="text-xs text-gray-500 mt-1">Microphone access required</p>
      )}
    </div>
  );
}

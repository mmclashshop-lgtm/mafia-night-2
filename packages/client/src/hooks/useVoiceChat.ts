import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../lib/socket';
import { useGameStore } from '../store/gameStore';

interface VoicePeer {
  userId: string;
  name: string;
  stream: MediaStream | null;
  speaking: boolean;
  volume: number;
}

export function useVoiceChat() {
  const playerId = useGameStore((s) => s.playerId);
  const gameState = useGameStore((s) => s.gameState);
  const [enabled, setEnabled] = useState(false);
  const [muted, setMuted] = useState(true);
  const [peers, setPeers] = useState<VoicePeer[]>([]);
  const [hasMedia, setHasMedia] = useState(false);

  const localStream = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioAnalysers = useRef<Map<string, AnalyserNode>>(new Map());
  const speakTimer = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  function getPlayerName(userId: string): string {
    if (!gameState) return userId.slice(0, 6);
    for (const [, socketId] of Object.entries((getSocket() as any).data ?? {})) {
      // Simplified: use socket ID as fallback, try to find by player
    }
    const assignedPlayer = gameState.players.find(
      (p) => p.id === userId || p.name === userId
    );
    return assignedPlayer?.name ?? userId.slice(0, 6);
  }

  const initAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStream.current = stream;
      setHasMedia(true);
      return stream;
    } catch {
      return null;
    }
  }, []);

  function startSpeakingDetection(userId: string, stream: MediaStream) {
    if (!audioContext.current) return;
    const source = audioContext.current.createMediaStreamSource(stream);
    const analyser = audioContext.current.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    audioAnalysers.current.set(userId, analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    speakTimer.current.set(userId, setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      const speaking = avg > 15;
      setPeers((prev) =>
        prev.map((p) => (p.userId === userId ? { ...p, speaking, volume: Math.min(1, avg / 128) } : p))
      );
    }, 100));
  }

  const audioContext = useRef<AudioContext | null>(null);

  const createPeerConnection = useCallback((userId: string, stream: MediaStream | null) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
      ],
      iceCandidatePoolSize: 10,
    });

    if (stream) {
      for (const track of stream.getTracks()) {
        pc.addTrack(track, stream);
      }
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        getSocket().emit('voice:signal', {
          to: userId,
          signal: { type: 'ice-candidate', candidate: e.candidate },
        });
      }
    };

    pc.ontrack = (e) => {
      const remoteStream = e.streams[0];
      if (remoteStream) {
        setPeers((prev) => {
          const existing = prev.find((p) => p.userId === userId);
          if (existing) {
            return prev.map((p) =>
              p.userId === userId ? { ...p, stream: remoteStream, name: p.name } : p
            );
          }
          return [
            ...prev,
            { userId, name: getPlayerName(userId), stream: remoteStream, speaking: false, volume: 0 },
          ];
        });
        startSpeakingDetection(userId, remoteStream);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        cleanupPeer(userId);
      }
    };

    peerConnections.current.set(userId, pc);
    return pc;
  }, [gameState]);

  function cleanupPeer(userId: string) {
    const pc = peerConnections.current.get(userId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(userId);
    }
    const timer = speakTimer.current.get(userId);
    if (timer) {
      clearInterval(timer);
      speakTimer.current.delete(userId);
    }
    audioAnalysers.current.delete(userId);
    setPeers((prev) => prev.filter((p) => p.userId !== userId));
  }

  useEffect(() => {
    if (!enabled) return;

    const socket = getSocket();

    socket.on('voice:signal', async (data: { from: string; signal: unknown }) => {
      const signal = data.signal as { type: string; sdp?: string; candidate?: RTCIceCandidateInit };

      if (signal.type === 'offer') {
        const stream = localStream.current;
        const pc = createPeerConnection(data.from, stream);
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp! }));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('voice:signal', {
          to: data.from,
          signal: { type: 'answer', sdp: answer.sdp },
        });
      } else if (signal.type === 'answer') {
        const pc = peerConnections.current.get(data.from);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp! }));
        }
      } else if (signal.type === 'ice-candidate' && signal.candidate) {
        const pc = peerConnections.current.get(data.from);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      }
    });

    socket.on('voice:user-joined', async (data: { userId: string }) => {
      const stream = localStream.current;
      if (stream && data.userId !== socket.id) {
        setPeers((prev) => {
          if (prev.find((p) => p.userId === data.userId)) return prev;
          return [...prev, { userId: data.userId, name: getPlayerName(data.userId), stream: null, speaking: false, volume: 0 }];
        });
        const pc = createPeerConnection(data.userId, stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('voice:signal', {
          to: data.userId,
          signal: { type: 'offer', sdp: offer.sdp },
        });
      }
    });

    socket.on('voice:user-left', (data: { userId: string }) => {
      cleanupPeer(data.userId);
    });

    return () => {
      socket.off('voice:signal');
      socket.off('voice:user-joined');
      socket.off('voice:user-left');
    };
  }, [enabled, createPeerConnection]);

  const enable = useCallback(async () => {
    const stream = await initAudio();
    if (stream) {
      audioContext.current = new AudioContext();
      setEnabled(true);
      setMuted(false);
      getSocket().emit('voice:join');
    }
  }, [initAudio]);

  const disable = useCallback(() => {
    for (const [userId] of peerConnections.current) {
      cleanupPeer(userId);
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => t.stop());
      localStream.current = null;
    }
    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
    }
    setPeers([]);
    setEnabled(false);
    setMuted(true);
    setHasMedia(false);
    getSocket().emit('voice:leave');
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const newMuted = !prev;
      if (localStream.current) {
        localStream.current.getAudioTracks().forEach((t) => {
          t.enabled = !newMuted;
        });
      }
      return newMuted;
    });
  }, []);

  return { enabled, muted, peers, hasMedia, enable, disable, toggleMute };
}

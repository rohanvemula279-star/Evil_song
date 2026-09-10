import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  UploadCloud, Loader2, RefreshCw, Play, Pause, Volume2, VolumeX, 
  Disc, SkipBack, SkipForward, Music, FileAudio, Sparkles 
} from 'lucide-react';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export interface SongItem {
  song?: string;
  artist?: string;
  title?: string;
  name?: string;
  track?: string;
  creator?: string;
  singer?: string;
  'spotify track id'?: string;
  'track id'?: string;
  spotify_id?: string;
  id?: string;
  audio_url?: string;
  url?: string;
  link?: string;
  audio?: string;
  _audioUrl?: string;
  _imageUrl?: string;
  _previewUrl?: string;
  [key: string]: any;
}

interface SongCardProps {
  item: SongItem;
  index: number;
  assignRef: (el: HTMLButtonElement | null) => void;
  onClick: () => void;
  isPlaying: boolean;
  onTogglePlay: (index: number, item: SongItem) => void;
}

interface FilmstripCarouselProps {
  data: SongItem[];
  onReset: () => void;
}

interface UploadScreenProps {
  onDataLoaded: (data: SongItem[]) => void;
}

interface SynthAudioController {
  play: () => void;
  stop: () => void;
}

interface QueueItem {
  trackId?: string;
  query: string;
  index: number;
  resolve: (result: { imageUrl: string | null; previewUrl: string | null }) => void;
}

interface CarouselState {
  phase: number;
  target: number;
  base: number;
  pointerX: number;
  pointerY: number;
  active: boolean;
  lastInput: number;
  previousTime?: number;
}

const SCALE_FACTOR = 1.4; // Multiplier to increase overall card size safely

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

  :root {
    color-scheme: light;
    font-family: "Arial Narrow", "Helvetica Neue", Arial, sans-serif;
    background: #d8c9ad;
  }

  * {
    box-sizing: border-box;
  }

  html, body {
    width: 100%;
    height: 100%;
    margin: 0;
    overflow: hidden;
    background: #d8c9ad;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  button {
    font: inherit;
    border: none;
    padding: 0;
  }

  /* Stage gradients and background */
  .stage {
    --pointer-x: 50%;
    position: relative;
    width: 100vw;
    height: 100vh;
    min-height: 440px;
    overflow: hidden;
    isolation: isolate;
    perspective: 1450px;
    cursor: ew-resize;
    touch-action: none;
    background:
      linear-gradient(90deg, rgba(80, 58, 31, 0.08) 1px, transparent 1px) 50% 0 / 25% 100%,
      repeating-linear-gradient(
        0deg,
        transparent 0,
        transparent 109px,
        rgba(72, 52, 30, 0.13) 110px,
        transparent 111px
      ),
      radial-gradient(circle at var(--pointer-x) 48%, rgba(255, 246, 220, 0.78), transparent 34%),
      #d8c9ad;
  }

  .stage::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 5;
    pointer-events: none;
    opacity: 0.27;
    background:
      repeating-radial-gradient(circle at 12% 18%, rgba(71, 51, 30, 0.17) 0 0.5px, transparent 0.7px 4px),
      repeating-radial-gradient(circle at 78% 71%, rgba(255, 255, 255, 0.35) 0 0.5px, transparent 0.8px 5px);
    mix-blend-mode: multiply;
  }

  .stage::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 4;
    pointer-events: none;
    background: linear-gradient(
      90deg,
      rgba(84, 58, 29, 0.19),
      transparent 14%,
      transparent 86%,
      rgba(84, 58, 29, 0.19)
    );
  }

  .deck {
    position: absolute;
    inset: 0;
    z-index: 2;
    transform-style: preserve-3d;
  }

  /* Card styles */
  .card {
    --focus: 0;
    position: absolute;
    top: 50%;
    left: 50%;
    width: clamp(${154 * SCALE_FACTOR}px, ${16.8 * SCALE_FACTOR}vw, ${238 * SCALE_FACTOR}px);
    aspect-ratio: 0.72;
    padding: 7px;
    overflow: hidden;
    border: 1px solid rgba(47, 34, 19, 0.42);
    border-radius: 4px;
    color: #f3e7ce;
    background: #e7d9bd;
    box-shadow:
      0 calc(10px + var(--focus) * 24px) calc(18px + var(--focus) * 36px)
        rgba(57, 38, 19, calc(0.2 + var(--focus) * 0.26)),
      inset 0 0 0 1px rgba(255, 255, 255, 0.64);
    appearance: none;
    outline: none;
    transform-style: preserve-3d;
    will-change: transform, opacity, filter;
    cursor: pointer;
    transition: box-shadow 0.2s ease;
  }

  .card::before {
    content: "";
    position: absolute;
    inset: 5px;
    z-index: 3;
    border: 1px solid rgba(28, 22, 14, calc(0.12 + var(--focus) * 0.12));
    pointer-events: none;
  }

  .card:focus-visible {
    box-shadow:
      0 26px 50px rgba(57, 38, 19, 0.42),
      0 0 0 4px rgba(197, 79, 25, 0.34);
  }

  .portrait {
    position: absolute;
    inset: 7px 7px 25%;
    overflow: hidden;
    background: #766a58;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .portrait img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(calc(1.04 + (1 - var(--focus)) * 0.06));
    filter:
      sepia(calc((1 - var(--focus)) * 0.24))
      saturate(calc(0.66 + var(--focus) * 0.34))
      contrast(1.04);
    opacity: 0;
    transition: opacity 0.5s ease;
  }
  
  .portrait img.loaded {
    opacity: 1;
  }

  .play-overlay {
    position: absolute;
    inset: 0;
    background: rgba(23, 22, 18, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.25s ease;
    z-index: 20;
  }

  .card:hover .play-overlay,
  .card[aria-current="true"] .play-overlay,
  .card.is-playing .play-overlay {
    opacity: 1;
  }

  .footer {
    position: absolute;
    right: 7px;
    bottom: 7px;
    left: 7px;
    height: calc(25% - 7px);
    display: grid;
    grid-template-columns: clamp(${26 * SCALE_FACTOR}px, ${3.2 * SCALE_FACTOR}vw, ${43 * SCALE_FACTOR}px) 1fr;
    align-items: center;
    gap: clamp(${6 * SCALE_FACTOR}px, ${0.7 * SCALE_FACTOR}vw, ${11 * SCALE_FACTOR}px);
    padding: clamp(${7 * SCALE_FACTOR}px, ${0.8 * SCALE_FACTOR}vw, ${12 * SCALE_FACTOR}px);
    color: #f0dfc2;
    background: #171612;
    text-align: left;
  }

  .index {
    display: grid;
    width: clamp(${23 * SCALE_FACTOR}px, ${2.7 * SCALE_FACTOR}vw, ${37 * SCALE_FACTOR}px);
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid #ce5d20;
    border-radius: 50%;
    color: #d86724;
    font: 600 clamp(${7 * SCALE_FACTOR}px, ${0.68 * SCALE_FACTOR}vw, ${11 * SCALE_FACTOR}px)/1 ui-monospace, "SFMono-Regular", monospace;
  }

  .meta {
    min-width: 0;
  }

  .name, .role {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .name {
    color: #f3e6cc;
    font-size: clamp(${8 * SCALE_FACTOR}px, ${0.86 * SCALE_FACTOR}vw, ${13 * SCALE_FACTOR}px);
    font-weight: 800;
    letter-spacing: 0.08em;
    line-height: 1.1;
  }

  .role {
    margin-top: clamp(${3 * SCALE_FACTOR}px, ${0.35 * SCALE_FACTOR}vw, ${5 * SCALE_FACTOR}px);
    color: #d46a27;
    font-size: clamp(${5 * SCALE_FACTOR}px, ${0.48 * SCALE_FACTOR}vw, ${7 * SCALE_FACTOR}px);
    font-weight: 700;
    letter-spacing: 0.15em;
    line-height: 1;
  }

  /* Animated Visualizer Equalizer */
  .visualizer-bar {
    width: 3px;
    background-color: #d86724;
    border-radius: 2px;
    animation: bounce 0.8s ease-in-out infinite alternate;
  }
  .visualizer-bar:nth-child(1) { height: 60%; animation-delay: 0.1s; }
  .visualizer-bar:nth-child(2) { height: 100%; animation-delay: 0.3s; }
  .visualizer-bar:nth-child(3) { height: 40%; animation-delay: 0.2s; }
  .visualizer-bar:nth-child(4) { height: 80%; animation-delay: 0.4s; }

  @keyframes bounce {
    0% { transform: scaleY(0.3); }
    100% { transform: scaleY(1); }
  }

  @media (max-width: 650px) {
    .stage {
      min-height: 560px;
      cursor: ns-resize;
      background:
        linear-gradient(90deg, rgba(80, 58, 31, 0.08) 1px, transparent 1px) 50% 0 / 50% 100%,
        repeating-linear-gradient(
          0deg,
          transparent 0,
          transparent 87px,
          rgba(72, 52, 30, 0.13) 88px,
          transparent 89px
        ),
        radial-gradient(circle at 50% 50%, rgba(255, 246, 220, 0.78), transparent 35%),
        #d8c9ad;
    }

    .card {
      width: clamp(${142 * SCALE_FACTOR}px, ${47 * SCALE_FACTOR}vw, ${180 * SCALE_FACTOR}px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .card {
      will-change: auto;
    }
  }
`;

const DEMO_PLAYLIST: SongItem[] = [
  {
    song: "Midnight City Groove",
    artist: "Neon Syndicate",
    _audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    _imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80"
  },
  {
    song: "Starlight Drive",
    artist: "Retro Wave Orchestra",
    _audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    _imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80"
  },
  {
    song: "Velvet Horizon",
    artist: "Luna Sol",
    _audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    _imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80"
  },
  {
    song: "Cyber Pulse",
    artist: "Electro Vibe",
    _audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    _imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80"
  },
  {
    song: "Solar Echoes",
    artist: "Astra Sound",
    _audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    _imageUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80"
  },
  {
    song: "Golden Hour Serenade",
    artist: "Coastal Dreams",
    _audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    _imageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&auto=format&fit=crop&q=80"
  },
  {
    song: "Neon Sunset",
    artist: "Synth Dreamer",
    _audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    _imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80"
  },
  {
    song: "Celestial Highway",
    artist: "Cosmic Odyssey",
    _audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    _imageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&auto=format&fit=crop&q=80"
  }
];

const FALLBACK_AUDIO_STREAMS: string[] = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3"
];

const parseCSV = (text: string): SongItem[] => {
  const lines = text.split('\n');
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const results: SongItem[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    let inQuotes = false;
    let currentVal = '';
    const values: string[] = [];
    
    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentVal.trim());
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim());
    
    const obj: SongItem = {};
    headers.forEach((h, index) => {
      obj[h] = values[index] ? values[index].replace(/^"|"$/g, '') : '';
    });
    results.push(obj);
  }
  return results;
};

const getColumn = (row: SongItem, potentialKeys: string[]): string => {
  for (let key of potentialKeys) {
    const found = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
    if (found && row[found]) return String(row[found]);
  }
  return '';
};

// Rich Polyphonic Web Audio Synthesizer (for offline/fallback playback with harmonic chords & bass)
const createSynthAudio = (index: number, songName: string): SynthAudioController => {
  let ctx: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let timerId: ReturnType<typeof setInterval> | null = null;
  let isPlaying = false;

  return {
    play: () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();

        masterGain = ctx.createGain();
        masterGain.gain.value = 0.15;
        masterGain.connect(ctx.destination);

        const rootFreqs = [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63];
        const baseFreq = rootFreqs[index % rootFreqs.length];
        const chordOffsets = [1, 1.25, 1.5, 1.875];
        const bassOffset = 0.5;

        let step = 0;
        isPlaying = true;

        const playStep = () => {
          if (!isPlaying || !ctx || !masterGain) return;
          const now = ctx.currentTime;

          // Bass Note
          const bassOsc = ctx.createOscillator();
          const bassGain = ctx.createGain();
          bassOsc.type = 'triangle';
          bassOsc.frequency.setValueAtTime(baseFreq * bassOffset, now);
          bassGain.gain.setValueAtTime(0.001, now);
          bassGain.gain.linearRampToValueAtTime(0.18, now + 0.05);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          bassOsc.connect(bassGain);
          bassGain.connect(masterGain);
          bassOsc.start(now);
          bassOsc.stop(now + 0.46);

          // Chord Harmony Note
          const noteMultiplier = chordOffsets[step % chordOffsets.length];
          const melodyOsc = ctx.createOscillator();
          const melodyGain = ctx.createGain();
          melodyOsc.type = step % 2 === 0 ? 'sine' : 'sawtooth';
          melodyOsc.frequency.setValueAtTime(baseFreq * noteMultiplier * (step % 3 === 0 ? 2 : 1), now);
          
          melodyGain.gain.setValueAtTime(0.001, now);
          melodyGain.gain.linearRampToValueAtTime(0.12, now + 0.03);
          melodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

          melodyOsc.connect(melodyGain);
          melodyGain.connect(masterGain);
          melodyOsc.start(now);
          melodyOsc.stop(now + 0.4);

          step++;
        };

        playStep();
        timerId = setInterval(playStep, 280);
      } catch (e) {
        console.warn('Synth playback failed:', e);
      }
    },
    stop: () => {
      isPlaying = false;
      if (timerId) clearInterval(timerId);
      if (masterGain && ctx) {
        try {
          masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
          setTimeout(() => { if (ctx) ctx.close(); }, 150);
        } catch (e) {}
      }
    }
  };
};

const CONCURRENCY_LIMIT = 6;
let activeRequests = 0;
const requestQueue: QueueItem[] = [];
const artworkCache = new Map<string, { imageUrl: string | null; previewUrl: string | null }>();

const processQueue = async (): Promise<void> => {
  if (activeRequests >= CONCURRENCY_LIMIT || requestQueue.length === 0) return;
  const item = requestQueue.shift();
  if (!item) return;
  activeRequests++;
  const { trackId, query, index, resolve } = item;
  
  try {
    let imageUrl: string | null = null;
    let previewUrl: string | null = null;

    // 1. Try iTunes Search API
    try {
      const itunesRes = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=1`);
      if (itunesRes.ok) {
        const itunesData = await itunesRes.json();
        const result = itunesData.results?.[0];
        if (result?.artworkUrl100) imageUrl = result.artworkUrl100.replace('100x100bb', '600x600bb');
        if (result?.previewUrl) previewUrl = result.previewUrl;
      }
    } catch (error) {}

    // 2. Try Deezer API for preview audio / image if iTunes didn't return both
    if (!previewUrl || !imageUrl) {
      try {
        const deezerRes = await fetch(`https://api.deezer.com/search?q=${query}&limit=1`);
        if (deezerRes.ok) {
          const deezerData = await deezerRes.json();
          const track = deezerData.data?.[0];
          if (!imageUrl && track?.album?.cover_xl) imageUrl = track.album.cover_xl;
          if (!previewUrl && track?.preview) previewUrl = track.preview;
        }
      } catch (error) {}
    }

    // 3. Fallback audio stream if no API returned previewUrl
    if (!previewUrl) {
      previewUrl = FALLBACK_AUDIO_STREAMS[index % FALLBACK_AUDIO_STREAMS.length];
    }

    const result = { imageUrl, previewUrl };
    artworkCache.set(query, result);
    resolve(result);
  } catch(e) {
    const defaultStream = FALLBACK_AUDIO_STREAMS[index % FALLBACK_AUDIO_STREAMS.length];
    resolve({ imageUrl: null, previewUrl: defaultStream });
  } finally {
    activeRequests--;
    processQueue();
  }
};

const fetchArtwork = (songName: string, artistName: string, trackId: string | undefined, index: number): Promise<{ imageUrl: string | null; previewUrl: string | null }> => {
  return new Promise((resolve) => {
    const cleanSong = songName.replace(/\(.*\)/g, '').replace(/\[.*\]/g, '').trim();
    const cleanArtist = artistName.split(',')[0].trim();
    const query = encodeURIComponent(`${cleanSong} ${cleanArtist}`);
    const cached = artworkCache.get(query);
    if (cached) {
      resolve(cached);
      return;
    }
    requestQueue.push({ trackId, query, index, resolve });
    while (activeRequests < CONCURRENCY_LIMIT && requestQueue.length > 0) processQueue();
  });
};

const SongCard: React.FC<SongCardProps> = React.memo(({ item, index, assignRef, onClick, isPlaying, onTogglePlay }) => {
  const [image, setImage] = useState<string | null>(item._imageUrl || null);
  const [loaded, setLoaded] = useState<boolean>(false);
  
  const songName = item.song || getColumn(item, ['song', 'title', 'name', 'track']) || 'Unknown Track';
  const artistName = item.artist || getColumn(item, ['artist', 'creator', 'singer']) || 'Unknown Artist';
  const trackId = getColumn(item, ['spotify track id', 'track id', 'spotify_id', 'id']);

  useEffect(() => {
    let isActive = true;
    const loadData = async () => {
      if (item._audioUrl) {
        if (!image) {
          const fallbackText = encodeURIComponent(songName.substring(0, 2).toUpperCase());
          setImage(`https://ui-avatars.com/api/?name=${fallbackText}&background=766a58&color=f3e6cc&size=600&font-size=0.35&bold=true`);
        }
        item._previewUrl = item._audioUrl;
        if (isActive) setLoaded(true);
        return;
      }

      const { imageUrl, previewUrl } = await fetchArtwork(songName, artistName, trackId, index);
      if (isActive) {
        if (imageUrl) {
          setImage(imageUrl);
        } else {
          const fallbackText = encodeURIComponent(songName.substring(0, 2).toUpperCase());
          setImage(`https://ui-avatars.com/api/?name=${fallbackText}&background=766a58&color=f3e6cc&size=600&font-size=0.35&bold=true`);
        }
        item._previewUrl = previewUrl || item._audioUrl || FALLBACK_AUDIO_STREAMS[index % FALLBACK_AUDIO_STREAMS.length];
      }
    };
    loadData();
    return () => { isActive = false; };
  }, [songName, artistName, trackId, item, index, image]);

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
    onTogglePlay(index, item);
  };

  return (
    <button 
      className={`card ${isPlaying ? 'is-playing' : ''}`}
      type="button"
      ref={assignRef}
      onClick={handleCardClick}
      onFocus={onClick}
      aria-label={`Play ${songName} by ${artistName}`}
    >
      <span className="portrait">
        {!loaded && <Loader2 className="w-8 h-8 text-[#d86724] animate-spin absolute z-10" />}
        {image && (
          <img 
            src={image} 
            alt={songName}
            className={loaded ? 'loaded' : ''}
            onLoad={() => setLoaded(true)}
            draggable="false"
          />
        )}
        
        {/* Play/Pause Overlay Icon */}
        <div className="play-overlay">
          <div className="w-12 h-12 rounded-full bg-[#d86724] text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-110">
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </div>
        </div>
      </span>
      
      <span className="footer">
        <span className="index flex items-center justify-center">
          {isPlaying ? (
            <Volume2 className="w-4 h-4 text-[#d86724] animate-pulse" />
          ) : (
            (index + 1).toString().padStart(2, "0")
          )}
        </span>
        <span className="meta">
          <span className="name">{songName}</span>
          <span className="role">{artistName}</span>
        </span>
      </span>
    </button>
  );
});

const FilmstripCarousel: React.FC<FilmstripCarouselProps> = ({ data, onReset }) => {
  const stageRef = useRef<HTMLElement | null>(null);
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const requestRef = useRef<number | undefined>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SynthAudioController | null>(null);
  
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrackMeta, setCurrentTrackMeta] = useState<{ songName: string; artistName: string } | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const count = data.length;

  const state = useRef<CarouselState>({
    phase: 3,
    target: 3,
    base: 3,
    pointerX: 0,
    pointerY: 0,
    active: false,
    lastInput: performance.now()
  });

  const stopAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (synthRef.current) {
      synthRef.current.stop();
      synthRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const formatTime = (timeInSeconds: number): string => {
    if (!timeInSeconds || isNaN(timeInSeconds)) return "0:00";
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startTrackPlayback = useCallback((index: number, item: SongItem, songName: string, artistName: string) => {
    stopAllAudio();
    setPlayingIndex(index);
    setCurrentTrackMeta({ songName, artistName });

    const previewUrl = item._previewUrl || item._audioUrl || getColumn(item, ['audio_url', 'url', 'link', 'audio']) || FALLBACK_AUDIO_STREAMS[index % FALLBACK_AUDIO_STREAMS.length];

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = "anonymous";
    }

    const audio = audioRef.current;
    audio.volume = isMuted ? 0 : volume;

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    audio.onended = () => {
      const nextIndex = (index + 1) % data.length;
      const nextItem = data[nextIndex];
      const nextSongName = nextItem.song || getColumn(nextItem, ['song', 'title', 'name', 'track']) || 'Unknown Track';
      const nextArtistName = nextItem.artist || getColumn(nextItem, ['artist', 'creator', 'singer']) || 'Unknown Artist';
      startTrackPlayback(nextIndex, nextItem, nextSongName, nextArtistName);
    };

    audio.src = previewUrl;
    audio.play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch((err) => {
        console.warn('Network audio stream prevented or failed, using synth fallback music:', err);
        synthRef.current = createSynthAudio(index, songName);
        synthRef.current.play();
        setIsPlaying(true);
      });
  }, [stopAllAudio, isMuted, volume, data]);

  const togglePlayTrack = useCallback((index: number, item: SongItem) => {
    const songName = item.song || getColumn(item, ['song', 'title', 'name', 'track']) || 'Unknown Track';
    const artistName = item.artist || getColumn(item, ['artist', 'creator', 'singer']) || 'Unknown Artist';

    if (playingIndex === index) {
      if (isPlaying) {
        if (audioRef.current) audioRef.current.pause();
        if (synthRef.current) synthRef.current.stop();
        setIsPlaying(false);
      } else {
        if (audioRef.current && audioRef.current.src) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        } else if (synthRef.current) {
          synthRef.current.play();
          setIsPlaying(true);
        } else {
          startTrackPlayback(index, item, songName, artistName);
        }
      }
      return;
    }

    startTrackPlayback(index, item, songName, artistName);
  }, [playingIndex, isPlaying, startTrackPlayback]);

  const handleNextTrack = () => {
    if (playingIndex === null) return;
    const nextIndex = (playingIndex + 1) % data.length;
    togglePlayTrack(nextIndex, data[nextIndex]);
  };

  const handlePrevTrack = () => {
    if (playingIndex === null) return;
    const prevIndex = (playingIndex - 1 + data.length) % data.length;
    togglePlayTrack(prevIndex, data[prevIndex]);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current && duration) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
    if (val > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const wrappedDelta = useCallback((index: number, phase: number) => {
    let delta = index - phase;
    while (delta > count / 2) delta -= count;
    while (delta < -count / 2) delta += count;
    return delta;
  }, [count]);

  const nearestIndex = useCallback(() => {
    return (Math.round(state.current.phase) % count + count) % count;
  }, [count]);

  const moveTo = useCallback((index: number) => {
    const current = nearestIndex();
    let delta = index - current;
    if (delta > count / 2) delta -= count;
    if (delta < -count / 2) delta += count;
    state.current.base += delta;
    state.current.target = state.current.base;
    state.current.active = false;
    state.current.lastInput = performance.now();
  }, [count, nearestIndex]);

  const renderLoop = useCallback((time: number) => {
    const st = state.current;
    if (!st.previousTime) st.previousTime = time;
    const deltaTime = Math.min(32, time - st.previousTime);
    st.previousTime = time;
    
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ease = reducedMotion ? 1 : 1 - Math.pow(0.001, deltaTime / 1000);

    if (!st.active && time - st.lastInput > 3600) {
      const idle = time - st.lastInput - 3600;
      st.target = st.base + Math.sin(idle * 0.00042) * 2.45;
    }

    st.phase += (st.target - st.phase) * ease;
    const compact = window.innerWidth < 650;
    const activeIndex = nearestIndex();
    
    const horizontalSpacing = Math.min(168 * SCALE_FACTOR, Math.max(112 * SCALE_FACTOR, window.innerWidth * 0.116 * SCALE_FACTOR));
    const verticalSpacing = Math.min(122 * SCALE_FACTOR, Math.max(88 * SCALE_FACTOR, window.innerHeight * 0.112 * SCALE_FACTOR));

    cardsRef.current.forEach((card, index) => {
      if (!card) return;
      
      const delta = wrappedDelta(index, st.phase);
      const distance = Math.abs(delta);
      const focus = Math.exp(-distance * distance * 1.28);
      const side = Math.max(0, 1 - distance / 5);
      const direction = Math.sign(delta);
      
      const x = compact
        ? delta * 24 + Math.sin(delta * 0.9) * 25
        : delta * horizontalSpacing;
      const y = compact
        ? delta * verticalSpacing
        : distance * 8 + st.pointerY * focus * 10;
      const z = focus * 145 - distance * 148;
      const scale = 0.54 + side * 0.15 + focus * 0.54;
      const rotateX = compact ? delta * 2.1 : -st.pointerY * focus * 3.5;
      const rotateY = compact
        ? -delta * 5
        : -direction * (distance > 0.2 ? 14 + Math.min(distance, 3) * 5 : 0) + st.pointerX * focus * 3;
      const rotateZ = compact ? delta * -1.4 : delta * 0.7;

      card.style.setProperty("--focus", focus.toFixed(4));
      card.style.zIndex = String(Math.round(1000 - distance * 100));
      card.style.opacity = String(Math.max(0.13, side * 0.76 + focus * 0.24));
      card.style.filter = `blur(${Math.max(0, distance - 1.5) * 0.38}px)`;
      card.style.transform = [
        "translate(-50%, -50%)",
        `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px)`,
        `rotateX(${rotateX.toFixed(2)}deg)`,
        `rotateY(${rotateY.toFixed(2)}deg)`,
        `rotateZ(${rotateZ.toFixed(2)}deg)`,
        `scale(${scale.toFixed(4)})`
      ].join(" ");
      
      card.setAttribute("aria-current", index === activeIndex ? "true" : "false");
    });

    requestRef.current = requestAnimationFrame(renderLoop);
  }, [count, nearestIndex, wrappedDelta]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [renderLoop]);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
    const ny = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
    
    state.current.pointerX = nx;
    state.current.pointerY = ny;
    state.current.active = true;
    state.current.target = state.current.base + (window.innerWidth < 650 ? ny * 2.2 : nx * 3.1);
    state.current.lastInput = performance.now();
    stage.style.setProperty("--pointer-x", `${(nx + 1) * 50}%`);
  };

  const handlePointerLeave = () => {
    state.current.active = false;
    state.current.pointerX = 0;
    state.current.pointerY = 0;
    state.current.target = state.current.base;
    if (stageRef.current) stageRef.current.style.setProperty("--pointer-x", "50%");
  };

  const handleWheel = (event: React.WheelEvent<HTMLElement>) => {
    const direction = Math.sign(Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX);
    if (!direction) return;
    state.current.base += direction;
    state.current.target = state.current.base;
    state.current.active = false;
    state.current.lastInput = performance.now();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
      const backward = event.key === "ArrowLeft" || event.key === "ArrowUp";
      if (!forward && !backward) return;
      state.current.base += forward ? 1 : -1;
      state.current.target = state.current.base;
      state.current.active = false;
      state.current.lastInput = performance.now();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <main 
        className="stage" 
        id="stage"
        ref={stageRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onWheel={handleWheel}
        aria-label="Interactive editorial filmstrip"
      >
        <div className="deck" id="deck" data-testid="filmstrip">
          {data.map((item, index) => (
            <SongCard 
              key={index} 
              item={item} 
              index={index} 
              onClick={() => moveTo(index)}
              isPlaying={playingIndex === index && isPlaying}
              onTogglePlay={togglePlayTrack}
              assignRef={(el) => { cardsRef.current[index] = el; }} 
            />
          ))}
        </div>
      </main>

      {/* Top Header */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 text-center pointer-events-none opacity-90 mix-blend-multiply">
        <h1 className="text-3xl md:text-5xl font-bold tracking-[0.2em] text-[#2f2213] mb-2 uppercase drop-shadow-sm font-serif flex items-center justify-center gap-3">
          <Music className="w-7 h-7 text-[#d86724]" /> Evil Songs
        </h1>
        <p className="text-[10px] md:text-xs uppercase tracking-widest text-[#444] bg-[#e7d9bd]/90 px-4 py-1.5 rounded-full border border-[#2f2213]/20 inline-block backdrop-blur-sm shadow-md font-bold">
          {data.length} Tracks • Click any card to play song audio
        </p>
      </div>

      {/* Advanced Bottom Music Player Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-3xl bg-[#171612] text-[#f3e6cc] border border-[#d86724]/60 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl pointer-events-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Track Meta Info & Visualizer */}
        <div className="flex items-center gap-4 min-w-[200px] w-full md:w-auto">
          <div className="relative">
            <Disc className={`w-10 h-10 text-[#d86724] ${isPlaying ? 'animate-spin' : ''}`} />
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center gap-0.5 bg-[#171612]/70 rounded-full">
                <div className="visualizer-bar"></div>
                <div className="visualizer-bar"></div>
                <div className="visualizer-bar"></div>
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold uppercase tracking-wider text-[#f3e6cc] truncate max-w-[200px]">
              {currentTrackMeta ? currentTrackMeta.songName : 'Select a Song'}
            </span>
            <span className="text-xs text-[#d46a27] uppercase tracking-widest font-semibold truncate max-w-[200px]">
              {currentTrackMeta ? currentTrackMeta.artistName : 'Click play on filmstrip'}
            </span>
          </div>
        </div>

        {/* Player Controls & Scrubber */}
        <div className="flex flex-col items-center gap-1.5 w-full max-w-md">
          <div className="flex items-center gap-4">
            <button 
              onClick={handlePrevTrack}
              className="text-[#f3e6cc]/80 hover:text-[#d86724] transition-colors p-1"
              aria-label="Previous Track"
            >
              <SkipBack size={18} />
            </button>
            <button 
              onClick={() => {
                if (playingIndex !== null) {
                  togglePlayTrack(playingIndex, data[playingIndex]);
                } else if (data.length > 0) {
                  togglePlayTrack(0, data[0]);
                }
              }}
              className="bg-[#d86724] text-white p-2.5 rounded-full hover:scale-105 transition-transform shadow-lg"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>
            <button 
              onClick={handleNextTrack}
              className="text-[#f3e6cc]/80 hover:text-[#d86724] transition-colors p-1"
              aria-label="Next Track"
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* Time Scrubber */}
          <div className="flex items-center gap-2 w-full text-[10px] font-mono text-[#d46a27]">
            <span>{formatTime(currentTime)}</span>
            <input 
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-[#2a2821] rounded-lg appearance-none cursor-pointer accent-[#d86724]"
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & File Buttons */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-[#d86724] hover:scale-110 transition-transform">
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={isMuted ? 0 : volume} 
              onChange={handleVolumeChange}
              className="w-16 h-1.5 bg-[#2a2821] rounded-lg appearance-none cursor-pointer accent-[#d86724]"
            />
          </div>

          <button 
            onClick={() => {
              stopAllAudio();
              onReset();
            }}
            className="flex items-center gap-1.5 bg-[#2a2821] text-[#f3e6cc] border border-[#d46a27]/40 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-[#d86724] hover:text-white transition-all shadow-md"
            title="Change Track List / Upload New CSV or Audio Files"
          >
            <RefreshCw size={13} /> New List
          </button>
        </div>

      </div>
    </div>
  );
};

const UploadScreen: React.FC<UploadScreenProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleCSVText = (text: string) => {
    try {
      const parsed = parseCSV(text);
      if (parsed.length > 0) {
        onDataLoaded(parsed);
      } else {
        setError("The CSV file appears to be empty.");
      }
    } catch (err) {
      setError("Failed to parse CSV file.");
    }
  };

  const handleAudioFiles = (files: File[] | FileList) => {
    const audioList = Array.from(files).filter(f => f.type.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(f.name));
    if (audioList.length === 0) {
      setError("No valid audio files found.");
      return;
    }

    const songData: SongItem[] = audioList.map(file => {
      const nameParts = file.name.replace(/\.[^/.]+$/, "").split(" - ");
      const songName = nameParts.length > 1 ? nameParts[1] : nameParts[0];
      const artistName = nameParts.length > 1 ? nameParts[0] : "Local Audio";
      const audioUrl = URL.createObjectURL(file);

      return {
        song: songName,
        artist: artistName,
        _audioUrl: audioUrl
      };
    });

    onDataLoaded(songData);
  };

  const handleFile = (file: File) => {
    if (!file) return;
    if (file.type === "text/csv" || file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) handleCSVText(e.target.result as string);
      };
      reader.readAsText(file);
    } else if (file.type.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(file.name)) {
      handleAudioFiles([file]);
    } else {
      setError("Please upload a CSV file or Audio (.mp3, .wav, .m4a) files.");
    }
  };

  const handleMultipleFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const csvFile = files.find(f => f.name.endsWith('.csv'));
    if (csvFile) {
      handleFile(csvFile);
    } else {
      handleAudioFiles(files);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center relative z-50 p-6 bg-[#d8c9ad] font-sans">
      <div className="max-w-xl w-full bg-[#e7d9bd] border border-[#2f2213]/40 rounded-2xl shadow-2xl p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#171612] via-[#d86724] to-[#171612]"></div>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#171612] mb-3 tracking-wider uppercase font-serif flex items-center justify-center gap-3">
            <Music className="w-9 h-9 text-[#d86724]" /> Evil Songs
          </h1>
          <p className="text-[#392613] text-sm leading-relaxed tracking-wide font-medium">
            Upload your <strong className="text-black bg-white/40 px-2 py-0.5 rounded">Spotify CSV</strong> or <strong className="text-black bg-white/40 px-2 py-0.5 rounded">MP3 Audio Files</strong> to build the interactive song filmstrip.
          </p>
        </div>

        {/* Action: Try Demo Playlist */}
        <div className="mb-6">
          <button 
            onClick={() => onDataLoaded(DEMO_PLAYLIST)}
            className="w-full bg-[#171612] hover:bg-[#2a2821] text-[#f3e6cc] border-2 border-[#d86724] py-3.5 px-6 rounded-xl font-bold text-sm uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 group"
          >
            <Sparkles className="w-5 h-5 text-[#d86724] group-hover:rotate-12 transition-transform" />
            <span>Load Demo Playlist (Instant Playable Music)</span>
          </button>
        </div>

        <div className="relative flex items-center my-6">
          <div className="flex-grow border-t border-[#2f2213]/20"></div>
          <span className="flex-shrink mx-4 text-xs uppercase font-bold text-[#66543e] tracking-widest">or upload your files</span>
          <div className="flex-grow border-t border-[#2f2213]/20"></div>
        </div>

        {/* Drop Zone */}
        <div 
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3
            ${isDragging ? 'border-[#d86724] bg-white/30 scale-[0.99]' : 'border-[#2f2213]/30 hover:border-[#d86724] hover:bg-white/10'}
          `}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            setError('');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleMultipleFiles(e.dataTransfer.files);
            }
          }}
          onClick={() => {
            const inputEl = document.getElementById('file-upload') as HTMLInputElement | null;
            if (inputEl) inputEl.click();
          }}
        >
          <div className="w-14 h-14 bg-[#171612] text-[#f3e6cc] rounded-full flex items-center justify-center mb-1 shadow-inner">
            <UploadCloud size={28} />
          </div>
          <h3 className="font-bold text-base text-[#171612] uppercase tracking-wider">Click or Drag & Drop Files</h3>
          <p className="text-[#d86724] font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <FileAudio size={14} /> CSV Playlist or MP3/Audio Files
          </p>
          <input 
            type="file" 
            id="file-upload" 
            accept=".csv, audio/*, .mp3, .wav, .m4a, .ogg" 
            multiple
            className="hidden" 
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleMultipleFiles(e.target.files);
              }
            }}
          />
        </div>

        {error && (
          <div className="mt-5 p-3.5 bg-red-900/10 text-red-900 border border-red-900/30 rounded-xl text-sm text-center font-bold">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [songsData, setSongsData] = useState<SongItem[] | null>(null);

  return (
    <>
      <style>{globalStyles}</style>
      
      {!songsData ? (
        <UploadScreen onDataLoaded={setSongsData} />
      ) : (
        <FilmstripCarousel 
          data={songsData} 
          onReset={() => setSongsData(null)} 
        />
      )}
    </>
  );
}
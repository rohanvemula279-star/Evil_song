import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UploadCloud, Loader2, RefreshCw } from 'lucide-react';

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

  /* Exactly matching the stage gradients and background from the source */
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

  /* Exact card styles with dimensions scaled up */
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

const parseCSV = (text) => {
  const lines = text.split('\n');
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    let inQuotes = false;
    let currentVal = '';
    const values = [];
    
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
    
    const obj = {};
    headers.forEach((h, index) => {
      obj[h] = values[index] ? values[index].replace(/^"|"$/g, '') : '';
    });
    results.push(obj);
  }
  return results;
};

const getColumn = (row, potentialKeys) => {
  for (let key of potentialKeys) {
    const found = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
    if (found && row[found]) return row[found];
  }
  return '';
};

const CONCURRENCY_LIMIT = 6;
let activeRequests = 0;
const requestQueue = [];
const artworkCache = new Map();

const processQueue = async () => {
  if (activeRequests >= CONCURRENCY_LIMIT || requestQueue.length === 0) return;
  activeRequests++;
  const { trackId, query, resolve } = requestQueue.shift();
  
  try {
    let imageUrl = null;
    let previewUrl = null;

    // Use public music catalogs so every card can show real cover art from the web.
    try {
      const itunesRes = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
      if (itunesRes.ok) {
        const itunesData = await itunesRes.json();
        const result = itunesData.results?.[0];
        const artwork = result?.artworkUrl100;
        if (artwork) imageUrl = artwork.replace('100x100bb', '600x600bb');
        previewUrl = result?.previewUrl || null;
      }
    } catch (error) {
      // Continue to the next catalog when a provider is unavailable.
    }

    if (!imageUrl) {
      try {
        const deezerRes = await fetch(`https://api.deezer.com/search?q=${query}&limit=1`);
        if (deezerRes.ok) {
          const deezerData = await deezerRes.json();
          imageUrl = deezerData.data?.[0]?.album?.cover_xl || null;
        }
      } catch (error) {
        // Continue to Spotify when the second provider is unavailable.
      }
    }

    const spotifyId = trackId?.match(/(?:track[/:])([A-Za-z0-9]{22})/)?.[1] ||
      (trackId?.length === 22 ? trackId : null);
    if (!imageUrl && spotifyId) {
      try {
        const spotRes = await fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/track/${spotifyId}`);
        if (spotRes.ok) {
          const spotData = await spotRes.json();
          if (spotData.thumbnail_url) imageUrl = spotData.thumbnail_url;
        }
      } catch (error) {
        // The local initials artwork below is the final offline fallback.
      }
    }
    const result = { imageUrl, previewUrl };
    artworkCache.set(query, result);
    resolve(result);
  } catch(e) {
    resolve({ imageUrl: null, previewUrl: null });
  } finally {
    activeRequests--;
    processQueue();
  }
};

const fetchArtwork = (songName, artistName, trackId) => {
  return new Promise((resolve) => {
    const cleanSong = songName.replace(/\(.*\)/g, '').replace(/\[.*\]/g, '').trim();
    const cleanArtist = artistName.split(',')[0].trim();
    const query = encodeURIComponent(`${cleanSong} ${cleanArtist}`);
    const cached = artworkCache.get(query);
    if (cached) {
      resolve(cached);
      return;
    }
    requestQueue.push({ trackId, query, resolve });
    while (activeRequests < CONCURRENCY_LIMIT && requestQueue.length > 0) processQueue();
  });
};

const SongCard = React.memo(({ item, index, assignRef, onClick, onPlay }) => {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loaded, setLoaded] = useState(false);
  
  const songName = getColumn(item, ['song', 'title', 'name', 'track']) || 'Unknown Track';
  const artistName = getColumn(item, ['artist', 'creator', 'singer']) || 'Unknown Artist';
  const trackId = getColumn(item, ['spotify track id', 'track id', 'spotify_id', 'id']);

  useEffect(() => {
    let isActive = true;
    const loadData = async () => {
      const { imageUrl, previewUrl: nextPreviewUrl } = await fetchArtwork(songName, artistName, trackId);
      if (isActive) {
        if (imageUrl) {
          setImage(imageUrl);
        } else {
          const fallbackText = encodeURIComponent(songName.substring(0, 2).toUpperCase());
          setImage(`https://ui-avatars.com/api/?name=${fallbackText}&background=766a58&color=f3e6cc&size=600&font-size=0.35&bold=true`);
        }
        setPreviewUrl(nextPreviewUrl);
      }
    };
    loadData();
    return () => { isActive = false; };
  }, [songName, artistName, trackId]);

  return (
    <button 
      className="card"
      type="button"
      ref={assignRef}
      onClick={onClick}
      onFocus={onClick}
      onPointerDown={() => previewUrl && onPlay(previewUrl)}
      aria-label={`Focus ${songName}, ${artistName}`}
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
      </span>
      <span className="footer">
        <span className="index">{(index + 1).toString().padStart(2, "0")}</span>
        <span className="meta">
          <span className="name">{songName}</span>
          <span className="role">{artistName}</span>
        </span>
      </span>
    </button>
  );
});

const FilmstripCarousel = ({ data, onReset }) => {
  const stageRef = useRef(null);
  const cardsRef = useRef([]);
  const requestRef = useRef();
  const audioRef = useRef(null);
  const count = data.length;

  const state = useRef({
    phase: 3,
    target: 3,
    base: 3,
    pointerX: 0,
    pointerY: 0,
    active: false,
    lastInput: performance.now()
  });

  const wrappedDelta = useCallback((index, phase) => {
    let delta = index - phase;
    while (delta > count / 2) delta -= count;
    while (delta < -count / 2) delta += count;
    return delta;
  }, [count]);

  const nearestIndex = useCallback(() => {
    return (Math.round(state.current.phase) % count + count) % count;
  }, [count]);

  const moveTo = useCallback((index) => {
    const current = nearestIndex();
    let delta = index - current;
    if (delta > count / 2) delta -= count;
    if (delta < -count / 2) delta += count;
    state.current.base += delta;
    state.current.target = state.current.base;
    state.current.active = false;
    state.current.lastInput = performance.now();
  }, [count, nearestIndex]);

  const playPreview = useCallback((previewUrl) => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    if (audio.src !== previewUrl) {
      audio.src = previewUrl;
      audio.preload = "auto";
      audio.load();
    }
    audio.play().catch(() => {
      // Browsers may require the first play to come from a direct user gesture.
    });
  }, []);

  // Apply math loop directly to refs for buttery 60fps avoiding React state
  const renderLoop = useCallback((time) => {
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
    
    // Scale spacings perfectly
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
    return () => cancelAnimationFrame(requestRef.current);
  }, [renderLoop]);

  const handlePointerMove = (event) => {
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

  const handleWheel = (event) => {
    const direction = Math.sign(Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX);
    if (!direction) return;
    state.current.base += direction;
    state.current.target = state.current.base;
    state.current.active = false;
    state.current.lastInput = performance.now();
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
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
              onPlay={playPreview}
              assignRef={(el) => (cardsRef.current[index] = el)} 
            />
          ))}
        </div>
      </main>

      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 text-center pointer-events-none opacity-90 mix-blend-multiply">
        <h1 className="text-3xl md:text-5xl font-bold tracking-[0.2em] text-[#2f2213] mb-2 uppercase drop-shadow-sm font-serif">
          Evil Songs
        </h1>
        <p className="text-[10px] md:text-xs uppercase tracking-widest text-[#444] bg-[#e7d9bd]/80 px-4 py-1 rounded border border-[#2f2213]/20 inline-block backdrop-blur-sm shadow-sm font-bold">
          {data.length} Tracks • Scroll or click to explore
        </p>
      </div>

      <button 
        onClick={onReset}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-2 bg-[#171612] text-[#f3e6cc] border border-[#d46a27] px-5 py-3 rounded text-xs font-bold uppercase tracking-widest hover:bg-[#2a2821] hover:scale-105 transition-all shadow-xl pointer-events-auto"
      >
        <RefreshCw size={14} /> New File
      </button>
    </div>
  );
};

const UploadScreen = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (file) => {
    if (file && (file.type === "text/csv" || file.name.endsWith('.csv'))) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = parseCSV(e.target.result);
          if (parsed.length > 0) {
            onDataLoaded(parsed);
          } else {
            setError("The CSV file appears to be empty.");
          }
        } catch (err) {
          setError("Failed to parse CSV file.");
        }
      };
      reader.readAsText(file);
    } else {
      setError("Please upload a valid CSV file.");
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center relative z-50 p-6 bg-[#d8c9ad] font-sans">
      <div className="max-w-xl w-full bg-[#e7d9bd] border border-[#2f2213]/40 rounded-xl shadow-2xl p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#171612] to-[#d86724]"></div>
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[#171612] mb-4 tracking-wider uppercase font-serif">Evil Songs</h1>
          <p className="text-[#392613] text-sm leading-relaxed tracking-wide font-bold">
            Upload your <strong className="text-black bg-white/30 px-2 py-0.5 rounded">Spotify Song List CSV</strong> to build the interactive cinematic rail.
          </p>
        </div>

        <div 
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4
            ${isDragging ? 'border-[#d86724] bg-white/20' : 'border-[#2f2213]/30 hover:border-[#d86724] hover:bg-white/10'}
          `}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            setError('');
            handleFile(e.dataTransfer.files[0]);
          }}
          onClick={() => document.getElementById('csv-upload').click()}
        >
          <div className="w-16 h-16 bg-[#171612] text-[#f3e6cc] rounded-full flex items-center justify-center mb-2 shadow-inner">
            <UploadCloud size={32} />
          </div>
          <h3 className="font-bold text-lg text-[#171612] uppercase tracking-wider">Click or drag & drop</h3>
          <p className="text-[#d86724] font-bold text-xs uppercase tracking-widest">CSV files only</p>
          <input 
            type="file" 
            id="csv-upload" 
            accept=".csv" 
            className="hidden" 
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-900/10 text-red-900 border border-red-900/30 rounded-lg text-sm text-center font-bold">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [songsData, setSongsData] = useState(null);

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
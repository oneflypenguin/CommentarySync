import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Eye, EyeOff, Volume1, Volume, Loader2, FastForward, Rewind } from 'lucide-react';

interface MediaControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  title: string;
  isPlaying: boolean;
  isMuted: boolean;
  isHidden: boolean;
  volume: number;
  isLoading: boolean;
  isFullscreen: boolean;
  playbackRate: number;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onVolumeChange: (value: number) => void;
  onSeek: (seconds: number) => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleHide: () => void;
  onToggleFullscreen: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onMasterPlayPause?: () => void;
  onMasterMute?: () => void;
  allPlaying?: boolean;
  allMuted?: boolean;
}

const MediaControls: React.FC<MediaControlsProps> = ({
  videoRef,
  title,
  isPlaying,
  isMuted,
  isHidden,
  volume,
  isLoading,
  isFullscreen,
  playbackRate,
  onPlayPause,
  onMuteToggle,
  onVolumeChange,
  onSeek,
  onFileSelect,
  onToggleHide,
  onToggleFullscreen,
  onPlaybackRateChange,
  onMasterPlayPause,
  onMasterMute,
  allPlaying,
  allMuted,
}) => {
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number>();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPlaybackMenu, setShowPlaybackMenu] = useState(false);

  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const VolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX size={20} />;
    if (volume < 0.3) return <Volume size={20} />;
    if (volume < 0.7) return <Volume1 size={20} />;
    return <Volume2 size={20} />;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    let rafId: number;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration);
      rafId = requestAnimationFrame(updateTime);
    };

    video.addEventListener('loadedmetadata', () => {
      setDuration(video.duration);
    });

    video.addEventListener('play', () => {
      rafId = requestAnimationFrame(updateTime);
    });

    video.addEventListener('pause', () => {
      cancelAnimationFrame(rafId);
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [videoRef]);

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = window.setTimeout(() => {
        if (isFullscreen && isPlaying) {
          setShowControls(false);
          setShowPlaybackMenu(false);
        }
      }, 3000);
    };

    if (isFullscreen) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isFullscreen, isPlaying]);

  const handleTimeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    videoRef.current.currentTime = newTime;
  };

  return (
    <div 
      className={`relative transition-opacity duration-300 ${
        isFullscreen ? 'absolute inset-0 bg-black/50' : 'bg-gray-800 p-6 rounded-xl shadow-lg'
      } ${!showControls && isFullscreen ? 'opacity-0' : 'opacity-100'}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isFullscreen && isPlaying && setShowControls(false)}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center rounded-xl z-20">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      <div className={`flex flex-col ${isFullscreen ? 'h-full justify-between p-6' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-white text-lg font-semibold">{title}</h3>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-500 rounded-full text-xs text-white">
                {duration ? `${formatTime(currentTime)} / ${formatTime(duration)}` : '0:00 / 0:00'}
              </span>
              <div className="relative">
                <button
                  onClick={() => setShowPlaybackMenu(!showPlaybackMenu)}
                  className="px-2 py-1 bg-blue-500 rounded-full text-xs text-white hover:bg-blue-600 transition-colors"
                >
                  {playbackRate}x
                </button>
                {showPlaybackMenu && (
                  <div className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-lg shadow-lg p-2 z-10">
                    {playbackRates.map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          onPlaybackRateChange(rate);
                          setShowPlaybackMenu(false);
                        }}
                        className={`block w-full text-left px-4 py-1 text-sm rounded hover:bg-gray-700 ${
                          rate === playbackRate ? 'text-blue-400' : 'text-white'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {isFullscreen && onMasterPlayPause && (
              <button
                onClick={onMasterPlayPause}
                className="p-2 bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                disabled={isLoading}
              >
                {allPlaying ? 
                  <Pause className="text-white" size={20} /> : 
                  <Play className="text-white" size={20} />
                }
              </button>
            )}
            {isFullscreen && onMasterMute && (
              <button
                onClick={onMasterMute}
                className="p-2 bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                disabled={isLoading}
              >
                {allMuted ? 
                  <VolumeX className="text-white" size={20} /> : 
                  <Volume2 className="text-white" size={20} />
                }
              </button>
            )}
            <button
              onClick={onToggleHide}
              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              title={isHidden ? "Show player" : "Hide player"}
            >
              {isHidden ? 
                <Eye className="text-white" size={20} /> : 
                <EyeOff className="text-white" size={20} />
              }
            </button>
            <button
              onClick={onToggleFullscreen}
              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              title="Toggle fullscreen"
            >
              <Maximize2 className="text-white" size={20} />
            </button>
          </div>
        </div>

        <div className={`flex-grow ${isFullscreen ? 'flex items-center justify-center' : ''}`}>
          {/* Main Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={onPlayPause}
                className="p-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isPlaying ? 
                  <Pause className="text-white" size={24} /> : 
                  <Play className="text-white" size={24} />
                }
              </button>
              
              <div className="flex flex-col gap-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => onSeek(-1)}
                    className="px-3 py-1.5 bg-gray-700 rounded text-white text-xs hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                    disabled={isLoading}
                  >
                    <Rewind size={12} />
                    1s
                  </button>
                  <button
                    onClick={() => onSeek(-5)}
                    className="px-3 py-1.5 bg-gray-700 rounded text-white text-xs hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                    disabled={isLoading}
                  >
                    <Rewind size={12} />
                    5s
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onSeek(1)}
                    className="px-3 py-1.5 bg-gray-700 rounded text-white text-xs hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                    disabled={isLoading}
                  >
                    1s
                    <FastForward size={12} />
                  </button>
                  <button
                    onClick={() => onSeek(5)}
                    className="px-3 py-1.5 bg-gray-700 rounded text-white text-xs hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                    disabled={isLoading}
                  >
                    5s
                    <FastForward size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Volume Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={onMuteToggle}
                className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                <VolumeIcon />
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={(e) => onVolumeChange(parseInt(e.target.value) / 100)}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div
            className="relative w-full h-2 bg-gray-700 rounded-lg cursor-pointer overflow-hidden"
            onClick={handleTimeClick}
          >
            <div
              className="absolute h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>

        {/* File Selection */}
        {!isFullscreen && (
          <div className="mt-4">
            <label className="relative inline-flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer disabled:opacity-50">
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                onChange={onFileSelect}
                accept="video/*,audio/*"
                disabled={isLoading}
              />
              <span className="text-white text-sm">Choose Media File</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  
  const [isPlaying1, setIsPlaying1] = useState(false);
  const [isPlaying2, setIsPlaying2] = useState(false);
  const [isMuted1, setIsMuted1] = useState(false);
  const [isMuted2, setIsMuted2] = useState(false);
  const [isHidden1, setIsHidden1] = useState(false);
  const [isHidden2, setIsHidden2] = useState(false);
  const [volume1, setVolume1] = useState(1);
  const [volume2, setVolume2] = useState(1);
  const [isLoading1, setIsLoading1] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [isFullscreen1, setIsFullscreen1] = useState(false);
  const [isFullscreen2, setIsFullscreen2] = useState(false);
  const [playbackRate1, setPlaybackRate1] = useState(1);
  const [playbackRate2, setPlaybackRate2] = useState(1);

  const setupVideoEvents = useCallback((
    videoRef: React.RefObject<HTMLVideoElement>, 
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    // Enable preload for better buffering
    video.preload = "auto";

    // Set playback optimization hints
    video.autoPictureInPicture = false;
    video.disableRemotePlayback = true;

    // Set buffer size hints
    video.preload = "auto";
    if ('mozAutoplayEnabled' in video) {
      // Firefox-specific optimizations
      (video as any).mozPreservesPitch = false;
      (video as any).mozFrameBufferLength = 1024;
    }

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.error('Video error:', e);
      setIsLoading(false);
      setIsPlaying(false);
    };

    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    // Add stalled and suspend event handlers
    video.addEventListener('stalled', handleWaiting);
    video.addEventListener('suspend', () => {
      if (video.readyState < 3) handleWaiting();
    });

    // Add seeking optimization
    video.addEventListener('seeking', handleWaiting);
    video.addEventListener('seeked', () => {
      if (video.readyState >= 3) {
        setIsLoading(false);
      }
    });

    return () => {
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('stalled', handleWaiting);
      video.removeEventListener('suspend', handleWaiting);
      video.removeEventListener('seeking', handleWaiting);
      video.removeEventListener('seeked', handleWaiting);
    };
  }, []);

  useEffect(() => {
    const cleanup1 = setupVideoEvents(video1Ref, setIsLoading1, setIsPlaying1);
    const cleanup2 = setupVideoEvents(video2Ref, setIsLoading2, setIsPlaying2);

    const handleFullscreenChange = () => {
      setIsFullscreen1(document.fullscreenElement === video1Ref.current);
      setIsFullscreen2(document.fullscreenElement === video2Ref.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      cleanup1?.();
      cleanup2?.();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [setupVideoEvents]);

  const handlePlayPause = useCallback((videoRef: React.RefObject<HTMLVideoElement>) => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  }, []);

  const handleMuteToggle = useCallback((videoRef: React.RefObject<HTMLVideoElement>, setIsMuted: React.Dispatch<React.SetStateAction<boolean>>) => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  const handleVolumeChange = useCallback((
    videoRef: React.RefObject<HTMLVideoElement>,
    setVolume: React.Dispatch<React.SetStateAction<number>>,
    value: number
  ) => {
    if (videoRef.current) {
      videoRef.current.volume = value;
      setVolume(value);
      if (value > 0) {
        videoRef.current.muted = false;
      }
    }
  }, []);

  const handleSeek = useCallback((videoRef: React.RefObject<HTMLVideoElement>, seconds: number) => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime + seconds;
      videoRef.current.currentTime = Math.max(0, Math.min(newTime, videoRef.current.duration));
    }
  }, []);

  const handlePlaybackRateChange = useCallback((
    videoRef: React.RefObject<HTMLVideoElement>,
    setPlaybackRate: React.Dispatch<React.SetStateAction<number>>,
    rate: number
  ) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  }, []);

  const handleFileSelect = useCallback((
    videoRef: React.RefObject<HTMLVideoElement>, 
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  ) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && videoRef.current) {
      setIsLoading(true);
      
      // Revoke any existing object URL to free up memory
      if (videoRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(videoRef.current.src);
      }

      const url = URL.createObjectURL(file);
      videoRef.current.src = url;
      
      // Set up media source hints
      videoRef.current.preload = "auto";
      
      videoRef.current.onloadeddata = () => {
        setIsLoading(false);
      };
      
      videoRef.current.onerror = () => {
        setIsLoading(false);
        URL.revokeObjectURL(url);
        alert('Error loading media file. Please try another file.');
      };
    }
  }, []);

  const handleToggleFullscreen = useCallback((videoRef: React.RefObject<HTMLVideoElement>) => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      } else {
        videoRef.current.requestFullscreen().catch(console.error);
      }
    }
  }, []);

  const handleMasterPlayPause = useCallback(() => {
    const allPlaying = isPlaying1 && isPlaying2;
    [video1Ref, video2Ref].forEach((ref) => {
      if (ref.current) {
        if (allPlaying) {
          ref.current.pause();
        } else {
          ref.current.play().catch(console.error);
        }
      }
    });
  }, [isPlaying1, isPlaying2]);

  const handleMasterMute = useCallback(() => {
    const allMuted = isMuted1 && isMuted2;
    [video1Ref, video2Ref].forEach((ref) => {
      if (ref.current) {
        ref.current.muted = !allMuted;
      }
    });
    setIsMuted1(!allMuted);
    setIsMuted2(!allMuted);
  }, [isMuted1, isMuted2]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 text-center mb-8">
          Dual Media Player
        </h1>
        
        {/* Master Controls */}
        <div className="bg-gray-800/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-white text-xl font-semibold mb-4">Master Controls</h2>
          <div className="flex gap-4">
            <button
              onClick={handleMasterPlayPause}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all text-white flex items-center gap-2 font-medium disabled:opacity-50 shadow-lg"
              disabled={isLoading1 || isLoading2}
            >
              {isPlaying1 && isPlaying2 ? <Pause size={24} /> : <Play size={24} />}
              <span>{isPlaying1 && isPlaying2 ? 'Pause All' : 'Play All'}</span>
            </button>
            <button
              onClick={handleMasterMute}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all text-white flex items-center gap-2 font-medium disabled:opacity-50 shadow-lg"
              disabled={isLoading1 || isLoading2}
            >
              {isMuted1 && isMuted2 ? <VolumeX size={24} /> : <Volume2 size={24} />}
              <span>{isMuted1 && isMuted2 ? 'Unmute All' : 'Mute All'}</span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Media Player 1 */}
          <div className={`space-y-4 relative ${isHidden1 ? 'hidden' : ''}`}>
            <video
              ref={video1Ref}
              className="w-full rounded-xl bg-black aspect-video shadow-xl"
              controls={false}
              preload="auto"
            />
            <MediaControls
              videoRef={video1Ref}
              title="Media Player 1"
              isPlaying={isPlaying1}
              isMuted={isMuted1}
              isHidden={isHidden1}
              volume={volume1}
              isLoading={isLoading1}
              isFullscreen={isFullscreen1}
              playbackRate={playbackRate1}
              onPlayPause={() => handlePlayPause(video1Ref)}
              onMuteToggle={() => handleMuteToggle(video1Ref, setIsMuted1)}
              onVolumeChange={(value) => handleVolumeChange(video1Ref, setVolume1, value)}
              onSeek={(seconds) => handleSeek(video1Ref, seconds)}
              onFileSelect={handleFileSelect(video1Ref, setIsLoading1)}
              onToggleHide={() => setIsHidden1(!isHidden1)}
              onToggleFullscreen={() => handleToggleFullscreen(video1Ref)}
              onPlaybackRateChange={(rate) => handlePlaybackRateChange(video1Ref, setPlaybackRate1, rate)}
              onMasterPlayPause={handleMasterPlayPause}
              onMasterMute={handleMasterMute}
              allPlaying={isPlaying1 && isPlaying2}
              allMuted={isMuted1 && isMuted2}
            />
          </div>

          {/* Media Player 2 */}
          <div className={`space-y-4 relative ${isHidden2 ? 'hidden' : ''}`}>
            <video
              ref={video2Ref}
              className="w-full rounded-xl bg-black aspect-video shadow-xl"
              controls={false}
              preload="auto"
            />
            <MediaControls
              videoRef={video2Ref}
              title="Media Player 2"
              isPlaying={isPlaying2}
              isMuted={isMuted2}
              isHidden={isHidden2}
              volume={volume2}
              isLoading={isLoading2}
              isFullscreen={isFullscreen2}
              playbackRate={playbackRate2}
              onPlayPause={() => handlePlayPause(video2Ref)}
              onMuteToggle={() => handleMuteToggle(video2Ref, setIsMuted2)}
              onVolumeChange={(value) => handleVolumeChange(video2Ref, setVolume2, value)}
              onSeek={(seconds) => handleSeek(video2Ref, seconds)}
              onFileSelect={handleFileSelect(video2Ref, setIsLoading2)}
              onToggleHide={() => setIsHidden2(!isHidden2)}
              onToggleFullscreen={() => handleToggleFullscreen(video2Ref)}
              onPlaybackRateChange={(rate) => handlePlaybackRateChange(video2Ref, setPlaybackRate2, rate)}
              onMasterPlayPause={handleMasterPlayPause}
              onMasterMute={handleMasterMute}
              allPlaying={isPlaying1 && isPlaying2}
              allMuted={isMuted1 && isMuted2}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
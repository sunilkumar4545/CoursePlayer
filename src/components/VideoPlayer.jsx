import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, AlertCircle, Music, Keyboard, HelpCircle, Cast, MonitorSmartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/lib/utils'

const VideoPlayer = ({ videoFile, title }) => {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [videoUrl, setVideoUrl] = useState(null)
  const [error, setError] = useState(null)
  const [audioTracks, setAudioTracks] = useState([])
  const [currentAudioTrack, setCurrentAudioTrack] = useState(0)
  const [showAudioTrackMenu, setShowAudioTrackMenu] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [isCasting, setIsCasting] = useState(false)
  const [showCastMenu, setShowCastMenu] = useState(false)
  const [availableCastDevices, setAvailableCastDevices] = useState([])

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile)
      setVideoUrl(url)
      
      // Reset player state when new video loads
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      setError(null)
      
      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [videoFile])
  
  // Add keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle keyboard events if video is loaded
      if (!videoRef.current) return;
      
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          // Space or K - toggle play/pause
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowright':
          // Right arrow - forward 10s
          e.preventDefault();
          skipTime(10);
          break;
        case 'arrowleft':
          // Left arrow - backward 10s
          e.preventDefault();
          skipTime(-10);
          break;
        case 'f':
          // F - toggle fullscreen
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          // M - toggle mute
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowup':
          // Up arrow - increase volume
          e.preventDefault();
          if (videoRef.current && volume < 1) {
            const newVolume = Math.min(1, volume + 0.1);
            setVolume(newVolume);
            videoRef.current.volume = newVolume;
          }
          break;
        case 'arrowdown':
          // Down arrow - decrease volume
          e.preventDefault();
          if (videoRef.current && volume > 0) {
            const newVolume = Math.max(0, volume - 0.1);
            setVolume(newVolume);
            videoRef.current.volume = newVolume;
          }
          break;
        case '+':
        case '=':
          // Plus key - increase playback speed
          e.preventDefault();
          if (videoRef.current && playbackSpeed < 2) {
            const newSpeed = Math.min(2, playbackSpeed + 0.25);
            videoRef.current.playbackRate = newSpeed;
            setPlaybackSpeed(newSpeed);
          }
          break;
        case '-':
        case '_':
          // Minus key - decrease playback speed
          e.preventDefault();
          if (videoRef.current && playbackSpeed > 0.25) {
            const newSpeed = Math.max(0.25, playbackSpeed - 0.25);
            videoRef.current.playbackRate = newSpeed;
            setPlaybackSpeed(newSpeed);
          }
          break;
        default:
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [volume, isPlaying, playbackSpeed]);

  useEffect(() => {
    // Reset video when URL changes
    if (videoRef.current && videoUrl) {
      videoRef.current.load()
      
      // Set up event listener for loadedmetadata to detect audio tracks
      const handleTracksLoaded = () => {
        if (videoRef.current && videoRef.current.audioTracks && videoRef.current.audioTracks.length > 0) {
          const tracks = Array.from(videoRef.current.audioTracks);
          setAudioTracks(tracks);
          // Set the first track as active by default
          if (tracks.length > 0) {
            setCurrentAudioTrack(0);
            tracks.forEach((track, index) => {
              track.enabled = index === 0;
            });
          }
        }
      };
      
      videoRef.current.addEventListener('loadedmetadata', handleTracksLoaded);
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', handleTracksLoaded);
        }
      };
    }
  }, [videoUrl])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleProgressClick = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const newTime = (clickX / rect.width) * duration
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen()
      }
    }
  }

  const skipTime = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }
  
  const changeAudioTrack = (trackIndex) => {
    if (videoRef.current && videoRef.current.audioTracks && audioTracks.length > 0) {
      // Disable all tracks first
      audioTracks.forEach((track, index) => {
        if (videoRef.current.audioTracks[index]) {
          videoRef.current.audioTracks[index].enabled = index === trackIndex;
        }
      });
      
      setCurrentAudioTrack(trackIndex);
      setShowAudioTrackMenu(false);
    }
  }
  
  const toggleKeyboardHelp = () => {
    setShowKeyboardHelp(!showKeyboardHelp);
    // Hide other menus if they're open
    if (showAudioTrackMenu) {
      setShowAudioTrackMenu(false);
    }
    if (showSpeedMenu) {
      setShowSpeedMenu(false);
    }
    if (showCastMenu) {
      setShowCastMenu(false);
    }
  }
  
  const changePlaybackSpeed = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
    }
  }
  
  const toggleSpeedMenu = () => {
    setShowSpeedMenu(!showSpeedMenu);
    // Hide other menus if they're open
    if (showAudioTrackMenu) {
      setShowAudioTrackMenu(false);
    }
    if (showCastMenu) {
      setShowCastMenu(false);
    }
  }
  
  const toggleCastMenu = () => {
    setShowCastMenu(!showCastMenu);
    // Hide other menus if they're open
    if (showAudioTrackMenu) {
      setShowAudioTrackMenu(false);
    }
    if (showSpeedMenu) {
      setShowSpeedMenu(false);
    }
    
    // Mock scan for cast devices
    if (!showCastMenu && availableCastDevices.length === 0) {
      // In a real implementation, this would use the actual Cast API
      // For now, we'll just simulate finding devices
      setAvailableCastDevices([
        { id: 'device1', name: 'Living Room TV' },
        { id: 'device2', name: 'Bedroom Chromecast' },
        { id: 'device3', name: 'Kitchen Display' }
      ]);
    }
  }
  
  const startCasting = (deviceId) => {
    // In a real implementation, this would use the actual Cast API
    // For demonstration purposes, we'll just update the state
    setIsCasting(true);
    setShowCastMenu(false);
    
    // Show a notification that would normally connect to the selected device
    alert(`Casting to ${availableCastDevices.find(d => d.id === deviceId).name}\nThis is a UI demonstration. Actual casting requires the Google Cast SDK integration.`);
  }
  
  const stopCasting = () => {
    setIsCasting(false);
  }

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-red-400 mb-2">Video Error</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!videoUrl) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-400 mx-auto mb-2"></div>
          <p className="text-gray-400">Loading video...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col" style={{ height: '100%', minHeight: '350px' }}>
      {title && (
        <h2 className="text-xl font-semibold mb-4 text-white">{title}</h2>
      )}
      
      <div className="flex-1 min-h-0" style={{ height: 'calc(100% - 40px)', minHeight: '300px' }}>
        <div className="video-container bg-black rounded-lg relative group h-full" style={{ height: '100%' }}>
        {/* Keyboard Shortcuts Help Overlay */}
        {showKeyboardHelp && (
          <div className="absolute inset-0 bg-black/80 z-30 flex items-center justify-center p-6 overflow-auto">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Keyboard className="mr-2 h-5 w-5" /> Keyboard Shortcuts
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleKeyboardHelp}
                  className="text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 border-b border-gray-700 pb-2 mb-2">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Playback Controls</h4>
                </div>
                
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-2 min-w-[40px] text-center">Space</kbd>
                  <span className="text-sm">Play/Pause</span>
                </div>
                
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-2 min-w-[40px] text-center">K</kbd>
                  <span className="text-sm">Play/Pause</span>
                </div>
                
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-2 min-w-[40px] text-center">←</kbd>
                  <span className="text-sm">Rewind 10s</span>
                </div>
                
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-2 min-w-[40px] text-center">→</kbd>
                  <span className="text-sm">Forward 10s</span>
                </div>
                
                <div className="col-span-2 border-b border-gray-700 pb-2 mb-2 mt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Volume Controls</h4>
                </div>
                
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-2 min-w-[40px] text-center">M</kbd>
                  <span className="text-sm">Mute/Unmute</span>
                </div>
                
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-2 min-w-[40px] text-center">↑</kbd>
                  <span className="text-sm">Volume Up</span>
                </div>
                
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-2 min-w-[40px] text-center">↓</kbd>
                  <span className="text-sm">Volume Down</span>
                </div>
                
                <div className="col-span-2 border-b border-gray-700 pb-2 mb-2 mt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Playback Speed</h4>
                </div>
                
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-2 min-w-[40px] text-center">+</kbd>
                  <span className="text-sm">Speed Up</span>
                </div>
                
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-2 min-w-[40px] text-center">-</kbd>
                  <span className="text-sm">Slow Down</span>
                </div>
                
                <div className="col-span-2 border-b border-gray-700 pb-2 mb-2 mt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Other Controls</h4>
                </div>
                
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-2 min-w-[40px] text-center">F</kbd>
                  <span className="text-sm">Fullscreen</span>
                </div>
              </div>
            </div>
          </div>
        )}
          <video
            ref={videoRef}
            className="video-player w-full h-full"
            src={videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onError={(e) => {
              console.error('Video error:', e)
              setError('Failed to load video. Please check the file format.')
            }}
            controls={false}
            preload="metadata"
            playbackRate={playbackSpeed}
            style={{ height: '100%' }}
          />
        
        <div className="video-controls absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Progress Bar */}
          <div 
            className="progress-bar w-full h-1 bg-white/30 rounded-full mb-3 cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className="progress-fill h-full bg-lime-400 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => skipTime(-10)}
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => skipTime(10)}
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                
                <div className="relative w-16 h-1 bg-white/30 rounded-lg">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="absolute top-0 left-0 h-full bg-lime-400 rounded-lg"
                    style={{ width: `${volume * 100}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </span>
              
              {/* Playback Speed Control */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSpeedMenu}
                  className="text-white hover:bg-white/20 flex items-center"
                  title="Playback Speed"
                >
                  <span className="text-xs font-medium">{playbackSpeed}x</span>
                </Button>
                
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-md shadow-lg p-2 min-w-[100px] z-20">
                    <div className="text-xs text-gray-400 mb-1 px-2">Playback Speed</div>
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => changePlaybackSpeed(speed)}
                        className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-700 ${speed === playbackSpeed ? 'bg-gray-700 text-lime-400' : 'text-white'}`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Audio Track Selection */}
              {audioTracks.length > 1 && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAudioTrackMenu(!showAudioTrackMenu)}
                    className="text-white hover:bg-white/20"
                    title="Audio Tracks"
                  >
                    <Music className="h-4 w-4" />
                  </Button>
                  
                  {showAudioTrackMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-md shadow-lg p-2 min-w-[150px] z-20">
                      <div className="text-xs text-gray-400 mb-1 px-2">Audio Tracks</div>
                      {audioTracks.map((track, index) => (
                        <button
                          key={index}
                          onClick={() => changeAudioTrack(index)}
                          className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-700 ${index === currentAudioTrack ? 'bg-gray-700 text-lime-400' : 'text-white'}`}
                        >
                          {track.label || `Track ${index + 1}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Cast Button */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isCasting ? stopCasting : toggleCastMenu}
                  className={`text-white hover:bg-white/20 ${isCasting ? 'text-lime-400' : ''}`}
                  title={isCasting ? 'Stop Casting' : 'Cast to Device'}
                >
                  {isCasting ? <Cast className="h-4 w-4" /> : <MonitorSmartphone className="h-4 w-4" />}
                </Button>
                
                {showCastMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-md shadow-lg p-2 min-w-[200px] z-20">
                    <div className="text-xs text-gray-400 mb-1 px-2">Cast to</div>
                    {availableCastDevices.length === 0 ? (
                      <div className="text-sm text-gray-400 px-2 py-1">Searching for devices...</div>
                    ) : (
                      availableCastDevices.map((device) => (
                        <button
                          key={device.id}
                          onClick={() => startCasting(device.id)}
                          className="w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-700 text-white"
                        >
                          {device.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleKeyboardHelp}
                className="text-white hover:bg-white/20"
                title="Keyboard Shortcuts"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
                title="Fullscreen"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default VideoPlayer;
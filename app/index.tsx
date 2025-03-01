import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
  Platform
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Slider from '@react-native-community/slider';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Play, Pause, Volume2, VolumeX, Maximize2, Eye, EyeOff, Volume1, Volume, Loader as Loader2, FastForward, Rewind } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function App() {
  const video1Ref = useRef(null);
  const video2Ref = useRef(null);
  
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate1, setPlaybackRate1] = useState(1);
  const [playbackRate2, setPlaybackRate2] = useState(1);
  const [position1, setPosition1] = useState(0);
  const [position2, setPosition2] = useState(0);
  const [duration1, setDuration1] = useState(0);
  const [duration2, setDuration2] = useState(0);
  const [uri1, setUri1] = useState(null);
  const [uri2, setUri2] = useState(null);
  const [showPlaybackMenu1, setShowPlaybackMenu1] = useState(false);
  const [showPlaybackMenu2, setShowPlaybackMenu2] = useState(false);

  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  useEffect(() => {
    // Set up status update interval
    const interval = setInterval(() => {
      if (video1Ref.current) {
        video1Ref.current.getStatusAsync().then(status => {
          if (status.isLoaded) {
            setPosition1(status.positionMillis / 1000);
            setDuration1(status.durationMillis / 1000);
            setIsPlaying1(status.isPlaying);
          }
        });
      }
      if (video2Ref.current) {
        video2Ref.current.getStatusAsync().then(status => {
          if (status.isLoaded) {
            setPosition2(status.positionMillis / 1000);
            setDuration2(status.durationMillis / 1000);
            setIsPlaying2(status.isPlaying);
          }
        });
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async (videoRef, setIsPlaying) => {
    if (!videoRef.current) return;
    
    const status = await videoRef.current.getStatusAsync();
    if (status.isLoaded) {
      if (status.isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!status.isPlaying);
    }
  };

  const handleMuteToggle = async (videoRef, setIsMuted) => {
    if (!videoRef.current) return;
    
    const status = await videoRef.current.getStatusAsync();
    if (status.isLoaded) {
      await videoRef.current.setIsMutedAsync(!status.isMuted);
      setIsMuted(!status.isMuted);
    }
  };

  const handleVolumeChange = async (videoRef, setVolume, value) => {
    if (!videoRef.current) return;
    
    await videoRef.current.setVolumeAsync(value);
    setVolume(value);
    
    if (value > 0) {
      await videoRef.current.setIsMutedAsync(false);
      setIsMuted(false);
    }
  };

  const handleSeek = async (videoRef, seconds, currentPosition) => {
    if (!videoRef.current) return;
    
    const status = await videoRef.current.getStatusAsync();
    if (status.isLoaded) {
      const newPosition = Math.max(0, Math.min((currentPosition + seconds) * 1000, status.durationMillis));
      await videoRef.current.setPositionAsync(newPosition);
    }
  };

  const handlePlaybackRateChange = async (videoRef, setPlaybackRate, rate) => {
    if (!videoRef.current) return;
    
    await videoRef.current.setRateAsync(rate, true);
    setPlaybackRate(rate);
  };

  const pickVideo = async (setUri, setIsLoading) => {
    try {
      setIsLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*', 'audio/*'],
        copyToCacheDirectory: true
      });
      
      if (result.canceled === false) {
        setUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking video:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMasterPlayPause = async () => {
    const allPlaying = isPlaying1 && isPlaying2;
    
    if (video1Ref.current) {
      if (allPlaying) {
        await video1Ref.current.pauseAsync();
      } else if (uri1) {
        await video1Ref.current.playAsync();
      }
    }
    
    if (video2Ref.current) {
      if (allPlaying) {
        await video2Ref.current.pauseAsync();
      } else if (uri2) {
        await video2Ref.current.playAsync();
      }
    }
  };

  const handleMasterMute = async () => {
    const allMuted = isMuted1 && isMuted2;
    
    if (video1Ref.current) {
      await video1Ref.current.setIsMutedAsync(!allMuted);
      setIsMuted1(!allMuted);
    }
    
    if (video2Ref.current) {
      await video2Ref.current.setIsMutedAsync(!allMuted);
      setIsMuted2(!allMuted);
    }
  };

  const toggleFullscreen = async () => {
    if (isFullscreen) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    }
    setIsFullscreen(!isFullscreen);
  };

  const VolumeIcon = ({ isMuted, volume }) => {
    if (isMuted || volume === 0) return <VolumeX size={20} color="white" />;
    if (volume < 0.3) return <Volume size={20} color="white" />;
    if (volume < 0.7) return <Volume1 size={20} color="white" />;
    return <Volume2 size={20} color="white" />;
  };

  const MediaControls = ({ 
    videoRef, 
    title, 
    isPlaying, 
    isMuted, 
    isHidden, 
    volume, 
    isLoading, 
    playbackRate,
    position,
    duration,
    onPlayPause, 
    onMuteToggle, 
    onVolumeChange, 
    onSeek, 
    onPickVideo, 
    onToggleHide, 
    onPlaybackRateChange,
    showPlaybackMenu,
    setShowPlaybackMenu
  }) => {
    return (
      <View style={[styles.controlsContainer, isHidden && styles.hidden]}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Loader2 size={32} color="white" style={styles.spinner} />
          </View>
        )}

        <View style={styles.controlsHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>
                {formatTime(position)} / {formatTime(duration)}
              </Text>
              <TouchableOpacity 
                style={styles.playbackRateButton}
                onPress={() => setShowPlaybackMenu(!showPlaybackMenu)}
              >
                <Text style={styles.playbackRateText}>{playbackRate}x</Text>
              </TouchableOpacity>
              
              {showPlaybackMenu && (
                <View style={styles.playbackMenu}>
                  {playbackRates.map((rate) => (
                    <TouchableOpacity
                      key={rate}
                      style={[
                        styles.playbackMenuItem,
                        rate === playbackRate && styles.activePlaybackRate
                      ]}
                      onPress={() => {
                        onPlaybackRateChange(rate);
                        setShowPlaybackMenu(false);
                      }}
                    >
                      <Text style={[
                        styles.playbackMenuItemText,
                        rate === playbackRate && styles.activePlaybackRateText
                      ]}>
                        {rate}x
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onToggleHide}
            >
              {isHidden ? 
                <Eye size={20} color="white" /> : 
                <EyeOff size={20} color="white" />
              }
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.iconButton}
              onPress={toggleFullscreen}
            >
              <Maximize2 size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Slider
            style={styles.progressBar}
            minimumValue={0}
            maximumValue={duration || 1}
            value={position || 0}
            onValueChange={(value) => {
              if (videoRef.current) {
                videoRef.current.setPositionAsync(value * 1000);
              }
            }}
            minimumTrackTintColor="#3B82F6"
            maximumTrackTintColor="#4B5563"
            thumbTintColor="#3B82F6"
            disabled={isLoading}
          />
        </View>

        <View style={styles.controlsMain}>
          <View style={styles.playbackControls}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={onPlayPause}
              disabled={isLoading}
            >
              {isPlaying ? 
                <Pause size={24} color="white" /> : 
                <Play size={24} color="white" />
              }
            </TouchableOpacity>
            
            <View style={styles.seekButtons}>
              <View style={styles.seekRow}>
                <TouchableOpacity
                  style={styles.seekButton}
                  onPress={() => onSeek(-1, position)}
                  disabled={isLoading}
                >
                  <Rewind size={12} color="white" />
                  <Text style={styles.seekButtonText}>1s</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.seekButton}
                  onPress={() => onSeek(-5, position)}
                  disabled={isLoading}
                >
                  <Rewind size={12} color="white" />
                  <Text style={styles.seekButtonText}>5s</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.seekRow}>
                <TouchableOpacity
                  style={styles.seekButton}
                  onPress={() => onSeek(1, position)}
                  disabled={isLoading}
                >
                  <Text style={styles.seekButtonText}>1s</Text>
                  <FastForward size={12} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.seekButton}
                  onPress={() => onSeek(5, position)}
                  disabled={isLoading}
                >
                  <Text style={styles.seekButtonText}>5s</Text>
                  <FastForward size={12} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.volumeControls}>
            <TouchableOpacity
              style={styles.muteButton}
              onPress={onMuteToggle}
              disabled={isLoading}
            >
              <VolumeIcon isMuted={isMuted} volume={volume} />
            </TouchableOpacity>
            
            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={1}
              value={volume}
              onValueChange={(value) => onVolumeChange(value)}
              minimumTrackTintColor="#3B82F6"
              maximumTrackTintColor="#4B5563"
              thumbTintColor="#3B82F6"
              disabled={isLoading}
            />
          </View>
        </View>

        {!isFullscreen && (
          <TouchableOpacity
            style={styles.fileButton}
            onPress={onPickVideo}
            disabled={isLoading}
          >
            <Text style={styles.fileButtonText}>Choose Media File</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      <StatusBar style="light" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollViewContent,
          isFullscreen && styles.fullscreenScrollContent
        ]}
      >
        <Text style={styles.heading}>Dual Media Player</Text>
        
        {/* Master Controls */}
        <View style={styles.masterControls}>
          <Text style={styles.sectionTitle}>Master Controls</Text>
          <View style={styles.masterButtonsContainer}>
            <TouchableOpacity
              style={styles.masterButton}
              onPress={handleMasterPlayPause}
              disabled={isLoading1 || isLoading2}
            >
              {isPlaying1 && isPlaying2 ? 
                <Pause size={24} color="white" /> : 
                <Play size={24} color="white" />
              }
              <Text style={styles.masterButtonText}>
                {isPlaying1 && isPlaying2 ? 'Pause All' : 'Play All'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.masterButton}
              onPress={handleMasterMute}
              disabled={isLoading1 || isLoading2}
            >
              {isMuted1 && isMuted2 ? 
                <VolumeX size={24} color="white" /> : 
                <Volume2 size={24} color="white" />
              }
              <Text style={styles.masterButtonText}>
                {isMuted1 && isMuted2 ? 'Unmute All' : 'Mute All'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.playersContainer}>
          {/* Media Player 1 */}
          <View style={[styles.playerWrapper, isHidden1 && styles.hidden]}>
            <Video
              ref={video1Ref}
              style={styles.videoPlayer}
              source={uri1 ? { uri: uri1 } : undefined}
              useNativeControls={false}
              resizeMode={ResizeMode.CONTAIN}
              isLooping={false}
              onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded) {
                  setIsLoading1(false);
                  setIsPlaying1(status.isPlaying);
                  setIsMuted1(status.isMuted);
                  setVolume1(status.volume);
                } else if (status.error) {
                  console.error('Video 1 error:', status.error);
                  setIsLoading1(false);
                }
              }}
              onLoad={(status) => {
                setDuration1(status.durationMillis / 1000);
                setIsLoading1(false);
              }}
              onError={(error) => {
                console.error('Video 1 load error:', error);
                setIsLoading1(false);
              }}
            />
            
            <MediaControls
              videoRef={video1Ref}
              title="Media Player 1"
              isPlaying={isPlaying1}
              isMuted={isMuted1}
              isHidden={isHidden1}
              volume={volume1}
              isLoading={isLoading1}
              playbackRate={playbackRate1}
              position={position1}
              duration={duration1}
              onPlayPause={() => handlePlayPause(video1Ref, setIsPlaying1)}
              onMuteToggle={() => handleMuteToggle(video1Ref, setIsMuted1)}
              onVolumeChange={(value) => handleVolumeChange(video1Ref, setVolume1, value)}
              onSeek={(seconds, pos) => handleSeek(video1Ref, seconds, pos)}
              onPickVideo={() => pickVideo(setUri1, setIsLoading1)}
              onToggleHide={() => setIsHidden1(!isHidden1)}
              onPlaybackRateChange={(rate) => handlePlaybackRateChange(video1Ref, setPlaybackRate1, rate)}
              showPlaybackMenu={showPlaybackMenu1}
              setShowPlaybackMenu={setShowPlaybackMenu1}
            />
          </View>

          {/* Media Player 2 */}
          <View style={[styles.playerWrapper, isHidden2 && styles.hidden]}>
            <Video
              ref={video2Ref}
              style={styles.videoPlayer}
              source={uri2 ? { uri: uri2 } : undefined}
              useNativeControls={false}
              resizeMode={ResizeMode.CONTAIN}
              isLooping={false}
              onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded) {
                  setIsLoading2(false);
                  setIsPlaying2(status.isPlaying);
                  setIsMuted2(status.isMuted);
                  setVolume2(status.volume);
                } else if (status.error) {
                  console.error('Video 2 error:', status.error);
                  setIsLoading2(false);
                }
              }}
              onLoad={(status) => {
                setDuration2(status.durationMillis / 1000);
                setIsLoading2(false);
              }}
              onError={(error) => {
                console.error('Video 2 load error:', error);
                setIsLoading2(false);
              }}
            />
            
            <MediaControls
              videoRef={video2Ref}
              title="Media Player 2"
              isPlaying={isPlaying2}
              isMuted={isMuted2}
              isHidden={isHidden2}
              volume={volume2}
              isLoading={isLoading2}
              playbackRate={playbackRate2}
              position={position2}
              duration={duration2}
              onPlayPause={() => handlePlayPause(video2Ref, setIsPlaying2)}
              onMuteToggle={() => handleMuteToggle(video2Ref, setIsMuted2)}
              onVolumeChange={(value) => handleVolumeChange(video2Ref, setVolume2, value)}
              onSeek={(seconds, pos) => handleSeek(video2Ref, seconds, pos)}
              onPickVideo={() => pickVideo(setUri2, setIsLoading2)}
              onToggleHide={() => setIsHidden2(!isHidden2)}
              onPlaybackRateChange={(rate) => handlePlaybackRateChange(video2Ref, setPlaybackRate2, rate)}
              showPlaybackMenu={showPlaybackMenu2}
              setShowPlaybackMenu={setShowPlaybackMenu2}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  fullscreenContainer: {
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  fullscreenScrollContent: {
    padding: 0,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginVertical: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  masterControls: {
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  masterButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  masterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  masterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  playersContainer: {
    gap: 24,
  },
  playerWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
    marginBottom: 16,
  },
  videoPlayer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  controlsContainer: {
    padding: 16,
    backgroundColor: '#1F2937',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  controlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  timeText: {
    color: '#fff',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    fontSize: 12,
  },
  playbackRateButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  playbackRateText: {
    color: '#fff',
    fontSize: 12,
  },
  playbackMenu: {
    position: 'absolute',
    top: -120,
    left: 0,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  playbackMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  activePlaybackRate: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  playbackMenuItemText: {
    color: '#fff',
    fontSize: 14,
  },
  activePlaybackRateText: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    backgroundColor: '#374151',
    padding: 8,
    borderRadius: 8,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 40,
  },
  controlsMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
  },
  seekButtons: {
    gap: 8,
  },
  seekRow: {
    flexDirection: 'row',
    gap: 4,
  },
  seekButton: {
    backgroundColor: '#374151',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seekButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  volumeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  muteButton: {
    backgroundColor: '#374151',
    padding: 8,
    borderRadius: 8,
  },
  volumeSlider: {
    width: 120,
    height: 40,
  },
  fileButton: {
    backgroundColor: '#374151',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  fileButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  hidden: {
    display: 'none',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 12,
  },
  spinner: {
    transform: [{ rotate: '0deg' }],
  },
});
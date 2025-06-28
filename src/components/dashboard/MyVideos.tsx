import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, Play, Download, Share2, Trash2, Search, Filter, Calendar, Clock, Eye, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { useStoryStore } from '../../store/storyStore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export const MyVideos: React.FC = () => {
  const { stories } = useStoryStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  // Extract all videos from stories
  const allVideos = stories.flatMap(story => 
    (story.videos || []).map(video => ({
      ...video,
      story_title: story.title,
      story_theme: story.theme,
      story_id: story.id
    }))
  );

  const filteredVideos = allVideos.filter(video => {
    const matchesSearch = video.story_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider = filterProvider === 'all' || video.provider === filterProvider;
    
    return matchesSearch && matchesProvider;
  });

  const handlePlayVideo = (video: any) => {
    setSelectedVideo(video);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlayPause = () => {
    if (!videoRef) return;
    
    if (isPlaying) {
      videoRef.pause();
    } else {
      videoRef.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef) return;
    
    videoRef.muted = !videoRef.muted;
    setIsMuted(videoRef.muted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef) return;
    setCurrentTime(videoRef.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef) return;
    setDuration(videoRef.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef) return;
    const time = parseFloat(e.target.value);
    videoRef.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownloadVideo = (video: any) => {
    if (video.video_url) {
      const link = document.createElement('a');
      link.href = video.video_url;
      link.download = `${video.story_title}-video.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Video download started');
    } else {
      toast.error('Video URL not available');
    }
  };

  const handleShareVideo = (video: any) => {
    if (navigator.share && video.video_url) {
      navigator.share({
        title: video.story_title,
        text: `Check out this AI-generated video: ${video.story_title}`,
        url: video.video_url,
      }).catch(console.error);
    } else if (video.video_url) {
      navigator.clipboard.writeText(video.video_url);
      toast.success('Video URL copied to clipboard');
    }
  };

  const getProviderColor = (provider: string) => {
    const colors = {
      kapwing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      krikey: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'canva-video': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      shotstack: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      runway: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      demo: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    };
    return colors[provider] || colors.demo;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Videos</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage your AI-generated videos
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {filteredVideos.length} videos
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Providers</option>
              <option value="kapwing">Kapwing</option>
              <option value="krikey">Krikey AI</option>
              <option value="canva-video">Canva Video</option>
              <option value="shotstack">Shotstack</option>
              <option value="runway">Runway ML</option>
              <option value="demo">Demo</option>
            </select>

            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Filter className="w-4 h-4" />
              <span>{filteredVideos.length} videos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Videos Grid */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover className="h-full">
                <div className="aspect-video bg-gray-900 rounded-t-xl overflow-hidden relative group">
                  {video.video_url ? (
                    <>
                      <video
                        className="w-full h-full object-cover"
                        poster={video.thumbnail_url || "https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg?auto=compress&cs=tinysrgb&w=400"}
                        preload="metadata"
                      >
                        <source src={video.video_url} type="video/mp4" />
                      </video>
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={() => handlePlayVideo(video)}
                          className="bg-white text-gray-900 hover:bg-gray-100"
                        >
                          <Play className="w-5 h-5" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(video.status)}`}>
                    {video.status}
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1">
                    {video.story_title}
                  </h3>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProviderColor(video.provider)}`}>
                      {video.provider.replace('-', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(video.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Video Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{video.duration ? `${video.duration}s` : 'Unknown'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{video.story_theme}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    {video.video_url && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePlayVideo(video)}
                          className="flex-1"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Play
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadVideo(video)}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShareVideo(video)}
                        >
                          <Share2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm || filterProvider !== 'all' 
                ? 'No videos match your filters' 
                : 'No videos yet'
              }
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filterProvider !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create stories and generate videos to see them here'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-lg max-w-6xl w-full max-h-[95vh] overflow-hidden">
            {/* Video Header */}
            <div className="p-4 bg-gray-900 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {selectedVideo.story_title}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedVideo(null)}
                className="text-white hover:bg-gray-800"
              >
                ×
              </Button>
            </div>
            
            {/* Video Container */}
            <div className="relative bg-black">
              <video
                ref={setVideoRef}
                className="w-full h-auto max-h-[70vh]"
                poster={selectedVideo.thumbnail_url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={togglePlayPause}
              >
                <source src={selectedVideo.video_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Custom Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                {/* Progress Bar */}
                <div className="mb-4">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-300 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
                
                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePlayPause}
                      className="text-white hover:bg-gray-800 p-2"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="text-white hover:bg-gray-800 p-2"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (videoRef) {
                          videoRef.currentTime = 0;
                          setCurrentTime(0);
                        }
                      }}
                      className="text-white hover:bg-gray-800 p-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (videoRef && videoRef.requestFullscreen) {
                          videoRef.requestFullscreen();
                        }
                      }}
                      className="text-white hover:bg-gray-800 p-2"
                    >
                      <Maximize className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Video Actions */}
            <div className="p-4 bg-gray-900 flex justify-center space-x-3">
              <Button
                onClick={() => handleDownloadVideo(selectedVideo)}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={() => handleShareVideo(selectedVideo)}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};
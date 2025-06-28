import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Video, Users, Clock, Edit3, Trash2, Play, Download, Search, Filter, Plus, ArrowRight, CheckCircle, AlertCircle, Loader2, FileX } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { useStoryStore } from '../../store/storyStore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface MyStoriesProps {
  onCreateStory: () => void;
  onContinueStory?: (story: any, step: string) => void;
}

export const MyStories: React.FC<MyStoriesProps> = ({ onCreateStory, onContinueStory }) => {
  const { stories, deleteStory, fetchUserStories } = useStoryStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTheme, setFilterTheme] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      fetchUserStories(user.id).finally(() => setIsLoading(false));
    }
  }, [user, fetchUserStories]);

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTheme = filterTheme === 'all' || story.theme === filterTheme;
    const matchesStatus = filterStatus === 'all' || story.status === filterStatus;
    
    return matchesSearch && matchesTheme && matchesStatus;
  });

  const handleDeleteStory = async (storyId: string, title: string, isDraft: boolean = false) => {
    const actionText = isDraft ? 'remove this draft' : 'delete this story';
    const confirmText = isDraft 
      ? `Are you sure you want to remove the draft "${title}"? This action cannot be undone.`
      : `Are you sure you want to delete "${title}"? This action cannot be undone.`;
    
    if (window.confirm(confirmText)) {
      setDeletingStoryId(storyId);
      try {
        await deleteStory(storyId);
        toast.success(isDraft ? 'Draft removed successfully' : 'Story deleted successfully');
      } catch (error) {
        toast.error(isDraft ? 'Failed to remove draft' : 'Failed to delete story');
      } finally {
        setDeletingStoryId(null);
      }
    }
  };

  const getStoryProgress = (story: any) => {
    const hasContent = story.content && story.content.length > 100;
    const hasCharacters = story.characters && story.characters.length > 0;
    const hasSegments = story.segments && story.segments.length > 0;
    const hasVideos = story.videos && story.videos.length > 0;
    
    if (hasVideos) {
      return { step: 'completed', progress: 100, label: 'Video Ready', nextAction: 'View Video' };
    } else if (hasSegments) {
      return { step: 'video-generation', progress: 85, label: 'Ready for Video', nextAction: 'Generate Video' };
    } else if (hasCharacters) {
      return { step: 'scene-segmentation', progress: 60, label: 'Segment Scenes', nextAction: 'Continue Creation' };
    } else if (hasContent) {
      return { step: 'character-extraction', progress: 40, label: 'Extract Characters', nextAction: 'Continue Creation' };
    } else {
      return { step: 'story-editing', progress: 20, label: 'Complete Story', nextAction: 'Continue Writing' };
    }
  };

  const handleContinueStory = (story: any) => {
    console.log('🔄 handleContinueStory called with story:', story.title);
    console.log('🔄 onContinueStory prop available:', !!onContinueStory);
    
    if (!onContinueStory) {
      console.error('❌ onContinueStory prop not provided');
      toast.error('Continue functionality not available. Please refresh the page.');
      return;
    }

    const progress = getStoryProgress(story);
    
    console.log('🔄 Continuing story:', story.title, 'at step:', progress.step);
    
    if (progress.step === 'completed' && story.videos && story.videos.length > 0) {
      // Story is complete, show video
      toast.success('Story is complete! Showing your video.');
      // You could open a video modal here or navigate to video view
      return;
    }
    
    // Continue the story creation workflow
    console.log('✅ Calling onContinueStory with:', story, progress.step);
    onContinueStory(story, progress.step);
  };

  const handleStoryCardClick = (story: any, event: React.MouseEvent) => {
    console.log('🖱️ Story card clicked:', story.title);
    
    // Prevent card click if clicking on action buttons
    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      console.log('🖱️ Button clicked, preventing card click');
      return;
    }
    
    // Continue story on card click
    handleContinueStory(story);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getThemeColor = (theme: string) => {
    const colors = {
      fantasy: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'sci-fi': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      romance: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      adventure: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      mystery: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      comedy: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      drama: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      horror: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[theme] || colors.fantasy;
  };

  const getProgressIcon = (step: string) => {
    switch (step) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'video-generation':
        return <Video className="w-4 h-4 text-blue-500" />;
      case 'scene-segmentation':
        return <Edit3 className="w-4 h-4 text-orange-500" />;
      case 'character-extraction':
        return <Users className="w-4 h-4 text-purple-500" />;
      case 'story-editing':
        return <BookOpen className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading your stories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Stories</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and continue your AI-generated stories
          </p>
        </div>
        <Button onClick={onCreateStory} className="shadow-lg hover:shadow-xl transition-shadow">
          <Plus className="w-4 h-4 mr-2" />
          Create New Story
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search stories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={filterTheme}
              onChange={(e) => setFilterTheme(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            >
              <option value="all">All Themes</option>
              <option value="fantasy">Fantasy</option>
              <option value="sci-fi">Sci-Fi</option>
              <option value="romance">Romance</option>
              <option value="adventure">Adventure</option>
              <option value="mystery">Mystery</option>
              <option value="comedy">Comedy</option>
              <option value="drama">Drama</option>
              <option value="horror">Horror</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>

            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Filter className="w-4 h-4" />
              <span>{filteredStories.length} of {stories.length} stories</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stories Grid */}
      {filteredStories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story, index) => {
            const progress = getStoryProgress(story);
            const isDraft = story.status === 'draft';
            const isDeleting = deletingStoryId === story.id;
            
            return (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  hover 
                  className={`h-full cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-600 hover:scale-[1.02] ${
                    isDeleting ? 'opacity-50 pointer-events-none' : ''
                  }`}
                  onClick={(e) => !isDeleting && handleStoryCardClick(story, e)}
                >
                  <div className="aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 rounded-t-xl flex items-center justify-center relative overflow-hidden">
                    <BookOpen className="w-12 h-12 text-primary-500" />
                    
                    {/* Status Badge */}
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(story.status)}`}>
                      {story.status}
                    </div>

                    {/* Progress Indicator */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-1">
                            {getProgressIcon(progress.step)}
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {progress.label}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {progress.progress}%
                          </span>
                        </div>
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-primary-500 to-secondary-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${progress.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Click to Continue Hint */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 rounded-t-xl flex items-center justify-center opacity-0 hover:opacity-100">
                      <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full text-sm font-medium text-gray-900 dark:text-gray-100 shadow-lg flex items-center space-x-2">
                        <ArrowRight className="w-4 h-4" />
                        <span>Click to continue</span>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1">
                        {story.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                        {story.content ? story.content.substring(0, 150) + '...' : 'No content available'}
                      </p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getThemeColor(story.theme)}`}>
                          {story.theme}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(story.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Story Stats */}
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-4">
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{story.characters?.length || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Video className="w-3 h-3" />
                          <span>{story.videos?.length || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{Math.ceil((story.content?.length || 0) / 1000 * 2)}min</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      {/* Primary Action Button */}
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('🔘 Primary button clicked for story:', story.title);
                          handleContinueStory(story);
                        }}
                        className={`w-full ${
                          progress.step === 'completed' 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-gradient-to-r from-primary-600 to-secondary-600'
                        } shadow-md hover:shadow-lg transition-shadow`}
                        disabled={isDeleting}
                      >
                        {progress.step === 'completed' ? (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            View Video
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-4 h-4 mr-2" />
                            {progress.nextAction}
                          </>
                        )}
                      </Button>

                      {/* Secondary Actions */}
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.info('Edit functionality coming soon!');
                          }}
                          disabled={isDeleting}
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        
                        {story.videos && story.videos.length > 0 && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info('Download functionality coming soon!');
                            }}
                            disabled={isDeleting}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        )}
                        
                        {/* Delete/Remove Draft Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStory(story.id, story.title, isDraft);
                          }}
                          className="text-red-500 hover:text-red-700 hover:border-red-300"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isDraft ? (
                            <FileX className="w-3 h-3" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm || filterTheme !== 'all' || filterStatus !== 'all' 
                ? 'No stories match your filters' 
                : 'No stories yet'
              }
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || filterTheme !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first story to get started with AI video generation'
              }
            </p>
            {(!searchTerm && filterTheme === 'all' && filterStatus === 'all') && (
              <Button onClick={onCreateStory} className="shadow-lg hover:shadow-xl transition-shadow">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Story
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Progress Legend */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            📊 Story Creation Progress Guide:
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
            <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium">Story Draft</div>
                <div className="text-xs text-gray-500">20% - Writing phase</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
              <Users className="w-4 h-4 text-purple-500" />
              <div>
                <div className="font-medium">Characters</div>
                <div className="text-xs text-gray-500">40% - AI extraction</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
              <Edit3 className="w-4 h-4 text-orange-500" />
              <div>
                <div className="font-medium">Scenes</div>
                <div className="text-xs text-gray-500">60% - Segmentation</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <Video className="w-4 h-4 text-blue-500" />
              <div>
                <div className="font-medium">Video Ready</div>
                <div className="text-xs text-gray-500">85% - Generate video</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div>
                <div className="font-medium">Completed</div>
                <div className="text-xs text-gray-500">100% - Video ready!</div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <strong>💡 Tip:</strong> Click on any story card to continue where you left off. Each story remembers its progress and will take you to the next step automatically. Use the red icon to remove drafts or delete completed stories.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Info (only in development) */}
      {import.meta.env.DEV && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700">
          <CardContent className="p-4">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              🔧 Debug Info (Development Only):
            </h4>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <div>onContinueStory prop available: {onContinueStory ? '✅ Yes' : '❌ No'}</div>
              <div>Stories loaded: {stories.length}</div>
              <div>Filtered stories: {filteredStories.length}</div>
              {filteredStories.length > 0 && (
                <div>First story: {filteredStories[0].title} (Status: {filteredStories[0].status})</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
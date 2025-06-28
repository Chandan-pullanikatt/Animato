import React from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Video, Users, Clock, TrendingUp, ArrowRight, Play, BookOpen, Globe } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { useStoryStore } from '../../store/storyStore';
import { MyCharacters } from './MyCharacters';
import { MyStories } from './MyStories';
import { MyVideos } from './MyVideos';
import { Settings } from './Settings';
import { DomainManager } from './DomainManager';

interface DashboardProps {
  onCreateStory: () => void;
  onContinueStory?: (story: any, step: string) => void;
}

const sidebarItems = [
  { id: 'stories', label: 'My Stories', icon: BookOpen, component: MyStories },
  { id: 'characters', label: 'My Characters', icon: Users, component: MyCharacters },
  { id: 'videos', label: 'My Videos', icon: Video, component: MyVideos },
  { id: 'domain', label: 'Custom Domain', icon: Globe, component: DomainManager },
  { id: 'settings', label: 'Settings', icon: Settings as any, component: Settings },
];

export const Dashboard: React.FC<DashboardProps> = ({ onCreateStory, onContinueStory }) => {
  const { stories } = useStoryStore();

  const stats = [
    { label: 'Stories Created', value: stories.length, icon: Video, color: 'text-primary-600' },
    { label: 'Characters Generated', value: stories.reduce((acc, story) => acc + (story.characters?.length || 0), 0), icon: Users, color: 'text-secondary-600' },
    { label: 'Videos Produced', value: stories.filter(story => story.videos?.length).length, icon: Video, color: 'text-accent-600' },
    { label: 'Hours Saved', value: Math.floor(stories.length * 2.5), icon: Clock, color: 'text-orange-600' },
  ];

  const recentStories = stories.slice(0, 3);

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
    console.log('🔄 Dashboard: handleContinueStory called with story:', story.title);
    console.log('🔄 Dashboard: onContinueStory prop available:', !!onContinueStory);
    
    if (!onContinueStory) {
      console.error('❌ onContinueStory prop not provided to Dashboard');
      return;
    }

    const progress = getStoryProgress(story);
    console.log('🔄 Dashboard: Continuing story:', story.title, 'at step:', progress.step);
    
    try {
      onContinueStory(story, progress.step);
    } catch (error) {
      console.error('❌ Error in onContinueStory:', error);
    }
  };

  const handleStoryCardClick = (story: any, event: React.MouseEvent) => {
    console.log('🖱️ Dashboard: Story card clicked:', story.title);
    
    // Prevent card click if clicking on action buttons
    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      console.log('🖱️ Dashboard: Button clicked, preventing card click');
      return;
    }
    
    // Continue story on card click
    handleContinueStory(story);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Animato</h1>
            <p className="text-primary-100 text-lg">
              Transform your stories into stunning animated videos with AI
            </p>
          </div>
          <Button
            onClick={onCreateStory}
            className="bg-white text-primary-600 hover:bg-gray-100"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Create New Story
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg bg-gray-100 dark:bg-gray-800`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Stories */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Recent Stories
          </h2>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>

        {recentStories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentStories.map((story, index) => {
              const progress = getStoryProgress(story);
              
              return (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    hover 
                    className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-600 hover:scale-[1.02]"
                    onClick={(e) => handleStoryCardClick(story, e)}
                  >
                    <div className="aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 rounded-t-xl flex items-center justify-center relative">
                      <Video className="w-12 h-12 text-primary-500" />
                      
                      {/* Status Badge */}
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                        story.status === 'completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : story.status === 'processing'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {story.status}
                      </div>

                      {/* Progress Indicator */}
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {progress.label}
                            </span>
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
                    
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {story.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {story.content ? story.content.substring(0, 100) + '...' : 'No content available'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          story.theme === 'fantasy' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                          story.theme === 'sci-fi' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          story.theme === 'romance' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {story.theme}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {progress.nextAction}
                        </span>
                      </div>

                      {/* Primary Action Button */}
                      <div className="mt-3">
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('🔘 Dashboard: Primary button clicked for story:', story.title);
                            handleContinueStory(story);
                          }}
                          className={`w-full ${
                            progress.step === 'completed' 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-gradient-to-r from-primary-600 to-secondary-600'
                          }`}
                          size="sm"
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
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No stories yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first story to get started with AI video generation
              </p>
              <Button onClick={onCreateStory}>
                <PlusCircle className="w-5 h-5 mr-2" />
                Create Your First Story
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
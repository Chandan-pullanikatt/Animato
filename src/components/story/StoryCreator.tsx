import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Sparkles, BookOpen, Users, Video } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { StoryTheme, StoryLength } from '../../types';
import { useStoryStore } from '../../store/storyStore';
import { StoryThemeSelector } from './StoryThemeSelector';
import { StoryLengthSelector } from './StoryLengthSelector';
import toast from 'react-hot-toast';

interface StoryCreatorProps {
  onComplete: () => void;
}

const steps = [
  { id: 'details', title: 'Story Details', icon: BookOpen },
  { id: 'content', title: 'Write Story', icon: Sparkles },
  { id: 'characters', title: 'Generate Characters', icon: Users },
  { id: 'video', title: 'Create Video', icon: Video },
];

export const StoryCreator: React.FC<StoryCreatorProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [theme, setTheme] = useState<StoryTheme>('fantasy');
  const [length, setLength] = useState<StoryLength>('medium');
  
  const { createStory, generateCharacters, generateVideo, generationProgress, isCreatingStory } = useStoryStore();

  const handleNext = async () => {
    if (currentStep === 0) {
      // Validate title
      if (!title || title.trim().length === 0) {
        toast.error('Please enter a story title');
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // Validate content
      if (!content || content.trim().length === 0) {
        toast.error('Please write your story');
        return;
      }
      if (content.trim().length < 50) {
        toast.error('Please write a longer story (at least 50 characters)');
        return;
      }
      
      try {
        const story = await createStory(title.trim(), content.trim(), theme, length);
        setCurrentStep(2);
        // Auto-generate characters
        await generateCharacters(story.id);
        setCurrentStep(3);
      } catch (error: any) {
        console.error('Story creation error:', error);
        toast.error(error.message || 'Failed to create story');
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      try {
        const story = useStoryStore.getState().currentStory;
        if (story) {
          await generateVideo(story.id);
          toast.success('Video generated successfully!');
          onComplete();
        } else {
          toast.error('No story found to generate video');
        }
      } catch (error: any) {
        console.error('Video generation error:', error);
        toast.error(error.message || 'Failed to generate video');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepComplete = () => {
    switch (currentStep) {
      case 0:
        return title && title.trim().length > 0;
      case 1:
        return content && content.trim().length >= 50;
      case 2:
        return true; // Characters are auto-generated
      case 3:
        return true;
      default:
        return false;
    }
  };

  const getNextButtonText = () => {
    switch (currentStep) {
      case 0:
        return 'Continue';
      case 1:
        return 'Create Story';
      case 2:
        return 'Generate Characters';
      case 3:
        return 'Generate Video';
      default:
        return 'Next';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div key={step.id} className="flex items-center">
              <motion.div
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                    : isCompleted
                    ? 'bg-accent-100 text-accent-700 dark:bg-accent-900 dark:text-accent-300'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}
                whileHover={{ scale: 1.05 }}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{step.title}</span>
              </motion.div>
              {index < steps.length - 1 && (
                <ArrowRight className="w-5 h-5 text-gray-300 mx-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {steps[currentStep].title}
          </h2>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && (
            <div className="space-y-6">
              <Input
                label="Story Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your story title..."
                required
              />
              <StoryThemeSelector value={theme} onChange={setTheme} />
              <StoryLengthSelector value={length} onChange={setLength} />
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Write Your Story *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Once upon a time..."
                rows={12}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
                required
              />
              <div className="flex justify-between text-sm">
                <span className={`${content.length < 50 ? 'text-red-500' : 'text-green-500'}`}>
                  {content.length < 50 ? `${50 - content.length} more characters needed` : 'Story length is good!'}
                </span>
                <span className="text-gray-500">
                  {content.length} characters
                </span>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center py-8">
              <div className="mb-4">
                <Users className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Generating Characters
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  AI is creating unique characters for your story...
                </p>
              </div>
              {generationProgress && (
                <div className="max-w-md mx-auto">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {generationProgress.message}
                  </p>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center py-8">
              <div className="mb-4">
                <Video className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Generating Video
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Creating your animated video with AI...
                </p>
              </div>
              {generationProgress && (
                <div className="max-w-md mx-auto">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {generationProgress.message}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || isCreatingStory}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!isStepComplete() || isCreatingStory}
          isLoading={isCreatingStory || (generationProgress && !generationProgress.isComplete)}
        >
          {getNextButtonText()}
          {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
};
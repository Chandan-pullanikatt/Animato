import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, BookOpen, MessageCircle, Users, Video, Edit3, Eye, Volume2, Brain } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { StoryTemplateSelector } from './StoryTemplateSelector';
import { AIStoryChat } from './AIStoryChat';
import { StoryEditor } from './StoryEditor';
import { CharacterExtractor } from './CharacterExtractor';
import { SceneSegmenter } from './SceneSegmenter';
import { AudioGenerator } from './AudioGenerator';
import { VideoGenerator } from '../video/VideoGenerator';
import { useStoryStore } from '../../store/storyStore';
import { useAuthStore } from '../../store/authStore';
import { StoryTheme } from '../../types';
import { AICopilot } from './AICopilot';
import toast from 'react-hot-toast';

interface EnhancedStoryCreatorProps {
  onComplete: () => void;
}

const steps = [
  { id: 'template', title: 'Choose Template', icon: BookOpen },
  { id: 'chat', title: 'AI Story Chat', icon: MessageCircle },
  { id: 'edit', title: 'Review & Edit', icon: Edit3 },
  { id: 'copilot', title: 'AI Copilot', icon: Brain },
  { id: 'characters', title: 'Extract Characters', icon: Users },
  { id: 'scenes', title: 'Segment Scenes', icon: Eye },
  { id: 'audio', title: 'Generate Audio', icon: Volume2 },
  { id: 'video', title: 'Generate Video', icon: Video },
];

export const EnhancedStoryCreator: React.FC<EnhancedStoryCreatorProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [generatedStory, setGeneratedStory] = useState('');
  const [editedStory, setEditedStory] = useState('');
  const [extractedCharacters, setExtractedCharacters] = useState<any[]>([]);
  const [storySegments, setStorySegments] = useState<any[]>([]);
  const [generatedAudio, setGeneratedAudio] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [createdStory, setCreatedStory] = useState<any>(null);
  
  const { createStory, updateStory } = useStoryStore();
  const { user } = useAuthStore();

  // Helper function to extract valid theme from template ID
  const getThemeFromTemplate = (templateId: string): StoryTheme => {
    if (templateId.includes('fantasy')) return 'fantasy';
    if (templateId.includes('sci-fi')) return 'sci-fi';
    if (templateId.includes('romance')) return 'romance';
    if (templateId.includes('adventure')) return 'adventure';
    if (templateId.includes('mystery')) return 'mystery';
    if (templateId.includes('comedy')) return 'comedy';
    if (templateId.includes('drama')) return 'drama';
    if (templateId.includes('horror')) return 'horror';
    // Default fallback
    return 'fantasy';
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      if (!selectedTemplate) {
        toast.error('Please select a story template');
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      if (!generatedStory) {
        toast.error('Please complete the AI chat to generate your story');
        return;
      }
      setEditedStory(generatedStory);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!editedStory.trim()) {
        toast.error('Please review and finalize your story');
        return;
      }
      
      // Save story to database
      try {
        setIsGenerating(true);
        const story = await createStory(
          selectedTemplate.name,
          editedStory,
          getThemeFromTemplate(selectedTemplate.id), // Extract theme properly
          'medium'
        );
        setCreatedStory(story);
        toast.success('Story saved to your dashboard!');
        setCurrentStep(3);
      } catch (error: any) {
        toast.error(error.message || 'Failed to save story');
      } finally {
        setIsGenerating(false);
      }
    } else if (currentStep === 3) {
      // AI Copilot step - optional enhancement step
      toast.success('AI Copilot suggestions applied! Moving to character extraction...');
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (extractedCharacters.length === 0) {
        toast.error('Please extract characters from your story');
        return;
      }
      
      // Save characters to story
      if (createdStory) {
        try {
          updateStory(createdStory.id, { 
            characters: extractedCharacters,
            status: 'processing'
          });
          toast.success('Characters saved to your story!');
        } catch (error) {
          console.error('Failed to save characters:', error);
        }
      }
      
      setCurrentStep(5);
    } else if (currentStep === 5) {
      if (storySegments.length === 0) {
        toast.error('Please segment your story into scenes');
        return;
      }
      
      // Save segments to story
      if (createdStory) {
        try {
          updateStory(createdStory.id, { 
            segments: storySegments,
            status: 'processing'
          });
          toast.success('Story segments saved!');
        } catch (error) {
          console.error('Failed to save segments:', error);
        }
      }
      
      setCurrentStep(6);
    } else if (currentStep === 6) {
      // Audio generation is optional, can skip
      if (generatedAudio.length > 0 && createdStory) {
        try {
          updateStory(createdStory.id, { 
            audio: generatedAudio,
            status: 'processing'
          });
          toast.success('Audio saved to your story!');
        } catch (error) {
          console.error('Failed to save audio:', error);
        }
      }
      setCurrentStep(7);
    } else if (currentStep === 7) {
      // Video generation step - mark story as completed
      if (createdStory) {
        try {
          updateStory(createdStory.id, { 
            status: 'completed'
          });
          toast.success('Story creation completed! Check your dashboard.');
        } catch (error) {
          console.error('Failed to update story status:', error);
        }
      }
      
      toast.success('🎉 Story creation workflow completed!');
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleVideoGenerated = (video: any) => {
    if (createdStory) {
      try {
        updateStory(createdStory.id, { 
          videos: [video],
          status: 'completed'
        });
        toast.success('Video saved to your story!');
      } catch (error) {
        console.error('Failed to save video:', error);
      }
    }
    toast.success('Video generated successfully!');
  };

  const handleCompleteWorkflow = () => {
    onComplete();
  };

  const handleAudioGenerated = (audioFiles: any[]) => {
    setGeneratedAudio(audioFiles);
    toast.success(`Generated ${audioFiles.length} audio files!`);
  };

  const isStepComplete = () => {
    switch (currentStep) {
      case 0:
        return !!selectedTemplate;
      case 1:
        return !!generatedStory;
      case 2:
        return !!editedStory.trim();
      case 3:
        return true; // AI Copilot is optional
      case 4:
        return extractedCharacters.length > 0;
      case 5:
        return storySegments.length > 0;
      case 6:
        return true; // Audio is optional
      case 7:
        return true;
      default:
        return false;
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 0:
        return 'Select a story template to guide the AI in creating your perfect story';
      case 1:
        return 'Chat with AI to develop your story idea into a complete screenplay';
      case 2:
        return 'Review and edit the AI-generated story to match your vision';
      case 3:
        return 'Use AI Copilot to enhance your story with smart suggestions and improvements';
      case 4:
        return 'AI will identify and create detailed character profiles with photos';
      case 5:
        return 'Break your story into scenes for optimal video generation';
      case 6:
        return 'Generate professional voiceovers for your characters (optional)';
      case 7:
        return 'Generate your final animated video with AI using multiple providers';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 overflow-x-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <motion.div
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                      : isCompleted
                      ? 'bg-accent-100 text-accent-700 dark:bg-accent-900 dark:text-accent-300'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{step.title}</span>
                </motion.div>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-300 mx-1 sm:mx-2 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
        
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {steps[currentStep].title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {getStepDescription()}
          </p>
        </div>
      </div>

      {/* Step Content */}
      <Card className="min-h-[600px]">
        <CardContent className="p-6">
          {currentStep === 0 && (
            <StoryTemplateSelector onTemplateSelect={setSelectedTemplate} />
          )}

          {currentStep === 1 && selectedTemplate && (
            <AIStoryChat
              theme={selectedTemplate.id}
              onStoryGenerated={setGeneratedStory}
              isGenerating={isGenerating}
            />
          )}

          {currentStep === 2 && (
            <StoryEditor
              initialStory={generatedStory}
              onStoryChange={setEditedStory}
            />
          )}

          {currentStep === 3 && (
            <AICopilot
              storyContent={editedStory}
              characters={extractedCharacters}
              onStoryUpdate={setEditedStory}
              onSuggestionApplied={(suggestion) => {
                console.log('Suggestion applied:', suggestion);
                toast.success('AI suggestion applied!');
              }}
            />
          )}

          {currentStep === 4 && (
            <CharacterExtractor
              story={editedStory}
              onCharactersExtracted={setExtractedCharacters}
            />
          )}

          {currentStep === 5 && (
            <SceneSegmenter
              story={editedStory}
              characters={extractedCharacters}
              onSegmentsCreated={setStorySegments}
            />
          )}

          {currentStep === 6 && (
            <AudioGenerator
              storySegments={storySegments}
              characters={extractedCharacters}
              onAudioGenerated={handleAudioGenerated}
            />
          )}

          {currentStep === 7 && (
            <div className="space-y-6">
              <VideoGenerator
                storySegments={storySegments}
                characters={extractedCharacters}
                onVideoGenerated={handleVideoGenerated}
              />
              
              {/* Complete Workflow Button */}
              <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={handleCompleteWorkflow}
                  variant="outline"
                  size="lg"
                >
                  Complete & Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || isGenerating}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        {currentStep < steps.length - 1 && (
          <Button
            onClick={handleNext}
            disabled={!isStepComplete() || isGenerating}
            isLoading={isGenerating}
          >
            {currentStep === 0 && selectedTemplate ? `Continue with ${selectedTemplate.name}` :
             currentStep === 1 ? 'Save Story & Continue' :
             currentStep === 2 ? 'Save Story & Continue' : 
             currentStep === 3 ? 'Continue to Characters' :
             currentStep === 4 ? 'Save Characters & Continue' :
             currentStep === 5 ? 'Save Segments & Continue' :
             currentStep === 6 ? 'Continue to Video Generation' :
             'Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Progress Indicator */}
      {createdStory && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Story "{createdStory.title}" is being saved to your dashboard
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
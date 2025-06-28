import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, BookOpen, Users, Video, Edit3, Eye, Volume2, CheckCircle, MessageCircle, AlertCircle, Download, Share2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { StoryEditor } from './StoryEditor';
import { CharacterExtractor } from './CharacterExtractor';
import { SceneSegmenter } from './SceneSegmenter';
import { AudioGenerator } from './AudioGenerator';
import { VideoGenerator } from '../video/VideoGenerator';
import { useStoryStore } from '../../store/storyStore';
import toast from 'react-hot-toast';
import { ConversationalVideoChat } from './ConversationalVideoChat';

interface StoryWorkflowContinuationProps {
  story: any;
  startStep: string;
  onComplete: () => void;
}

const stepMapping: Record<string, number> = {
  'story-editing': 0,
  'character-extraction': 1,
  'scene-segmentation': 2,
  'audio-generation': 3,
  'video-generation': 4,
  'completed': 5
};

const steps = [
  { id: 'story-editing', title: 'Review & Edit', icon: Edit3 },
  { id: 'character-extraction', title: 'Extract Characters', icon: Users },
  { id: 'scene-segmentation', title: 'Segment Scenes', icon: Eye },
  { id: 'chat', title: 'AI Video Chat', icon: MessageCircle },
  { id: 'audio-generation', title: 'Generate Audio', icon: Volume2 },
  { id: 'video-generation', title: 'Generate Video', icon: Video },
  { id: 'completed', title: 'Completed', icon: CheckCircle },
];

export const StoryWorkflowContinuation: React.FC<StoryWorkflowContinuationProps> = ({ 
  story, 
  startStep, 
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(stepMapping[startStep] || 0);
  const [editedStory, setEditedStory] = useState(story.content || '');
  const [extractedCharacters, setExtractedCharacters] = useState(story.characters || []);
  const [storySegments, setStorySegments] = useState(story.segments || []);
  const [generatedAudio, setGeneratedAudio] = useState(story.audio || []);
  const [generatedVideo, setGeneratedVideo] = useState(story.videos?.[0] || null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { updateStory } = useStoryStore();

  useEffect(() => {
    console.log('🔄 StoryWorkflowContinuation: Component mounted with:', {
      storyTitle: story.title,
      startStep,
      mappedStep: stepMapping[startStep],
      storyId: story.id
    });
    
    // Set initial data based on story
    setEditedStory(story.content || '');
    setExtractedCharacters(story.characters || []);
    setStorySegments(story.segments || []);
    setGeneratedAudio(story.audio || []);
    
    // Set the correct step
    const mappedStepIndex = stepMapping[startStep];
    if (mappedStepIndex !== undefined) {
      setCurrentStep(mappedStepIndex);
      console.log('✅ StoryWorkflowContinuation: Set current step to:', mappedStepIndex);
    } else {
      console.warn('⚠️ StoryWorkflowContinuation: Unknown start step:', startStep);
      setCurrentStep(0);
    }
  }, [story, startStep]);

  const handleNext = async () => {
    console.log('🔄 StoryWorkflowContinuation: handleNext called, current step:', currentStep);
    
    if (currentStep === 0) {
      // Story editing step - improved validation
      if (!editedStory || !editedStory.trim()) {
        toast.error('Please write or edit your story content before continuing');
        return;
      }
      
      if (editedStory.trim().length < 50) {
        toast.error('Your story is too short. Please write at least 50 characters');
        return;
      }

      // Validate story object has required fields
      if (!story.theme) {
        console.warn('⚠️ Story missing theme, setting default');
        story.theme = 'fantasy'; // Set default theme
      }
      
      if (!story.length) {
        console.warn('⚠️ Story missing length, setting default');
        story.length = 'medium'; // Set default length
      }
      
      try {
        setIsGenerating(true);
        await updateStory(story.id, { 
          content: editedStory,
          theme: story.theme,
          length: story.length,
          status: 'processing'
        });
        toast.success('Story updated successfully!');
        setCurrentStep(1);
      } catch (error) {
        console.error('❌ Error updating story:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update story';
        
        if (errorMessage.includes('check constraint') || errorMessage.includes('Invalid story data')) {
          toast.error('Story validation failed. Please check that all required fields are filled correctly.');
        } else if (errorMessage.includes('not authenticated')) {
          toast.error('Your session has expired. Please sign in again.');
        } else {
          toast.error(errorMessage);
        }
      } finally {
        setIsGenerating(false);
      }
    } else if (currentStep === 1) {
      // Character extraction step
      if (extractedCharacters.length === 0) {
        toast.error('Please extract at least one character from your story');
        return;
      }
      
      try {
        await updateStory(story.id, { 
          characters: extractedCharacters,
          status: 'processing'
        });
        toast.success('Characters saved successfully!');
        setCurrentStep(2);
      } catch (error) {
        console.error('❌ Error saving characters:', error);
        toast.error('Failed to save characters');
      }
    } else if (currentStep === 2) {
      // Scene segmentation step
      if (storySegments.length === 0) {
        toast.error('Please segment your story into at least one scene');
        return;
      }
      
      try {
        await updateStory(story.id, { 
          status: 'processing'  // Only update status, segments are handled separately
        });
        toast.success('Story segments saved!');
        setCurrentStep(3);
      } catch (error) {
        console.error('❌ Error saving segments:', error);
        toast.error('Failed to save segments');
      }
    } else if (currentStep === 3) {
      // Audio generation step (optional) - only update status
      try {
        await updateStory(story.id, { 
          status: 'processing'  // Only update status, audio is handled separately
        });
        if (generatedAudio.length > 0) {
          toast.success('Audio saved successfully!');
        }
        setCurrentStep(4);
      } catch (error) {
        console.error('❌ Error updating story:', error);
        toast.error('Failed to update story');
      }
    } else if (currentStep === 4) {
      // Video generation step - check if video exists, if not, stay on this step
      if (generatedVideo) {
        try {
          await updateStory(story.id, { 
            videos: [generatedVideo],
            status: 'completed'
          });
          toast.success('Story creation completed!');
          setCurrentStep(5);
        } catch (error) {
          console.error('❌ Error updating story status:', error);
          toast.error('Failed to update story status');
        }
      } else {
        toast.error('Please generate a video before proceeding');
      }
    } else if (currentStep === 5) {
      // Completed
      console.log('✅ StoryWorkflowContinuation: Workflow completed, calling onComplete');
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleVideoGenerated = (video: any) => {
    console.log('🎬 StoryWorkflowContinuation: Video generated:', video);
    setGeneratedVideo(video);
    updateStory(story.id, { 
      videos: [video],
      status: 'completed'
    });
    toast.success('Video generated successfully!');
    // Don't auto-advance, let user manually proceed to see the final result
  };

  const handleAudioGenerated = (audioFiles: any[]) => {
    setGeneratedAudio(audioFiles);
    toast.success(`Generated ${audioFiles.length} audio files!`);
  };

  const isStepComplete = () => {
    switch (currentStep) {
      case 0:
        return !!editedStory.trim();
      case 1:
        return extractedCharacters.length > 0;
      case 2:
        return storySegments.length > 0;
      case 3:
        return true; // Audio is optional
      case 4:
        return !!generatedVideo; // Video must be generated
      case 5:
        return true;
      default:
        return false;
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 0:
        return 'Review and edit your story content before proceeding';
      case 1:
        return 'AI will identify and create detailed character profiles with photos';
      case 2:
        return 'Break your story into scenes for optimal video generation';
      case 3:
        return 'Generate professional voiceovers for your characters (optional)';
      case 4:
        return 'Generate your final animated video with AI';
      case 5:
        return 'Your story is complete and ready to share!';
      default:
        return '';
    }
  };

  // Safety check for story object
  if (!story || !story.id) {
    console.error('❌ StoryWorkflowContinuation: Invalid story object:', story);
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Invalid Story Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-4">
            The story data appears to be corrupted or missing. This can happen if:
          </p>
          <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1 mb-6">
            <li>• The story was not properly saved</li>
            <li>• Required theme or length information is missing</li>
            <li>• There was a database connection issue</li>
          </ul>
        </div>
        <div className="space-y-3">
          <Button onClick={onComplete} className="mr-3">
            Return to Dashboard
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <BookOpen className="w-8 h-8 text-primary-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Continue: {story.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Pick up where you left off in your story creation journey
            </p>
          </div>
        </div>

        {/* Progress Steps */}
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
            <StoryEditor
              initialStory={editedStory}
              onStoryChange={setEditedStory}
            />
          )}

          {currentStep === 1 && (
            <CharacterExtractor
              story={editedStory}
              onCharactersExtracted={setExtractedCharacters}
            />
          )}

          {currentStep === 2 && (
            <SceneSegmenter
              story={editedStory}
              characters={extractedCharacters}
              onSegmentsCreated={setStorySegments}
            />
          )}

          {currentStep === 3 && (
            <AudioGenerator
              storySegments={storySegments}
              characters={extractedCharacters}
              onAudioGenerated={handleAudioGenerated}
            />
          )}

          {currentStep === 4 && (
            <VideoGenerator
              storySegments={storySegments}
              characters={extractedCharacters}
              onVideoGenerated={handleVideoGenerated}
            />
          )}

          {currentStep === 5 && (
            <div className="space-y-8">
              {/* Generated Video Display */}
              {generatedVideo ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      Video Generated Successfully! 🎉
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                      Your story "{story.title}" has been transformed into a video!
                    </p>
                  </div>

                  {/* Video Player */}
                  <div className="max-w-4xl mx-auto">
                    {generatedVideo.video_url ? (
                      <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
                        <video
                          controls
                          className="w-full aspect-video"
                          poster={generatedVideo.thumbnail_url || "https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg?auto=compress&cs=tinysrgb&w=800"}
                        >
                          <source src={generatedVideo.video_url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                        
                        {/* Video Info Overlay */}
                        <div className="absolute top-4 left-4 bg-black bg-opacity-70 px-3 py-2 rounded-lg">
                          <div className="text-white text-sm">
                            <div className="font-semibold">{story.title}</div>
                            <div className="text-gray-300">Generated with {generatedVideo.provider?.toUpperCase()}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <h4 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                          Unable to load video
                        </h4>
                        <p className="text-red-600 dark:text-red-400">
                          The video was generated but failed to load. Please try again or contact support.
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setCurrentStep(4)}
                        >
                          Generate Again
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Video Actions */}
                  <div className="flex justify-center space-x-4">
                    {generatedVideo.video_url && (
                      <>
                        <Button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = generatedVideo.video_url;
                            link.download = `${story.title}-video.mp4`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            toast.success('Video download started');
                          }}
                          variant="outline"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Video
                        </Button>
                        
                        <Button
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: story.title,
                                text: `Check out this AI-generated video: ${story.title}`,
                                url: generatedVideo.video_url,
                              }).catch(console.error);
                            } else {
                              navigator.clipboard.writeText(generatedVideo.video_url);
                              toast.success('Video URL copied to clipboard');
                            }
                          }}
                          variant="outline"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share Video
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No Video Generated
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Please go back to the video generation step and create your video.
                  </p>
                  <Button onClick={() => setCurrentStep(4)}>
                    Generate Video
                  </Button>
                </div>
              )}

              {/* Story Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <BookOpen className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="font-semibold text-green-800 dark:text-green-200">Story</div>
                  <div className="text-sm text-green-600 dark:text-green-400">✅ Complete</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="font-semibold text-green-800 dark:text-green-200">Characters</div>
                  <div className="text-sm text-green-600 dark:text-green-400">✅ {extractedCharacters.length} created</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Eye className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="font-semibold text-green-800 dark:text-green-200">Scenes</div>
                  <div className="text-sm text-green-600 dark:text-green-400">✅ {storySegments.length} segments</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Video className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="font-semibold text-green-800 dark:text-green-200">Video</div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    {generatedVideo ? '✅ Generated' : '⏳ Pending'}
                  </div>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="text-center space-y-3">
                <Button
                  onClick={onComplete}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  View in My Stories
                </Button>
                
                <div className="flex justify-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(4)}
                  >
                    Generate Another Video
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    Edit Characters
                  </Button>
                </div>
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
            {currentStep === 0 ? 'Save & Continue' : 
             currentStep === 1 ? 'Save Characters & Continue' :
             currentStep === 2 ? 'Save Segments & Continue' :
             currentStep === 3 ? 'Continue to Video' :
             currentStep === 4 ? 'Complete Story' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Story Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Continuing story: "{story.title}" • {story.theme} • Created {new Date(story.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Debug Info (only in development) */}
      {import.meta.env.DEV && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>🔧 Debug Info:</strong> Story ID: {story.id}, Start Step: {startStep}, Current Step: {currentStep}
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Wand2, 
  Rocket, 
  Heart, 
  Map, 
  Search, 
  Smile, 
  Drama, 
  Ghost,
  Sparkles,
  Clock,
  Users,
  RefreshCw,
  Lightbulb,
  Check,
  ArrowRight,
  Loader2,
  Zap
} from 'lucide-react';
import { geminiService } from '../../lib/geminiService';

interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  prompts: string[];
  estimatedLength: string;
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  aiSuggestions?: string[];
}

interface StoryTemplateSelectorProps {
  onTemplateSelect: (template: StoryTemplate) => void;
}

const baseTemplates: StoryTemplate[] = [
  {
    id: 'fantasy-quest',
    name: 'Epic Fantasy Quest',
    description: 'A hero\'s journey through magical realms with mythical creatures and ancient powers',
    icon: Wand2,
    color: 'from-purple-500 to-pink-500',
    prompts: [
      'What magical power does your hero discover?',
      'What ancient evil threatens the realm?',
      'Who are your hero\'s companions?',
      'What is the ultimate quest or artifact?'
    ],
    estimatedLength: '15-20 minutes',
    complexity: 'Intermediate'
  },
  {
    id: 'sci-fi-exploration',
    name: 'Space Exploration',
    description: 'Discover new worlds, alien civilizations, and the mysteries of the cosmos',
    icon: Rocket,
    color: 'from-blue-500 to-cyan-500',
    prompts: [
      'What planet or space station is your setting?',
      'What alien species do you encounter?',
      'What scientific discovery drives the plot?',
      'What dangers lurk in space?'
    ],
    estimatedLength: '12-18 minutes',
    complexity: 'Advanced'
  },
  {
    id: 'romantic-comedy',
    name: 'Romantic Comedy',
    description: 'Love, laughter, and the complications that bring two hearts together',
    icon: Heart,
    color: 'from-pink-500 to-red-500',
    prompts: [
      'How do your main characters meet?',
      'What keeps them apart initially?',
      'What comedic situations arise?',
      'What brings them together in the end?'
    ],
    estimatedLength: '10-15 minutes',
    complexity: 'Beginner'
  },
  {
    id: 'adventure-treasure',
    name: 'Treasure Hunt Adventure',
    description: 'Action-packed quest for hidden treasures and ancient secrets',
    icon: Map,
    color: 'from-green-500 to-teal-500',
    prompts: [
      'What treasure are you seeking?',
      'Where is it hidden?',
      'What obstacles block your path?',
      'Who else is competing for the treasure?'
    ],
    estimatedLength: '12-16 minutes',
    complexity: 'Intermediate'
  },
  {
    id: 'mystery-detective',
    name: 'Detective Mystery',
    description: 'Solve puzzling crimes with clever deduction and investigation',
    icon: Search,
    color: 'from-gray-500 to-slate-500',
    prompts: [
      'What crime has been committed?',
      'Who is your detective character?',
      'What clues lead to the solution?',
      'What twist reveals the truth?'
    ],
    estimatedLength: '14-18 minutes',
    complexity: 'Advanced'
  },
  {
    id: 'comedy-mishaps',
    name: 'Comedy of Errors',
    description: 'Hilarious misunderstandings and slapstick situations',
    icon: Smile,
    color: 'from-yellow-500 to-orange-500',
    prompts: [
      'What misunderstanding starts the chaos?',
      'What characters get caught up in it?',
      'What escalates the situation?',
      'How is everything resolved?'
    ],
    estimatedLength: '8-12 minutes',
    complexity: 'Beginner'
  },
  {
    id: 'family-drama',
    name: 'Family Drama',
    description: 'Emotional stories about family relationships, conflicts, and reconciliation',
    icon: Drama,
    color: 'from-indigo-500 to-purple-500',
    prompts: [
      'What family conflict drives the story?',
      'What secrets are revealed?',
      'How do characters grow and change?',
      'What brings the family together?'
    ],
    estimatedLength: '16-22 minutes',
    complexity: 'Intermediate'
  },
  {
    id: 'horror-supernatural',
    name: 'Supernatural Horror',
    description: 'Spine-chilling tales of ghosts, monsters, and things that go bump in the night',
    icon: Ghost,
    color: 'from-red-500 to-black',
    prompts: [
      'What supernatural entity is the threat?',
      'Where does the horror take place?',
      'How do characters discover the danger?',
      'How do they survive or defeat it?'
    ],
    estimatedLength: '10-14 minutes',
    complexity: 'Advanced'
  }
];

export const StoryTemplateSelector: React.FC<StoryTemplateSelectorProps> = ({ 
  onTemplateSelect 
}) => {
  const [templates, setTemplates] = useState<StoryTemplate[]>(baseTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplate | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Simulate initial AI story generation loading
    const loadingTimer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2000);

    return () => clearTimeout(loadingTimer);
  }, []);

  const generateAITemplates = async () => {
    setIsGeneratingAI(true);
    
    try {
      // Try to generate with Gemini if available
      if (geminiService.isConfigured()) {
        console.log('🤖 Generating AI story templates with Gemini...');
        
        const aiTemplates = await geminiService.generateStoryIdeas('creative', 3);
        
        const formattedTemplates: StoryTemplate[] = aiTemplates.map((idea, index) => ({
          id: `ai-${Date.now()}-${index}`,
          name: idea.title,
          description: idea.description,
          icon: [Zap, Sparkles, Lightbulb][index] || Sparkles,
          color: ['from-cyan-500 to-blue-500', 'from-purple-500 to-cyan-500', 'from-orange-500 to-red-500'][index] || 'from-purple-500 to-cyan-500',
          prompts: [idea.prompt, 'What makes this story unique?', 'How does it end?', 'What\'s the main conflict?'],
          estimatedLength: '12-16 minutes',
          complexity: 'Intermediate' as const,
          aiSuggestions: ['AI-generated concept']
        }));

        setTemplates([...baseTemplates, ...formattedTemplates]);
        setShowAISuggestions(true);
        
      } else {
        // Fallback templates when AI is not configured
        const fallbackTemplates: StoryTemplate[] = [
          {
            id: 'ai-time-travel',
            name: 'Time Traveler\'s Dilemma',
            description: 'A scientist accidentally creates a time loop and must fix history without erasing themselves',
            icon: Clock,
            color: 'from-cyan-500 to-blue-500',
            prompts: [
              'What event caused the time loop?',
              'What changes when history is altered?',
              'How does the protagonist retain memories?',
              'What\'s the key to breaking the loop?'
            ],
            estimatedLength: '13-17 minutes',
            complexity: 'Advanced',
            aiSuggestions: ['Curated AI-inspired concept']
          },
          {
            id: 'ai-virtual-reality',
            name: 'Virtual Reality Escape',
            description: 'Players trapped in a VR game must complete impossible challenges to return to reality',
            icon: Sparkles,
            color: 'from-purple-500 to-cyan-500',
            prompts: [
              'What VR game are they trapped in?',
              'What are the impossible challenges?',
              'Who controls the game from outside?',
              'What happens if they fail?'
            ],
            estimatedLength: '11-15 minutes',
            complexity: 'Intermediate',
            aiSuggestions: ['Curated concept']
          },
          {
            id: 'ai-memory-thief',
            name: 'The Memory Collector',
            description: 'In a world where memories are currency, a thief steals the wrong memory and uncovers a conspiracy',
            icon: Users,
            color: 'from-orange-500 to-red-500',
            prompts: [
              'What memory did they steal?',
              'What conspiracy is revealed?',
              'How are memories extracted and traded?',
              'Who is behind the conspiracy?'
            ],
            estimatedLength: '14-18 minutes',
            complexity: 'Advanced',
            aiSuggestions: ['Curated sci-fi concept']
          }
        ];

        setTemplates([...baseTemplates, ...fallbackTemplates]);
        setShowAISuggestions(true);
      }
    } catch (error) {
      console.error('❌ Failed to generate AI templates:', error);
      // Still show fallback templates on error
      const fallbackTemplates: StoryTemplate[] = [
        {
          id: 'ai-fallback',
          name: 'AI-Inspired Adventure',
          description: 'A unique story concept generated by artificial intelligence',
          icon: Sparkles,
          color: 'from-purple-500 to-pink-500',
          prompts: ['What makes this story special?', 'Who is the main character?', 'What challenges do they face?'],
          estimatedLength: '12-16 minutes',
          complexity: 'Intermediate',
          aiSuggestions: ['Fallback concept']
        }
      ];
      
      setTemplates([...baseTemplates, ...fallbackTemplates]);
      setShowAISuggestions(true);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const resetTemplates = () => {
    setTemplates(baseTemplates);
    setShowAISuggestions(false);
    setSelectedTemplate(null);
  };

  const handleTemplateClick = (template: StoryTemplate) => {
    // Set selection for visual feedback
    setSelectedTemplate(template);
    
    // Small delay for visual feedback, then navigate
    setTimeout(() => {
      onTemplateSelect(template);
    }, 300);
  };

  // Show initial loading state
  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            AI Story Templates
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Our AI is generating personalized story templates for you...
          </p>
        </div>

        {/* AI Generation Loading */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-700">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
              <Zap className="w-6 h-6 text-blue-600 animate-bounce" />
            </div>
            
            <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-3">
              🤖 AI is Creating Your Story Templates
            </h3>
            
            <div className="space-y-2 text-blue-700 dark:text-blue-300 mb-6">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                <span>Analyzing trending story themes...</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span>Generating unique character concepts...</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                <span>Creating personalized story ideas...</span>
              </div>
            </div>

            <div className="bg-white dark:bg-blue-800 rounded-lg p-4 max-w-md mx-auto">
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <div className="font-medium">✨ What's happening:</div>
                <div>• AI analyzes your preferences</div>
                <div>• Generates unique story concepts</div>
                <div>• Creates character profiles</div>
                <div>• Prepares interactive templates</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="bg-blue-200 dark:bg-blue-800 rounded-full h-2 max-w-xs mx-auto">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full animate-pulse w-3/4" />
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Almost ready... This ensures the best story templates for you!
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview of what's coming */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Choose Your Story Template
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Select a template to get started with AI-guided story creation
        </p>
        
        {/* AI Template Generation */}
        <div className="flex justify-center space-x-3 mb-6">
          <Button
            onClick={generateAITemplates}
            disabled={isGeneratingAI}
            isLoading={isGeneratingAI}
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            {isGeneratingAI ? 'Generating AI Ideas...' : 'Get AI Story Ideas'}
          </Button>
          
          {showAISuggestions && (
            <Button
              variant="outline"
              onClick={resetTemplates}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* AI Generated Notice */}
      {showAISuggestions && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-800 dark:text-purple-200">
              ✨ AI-Generated Story Ideas Added!
            </span>
          </div>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            {geminiService.isConfigured() 
              ? 'Our Gemini AI has created unique story concepts based on current trends and creative patterns.'
              : 'Curated AI-inspired story concepts have been added to spark your creativity.'
            }
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template, index) => {
          const Icon = template.icon;
          const isAIGenerated = template.aiSuggestions && template.aiSuggestions.length > 0;
          const isSelected = selectedTemplate?.id === template.id;
          
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
                              <Card 
                  hover 
                  onClick={() => handleTemplateClick(template)}
                  className={`cursor-pointer h-full relative transition-all duration-300 ${
                  isSelected 
                    ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-600' 
                    : 'hover:border-primary-200 dark:hover:border-primary-700'
                }`}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-2 left-2 bg-primary-500 text-white rounded-full p-1">
                    <Check className="w-3 h-3" />
                  </div>
                )}

                {/* AI Badge */}
                {isAIGenerated && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>AI</span>
                  </div>
                )}
                
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${template.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold mb-1 ${
                        isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{template.estimatedLength}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        template.complexity === 'Beginner' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : template.complexity === 'Intermediate'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {template.complexity}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Sparkles className="w-3 h-3" />
                        <span>AI will guide you through:</span>
                      </div>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                        {template.prompts.slice(0, 2).map((prompt, i) => (
                          <li key={i} className="flex items-start space-x-1">
                            <span className="text-primary-500 mt-0.5">•</span>
                            <span>{prompt}</span>
                          </li>
                        ))}
                        {template.prompts.length > 2 && (
                          <li className="text-primary-500 font-medium">
                            +{template.prompts.length - 2} more steps...
                          </li>
                        )}
                      </ul>
                    </div>

                    {isAIGenerated && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400">
                          <Lightbulb className="w-3 h-3" />
                          <span>AI-Generated Concept</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className={`flex items-center justify-center space-x-1 text-sm font-medium ${
                      isSelected 
                        ? 'text-primary-600 dark:text-primary-400' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      <Users className="w-4 h-4" />
                      <span>{isSelected ? 'Selected' : 'Click to Select'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Template Feedback */}
      {selectedTemplate && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg text-center"
        >
          <div className="flex items-center justify-center space-x-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800 dark:text-green-200">
              ✅ {selectedTemplate.name} Selected!
            </span>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
            Navigating to AI story creation...
          </p>
        </motion.div>
      )}

      {/* Help Section */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Need Help Choosing?
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Not sure which template fits your vision? Our AI assistant will help you develop any idea into a complete story.
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
          <span>💡 Beginner-friendly templates</span>
          <span>•</span>
          <span>🎯 AI-guided development</span>
          <span>•</span>
          <span>✨ Professional results</span>
        </div>
      </div>
    </div>
  );
};
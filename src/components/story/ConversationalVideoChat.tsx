import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, MessageCircle, Mic, Send, Play, Pause, Volume2, VolumeX, UserPlus, Sparkles, Bot, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { tavusService } from '../../lib/tavusService';
import toast from 'react-hot-toast';

interface ConversationalVideoChatProps {
  characters: any[];
  storyContext: string;
  onVideoGenerated: (video: any) => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  character?: string;
  video_url?: string;
  audio_url?: string;
  timestamp: Date;
}

export const ConversationalVideoChat: React.FC<ConversationalVideoChatProps> = ({
  characters,
  storyContext,
  onVideoGenerated
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoAgents, setVideoAgents] = useState<any[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    initializeVideoAgents();
    addWelcomeMessage();
  }, [characters]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeVideoAgents = async () => {
    setIsLoading(true);
    try {
      console.log('🎬 Initializing Tavus video agents...');
      
      // Create video agents for each character
      const agents = [];
      for (const character of characters.slice(0, 3)) { // Limit to 3 for demo
        const agent = await tavusService.createVideoAgent(character);
        agents.push({ ...agent, character });
      }
      
      setVideoAgents(agents);
      
      if (agents.length > 0) {
        setSelectedCharacter(agents[0].id);
      }
      
      toast.success(`🎭 Created ${agents.length} AI video agents!`);
    } catch (error) {
      console.error('Failed to initialize video agents:', error);
      toast.error('Failed to initialize video agents');
    } finally {
      setIsLoading(false);
    }
  };

  const addWelcomeMessage = () => {
    const welcomeMessage: ChatMessage = {
      id: '1',
      type: 'agent',
      content: `🎬 **Tavus AI Video Agents Activated!**

${tavusService.isConfigured() ? 'Premium conversational video AI ready!' : 'Demo video chat mode active!'}

I can help bring your story characters to life with personalized video conversations:

🎭 **Character Interaction** - Chat with any story character
📹 **Video Responses** - Get real-time video replies  
🎪 **Social Sharing** - Perfect for social media content
🔊 **Audio & Visual** - Complete audiovisual storytelling

Choose a character and start chatting! I'll generate video responses as that character based on your story context.

💡 **Try asking:**
• "Tell me about your backstory"
• "How do you feel about the other characters?"
• "What's your motivation in this story?"
• "Give me a story summary from your perspective"`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating || !selectedCharacter) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsGenerating(true);

    try {
      const selectedAgent = videoAgents.find(agent => agent.id === selectedCharacter);
      const character = selectedAgent?.character;

      console.log('🎬 Generating conversational video with Tavus...');

      const conversationResponse = await tavusService.generateConversationalVideo({
        message: userMessage.content,
        character: selectedCharacter,
        context: `${storyContext}\n\nCharacter: ${character?.name} - ${character?.description}`,
        emotion: 'neutral'
      });

      const agentMessage: ChatMessage = {
        id: conversationResponse.id,
        type: 'agent',
        content: conversationResponse.transcript,
        character: character?.name,
        video_url: conversationResponse.video_url,
        audio_url: conversationResponse.audio_url,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, agentMessage]);
      
      // Auto-play the video response
      if (conversationResponse.video_url) {
        setTimeout(() => {
          playVideo(agentMessage.id, conversationResponse.video_url);
        }, 500);
      }

      onVideoGenerated({
        id: conversationResponse.id,
        video_url: conversationResponse.video_url,
        character: character?.name,
        type: 'conversational',
        transcript: conversationResponse.transcript
      });

      toast.success(`🎭 ${character?.name} responded with video!`);
    } catch (error: any) {
      console.error('Failed to generate conversational video:', error);
      
      // Fallback text response
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: `I apologize, but I'm having trouble generating a video response right now. However, as ${videoAgents.find(a => a.id === selectedCharacter)?.character?.name}, I'd be happy to chat with you about the story! ${inputValue.includes('?') ? 'What would you like to know?' : 'Tell me more!'}`,
        character: videoAgents.find(a => a.id === selectedCharacter)?.character?.name,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      toast.error('Video generation failed, but character is still chatting!');
    } finally {
      setIsGenerating(false);
    }
  };

  const playVideo = (messageId: string, videoUrl: string) => {
    if (videoRef.current) {
      videoRef.current.src = videoUrl;
      videoRef.current.play().catch(console.error);
      setCurrentlyPlaying(messageId);
    }
  };

  const pauseVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setCurrentlyPlaying(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getCharacterInfo = (characterName: string) => {
    const character = characters.find(c => c.name === characterName);
    return character || { name: characterName, description: 'AI Character' };
  };

  if (isLoading) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                🎬 Initializing Tavus Video Agents
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Creating AI video personas for your characters...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Video className="w-5 h-5 text-primary-500" />
            <span>Conversational AI Video Chat</span>
            <span className="text-xs bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-2 py-1 rounded-full">
              Powered by Tavus
            </span>
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Chat with your story characters using real-time AI video generation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-green-600 dark:text-green-400 flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Tavus AI Active</span>
          </span>
        </div>
      </div>

      {/* Tavus Integration Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3 flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>🏆 Bolt Hackathon Challenge: Conversational AI Video</span>
          </h4>
          <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="font-medium mb-1">Tavus Integration Features:</div>
                <ul className="space-y-1 text-xs">
                  <li>• Real-time AI video agent creation</li>
                  <li>• Character-specific video responses</li>
                  <li>• Conversational AI with video output</li>
                  <li>• Story context awareness</li>
                </ul>
              </div>
              <div>
                <div className="font-medium mb-1">Technical Implementation:</div>
                <ul className="space-y-1 text-xs">
                  <li>• Tavus API integration for video agents</li>
                  <li>• Real-time video generation</li>
                  <li>• Character personality mapping</li>
                  <li>• Seamless video playback</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Character Selection */}
      <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
        <CardHeader>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>Select Character to Chat With</span>
          </h4>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {videoAgents.map((agent) => (
              <motion.button
                key={agent.id}
                onClick={() => setSelectedCharacter(agent.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedCharacter === agent.id
                    ? 'border-primary-500 bg-primary-100 dark:bg-primary-900/40'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {agent.character.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {agent.character.role} • Video Agent Ready
                </div>
                {selectedCharacter === agent.id && (
                  <div className="text-xs text-primary-600 dark:text-primary-400 mt-1 flex items-center space-x-1">
                    <Video className="w-3 h-3" />
                    <span>Selected</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      {selectedCharacter ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Chat with {videoAgents.find(a => a.id === selectedCharacter)?.character.name}
              </h4>
                               <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setSelectedCharacter('')}
                 >
                Change Character
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Video Display */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  controls
                  poster="/api/placeholder/640/360"
                >
                  Your browser does not support the video tag.
                </video>
                {!currentlyPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center text-white">
                      <Video className="w-12 h-12 mx-auto mb-2 opacity-70" />
                      <p className="text-sm">Video responses will appear here</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Messages */}
              <div className="h-64 overflow-y-auto border rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-primary-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border'
                      }`}
                    >
                      <div className="text-sm">{message.content}</div>
                      {message.video_url && (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (currentlyPlaying === message.id) {
                                pauseVideo();
                              } else {
                                playVideo(message.id, message.video_url!);
                              }
                            }}
                            className="text-xs"
                          >
                            {currentlyPlaying === message.id ? 'Pause' : 'Play'} Video
                          </Button>
                        </div>
                      )}
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                                 {isGenerating && (
                   <div className="flex justify-start">
                     <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border px-4 py-2 rounded-lg">
                       <div className="flex items-center space-x-2">
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                         <span className="text-sm">Generating video response...</span>
                       </div>
                     </div>
                   </div>
                 )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
                             <div className="flex space-x-2">
                 <input
                   type="text"
                   value={inputValue}
                   onChange={(e) => setInputValue(e.target.value)}
                   onKeyPress={handleKeyPress}
                   placeholder={`Send a message to ${videoAgents.find(a => a.id === selectedCharacter)?.character.name}...`}
                   className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                   disabled={isGenerating}
                 />
                 <Button
                   onClick={handleSendMessage}
                   disabled={!inputValue.trim() || isGenerating}
                   isLoading={isGenerating}
                 >
                   Send
                 </Button>
               </div>

               {/* Quick Actions */}
               <div className="flex flex-wrap gap-2">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setInputValue("Tell me about yourself")}
                   disabled={isGenerating}
                 >
                   About You
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setInputValue("What's your role in the story?")}
                   disabled={isGenerating}
                 >
                   Your Role
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setInputValue("Share your thoughts on the story")}
                   disabled={isGenerating}
                 >
                   Story Thoughts
                 </Button>
               </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <Video className="w-16 h-16 text-primary-500 mx-auto" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  🎬 Ready for Conversational Video Chat
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Select a character above to start chatting with them via AI-generated video responses.
                </p>
                
                {/* API Status */}
                <div className={`mt-6 p-4 bg-gradient-to-r border rounded-lg ${
                  tavusService.isConfigured()
                    ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700'
                    : 'from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-700'
                }`}>
                  <div className="text-center">
                    <h4 className={`font-semibold mb-2 ${
                      tavusService.isConfigured()
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-orange-800 dark:text-orange-200'
                    }`}>
                      🏆 Bolt Hackathon Challenge Integration
                    </h4>
                    <p className={`text-sm ${
                      tavusService.isConfigured()
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-orange-700 dark:text-orange-300'
                    }`}>
                      Conversational AI Video Challenge by integrating Tavus for real-time character video chats.
                    </p>
                    
                    {tavusService.isConfigured() ? (
                      <div className="mt-3 flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          ✅ Tavus API Connected - Premium Features Active
                        </span>
                      </div>
                    ) : (
                      <div className="mt-3 text-xs text-orange-600 dark:text-orange-400">
                        ⚠️ Add your VITE_TAVUS_API_KEY to enable full functionality
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 
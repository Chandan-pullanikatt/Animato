import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, Users, Video, Clock, Star, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Modal } from '../ui/Modal';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignUp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignUp }) => {
  const [showDemoModal, setShowDemoModal] = useState(false);

  const features = [
    {
      icon: Sparkles,
      title: 'AI Story Analysis',
      description: 'Advanced AI analyzes your story to create compelling characters and scenes',
    },
    {
      icon: Users,
      title: 'Character Generation',
      description: 'Generate unique, diverse characters with realistic photos and personalities',
    },
    {
      icon: Video,
      title: 'Video Creation',
      description: 'Transform stories into stunning animated videos using cutting-edge AI',
    },
    {
      icon: Clock,
      title: 'Fast Processing',
      description: 'Get your animated story video in minutes, not hours or days',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Stories Created' },
    { value: '50K+', label: 'Characters Generated' },
    { value: '99%', label: 'Satisfaction Rate' },
    { value: '24/7', label: 'AI Processing' },
  ];

  const handleWatchDemo = () => {
    setShowDemoModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Transform Your Stories Into{' '}
              <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Stunning Videos
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
            >
              Animato uses advanced AI to turn your written stories into captivating animated videos complete with characters, scenes, and narration.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Button size="lg" onClick={onSignUp}>
                <Play className="w-5 h-5 mr-2" />
                Start Creating Free
              </Button>
              <Button variant="outline" size="lg" onClick={handleWatchDemo}>
                Watch Demo
              </Button>
            </motion.div>

            {/* Video Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="relative max-w-4xl mx-auto"
            >
              <div className="aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 rounded-2xl flex items-center justify-center border border-primary-200 dark:border-primary-700 shadow-2xl">
                <div className="text-center">
                  <Video className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                  <p className="text-primary-700 dark:text-primary-300 text-lg font-medium">
                    AI-Generated Story Video Preview
                  </p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-accent-400 to-accent-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Powered by Advanced AI
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 dark:text-gray-300"
            >
              Experience the future of storytelling with our cutting-edge AI technology
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card hover className="h-full">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Bring Your Stories to Life?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of creators who are already using Animato to transform their stories into captivating videos.
            </p>
            <Button
              size="lg"
              onClick={onSignUp}
              className="bg-white text-primary-600 hover:bg-gray-100"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Your First Story
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Demo Modal */}
      <Modal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        maxWidth="4xl"
      >
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Animato Demo Video
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            See how Animato transforms stories into stunning animated videos
          </p>
        </div>
        
        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
          <video
            controls
            className="w-full h-full"
            poster="https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg?auto=compress&cs=tinysrgb&w=800"
          >
            <source
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>
        
        <div className="mt-6 text-center">
          <Button onClick={onSignUp} className="mr-4">
            <Play className="w-4 h-4 mr-2" />
            Try It Now
          </Button>
          <Button variant="outline" onClick={() => setShowDemoModal(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};
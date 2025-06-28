import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { SignInPage } from './SignInPage';
import { SignUpPage } from './SignUpPage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'signin' 
}) => {
  const [currentMode, setCurrentMode] = useState<'signin' | 'signup'>(initialMode);

  const handleSwitchToSignUp = () => {
    setCurrentMode('signup');
  };

  const handleSwitchToSignIn = () => {
    setCurrentMode('signin');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
    >
      <div className="relative">
        {currentMode === 'signin' ? (
          <SignInPage 
            onSwitchToSignUp={handleSwitchToSignUp}
            onClose={onClose}
          />
        ) : (
          <SignUpPage 
            onSwitchToSignIn={handleSwitchToSignIn}
            onClose={onClose}
          />
        )}
      </div>
    </Modal>
  );
};
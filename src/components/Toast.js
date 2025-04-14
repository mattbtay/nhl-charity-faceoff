import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: ${props => props.theme.borderRadius.medium};
  background-color: ${props => props.color || props.theme.colors.success};
  color: white;
  box-shadow: ${props => props.theme.shadows.medium};
  z-index: 1000;
  animation: ${props => props.isClosing ? slideOut : slideIn} 0.5s ease-in-out;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 400px;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.1),
      rgba(255, 255, 255, 0)
    );
    border-radius: inherit;
    pointer-events: none;
  }
`;

const Message = styled.div`
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.4;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  margin-left: auto;
  opacity: 0.7;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 1;
  }
`;

// Toast component with auto-dismiss functionality
const Toast = ({ message, color, isClosing, duration = 5000, onClose }) => {
  const [internalIsClosing, setInternalIsClosing] = useState(false);
  
  // Handle both internal and external closing states
  const effectiveIsClosing = isClosing || internalIsClosing;
  
  useEffect(() => {
    let dismissTimer;
    let closeTimer;
    
    // Only set timer if toast is visible and not already closing
    if (!effectiveIsClosing && duration > 0) {
      console.log('Setting toast dismiss timer for', duration, 'ms');
      // Set timer to close the toast after duration
      dismissTimer = setTimeout(() => {
        console.log('Toast dismiss timer fired, starting closing animation');
        setInternalIsClosing(true);
        
        // After animation completes, call the onClose callback
        closeTimer = setTimeout(() => {
          console.log('Toast close timer fired, calling onClose');
          if (onClose) onClose();
        }, 500); // Match this with the animation duration
      }, duration);
    }
    
    // Cleanup timers
    return () => {
      if (dismissTimer) {
        console.log('Clearing toast dismiss timer');
        clearTimeout(dismissTimer);
      }
      if (closeTimer) {
        console.log('Clearing toast close timer');
        clearTimeout(closeTimer);
      }
    };
  }, [duration, effectiveIsClosing, onClose]);
  
  // Clean up completely when unmounted
  useEffect(() => {
    return () => {
      // Ensure we clean up properly when unmounted
      if (onClose && !effectiveIsClosing) {
        console.log('Toast unmounted without proper closure, calling onClose');
        onClose();
      }
    };
  }, [onClose, effectiveIsClosing]);
  
  const handleClose = () => {
    setInternalIsClosing(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 500);
  };
  
  return (
    <ToastContainer color={color} isClosing={effectiveIsClosing}>
      <Message>{message}</Message>
      <CloseButton onClick={handleClose}>&times;</CloseButton>
    </ToastContainer>
  );
};

export default Toast; 
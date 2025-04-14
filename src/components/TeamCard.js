import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import styled, { keyframes, css } from 'styled-components';
import { subscribeToDonationTotals } from '../config/firebase';
import Spinner from './Spinner';
import stripePromise from '../config/stripe';

const Card = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2.5rem;
  background: ${props => props.theme.colors.backgroundAlt};
  border-radius: ${props => props.theme.borderRadius.large};
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  height: 100%;
  transition: transform ${props => props.theme.transitions.default};
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
  }

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.1),
      rgba(255, 255, 255, 0)
    );
    pointer-events: none;
  }
`;

const LogoContainer = styled.div`
  position: relative;
  width: 160px;
  height: 160px;
  margin-bottom: 2rem;
  flex-shrink: 0;
  transition: transform ${props => props.theme.transitions.default};

  ${Card}:hover & {
    transform: scale(1.05);
  }
`;

const TeamName = styled.h2`
  font-family: ${props => props.theme.fonts.heading};
  font-size: 1.75rem;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.75rem;
  text-align: center;
  letter-spacing: -0.5px;
  flex-shrink: 0;
`;

const CharityName = styled.h3`
  font-size: 1.1rem;
  color: ${props => props.theme.colors.textLight};
  margin-bottom: 1.5rem;
  text-align: center;
  line-height: 1.4;
  flex-shrink: 0;
  min-height: 3em;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DonationInfo = styled.div`
  width: 100%;
  margin-bottom: auto;
  text-align: center;
  flex-shrink: 0;
`;

const DonationAmount = styled.div`
  font-family: ${props => props.theme.fonts.heading};
  font-size: 2.5rem;
  font-weight: bold;
  color: ${props => props.$teamColor || props.theme.colors.primary};
  margin-top: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  
  .currency {
    font-size: 0.6em;
    margin-right: 0.1em;
    opacity: 0.8;
    display: ${props => props.$isLoading ? 'none' : 'inline'};
  }
`;

const DonationLabel = styled.div`
  font-size: 1.25rem;
  font-weight: 500;
  color: ${props => props.theme.colors.textLight};
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const DonateButton = styled.button`
  display: inline-block;
  background-color: ${props => props.$teamColor || props.theme.colors.accent};
  color: white;
  padding: 1rem 2.5rem;
  border-radius: ${props => props.theme.borderRadius.medium};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all ${props => props.theme.transitions.default};
  position: relative;
  overflow: hidden;
  margin-top: 2rem;
  border: none;
  cursor: pointer;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.1),
      rgba(255, 255, 255, 0)
    );
    transform: translateX(-100%);
    transition: transform ${props => props.theme.transitions.default};
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.medium};
    opacity: 0.9;

    &:before {
      transform: translateX(0);
    }
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 1.5rem;
  min-height: 3.5rem;
`;

const numberTransition = keyframes`
  0% {
    transform: translateY(100%);
    opacity: 0;
  }
  50% {
    transform: translateY(-10%);
    opacity: 1;
  }
  75% {
    transform: translateY(5%);
    opacity: 1;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
`;

const AnimatedContainer = styled.div`
  color: ${props => props.$teamColor};
  display: flex;
  gap: 1px;
  overflow: hidden;
  position: relative;
`;

const AnimatedNumber = styled.span`
  display: inline-block;
  opacity: 0;
  animation: ${numberTransition} 800ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: ${props => props.index * 50}ms;
  
  ${props => props.isAnimating && css`
    animation: none;
    opacity: 1;
    transform: translateY(0);
  `}
  
  ${props => props.shouldAnimate && css`
    animation: ${numberTransition} 800ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    animation-delay: ${props => props.index * 50}ms;
  `}
`;

const AnimatedValue = ({ value, teamColor }) => {
  // Split the value into individual digits for animation
  const digits = value.toString().split('');
  
  // Generate a unique key for each digit based on its position and value
  return (
    <AnimatedContainer $teamColor={teamColor}>
      {digits.map((digit, index) => (
        <AnimatedNumber 
          key={`${value}-${index}-${digit}`}
          index={index} 
          shouldAnimate={true}
        >
          {digit}
        </AnimatedNumber>
      ))}
    </AnimatedContainer>
  );
};

const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(number);
};

const TeamCard = ({ team }) => {
  const [donationTotal, setDonationTotal] = useState(team.donationTotal || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const previousTotalRef = useRef(team.donationTotal || 0);
  const forceUpdate = useRef(0);
  const animationKeyRef = useRef(Date.now());

  // Effect for handling Firestore subscription
  useEffect(() => {
    console.log('🏒 Setting up donation subscription for team:', team.id, 'initial total:', team.donationTotal);
    setIsLoading(true);
    
    const unsubscribe = subscribeToDonationTotals(team.id, (total, error) => {
      const timestamp = new Date().toISOString();
      console.log('📝 Received donation update:', { 
        teamId: team.id, 
        total, 
        error,
        previousTotal: previousTotalRef.current,
        timestamp
      });
      
      if (error) {
        console.error('❌ Error in donation subscription:', error);
        setError(error);
        setIsLoading(false);
        return;
      }
      
      // Create a new animation key timestamp for each update
      animationKeyRef.current = Date.now();
      
      // Always update the UI when we get a Firestore update, even if the amounts appear the same
      // This ensures UI updates even when the server value is reset to the same value
      console.log('💰 Updating donation total in UI:', { 
        teamId: team.id, 
        previousTotal: previousTotalRef.current, 
        newTotal: total,
        difference: total - previousTotalRef.current,
        animationKey: animationKeyRef.current
      });
      
      previousTotalRef.current = total;
      setDonationTotal(total);
      forceUpdate.current += 1; // Force the AnimatedValue to re-animate
      
      setIsLoading(false);
    });

    return () => {
      console.log('🧹 Cleaning up donation subscription for team:', team.id);
      unsubscribe();
    };
  }, [team.id]);

  const handleDonateClick = async () => {
    try {
      setIsProcessing(true);
      
      // Create a checkout session
      console.log(`Initiating donation for team: ${team.id}, charity: ${team.charityName}`);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: team.id,
          charityName: team.charityName,
          amount: 100, // $100 fixed donation amount
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Checkout session creation failed:', response.status, errorData);
        
        // Check for specific Stripe configuration error
        if (errorData.message === 'Stripe configuration error') {
          throw new Error('Payment processing is currently unavailable. Please try again later or contact support.');
        } else if (errorData.error && errorData.error.includes('API Key')) {
          throw new Error('Payment system configuration error. Please notify the site administrator.');
        } else {
          throw new Error(errorData.message || `API error: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.sessionId) {
        throw new Error('No session ID returned from API');
      }
      
      console.log('Checkout session created, redirecting to Stripe');

      // Get Stripe.js instance
      const stripe = await stripePromise;
      
      // Check if Stripe is properly initialized
      if (!stripe) {
        throw new Error('Payment system is not available. Please check that the NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable is set.');
      }

      // Safely handle the redirectToCheckout call
      try {
        // Redirect to Checkout
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });

        if (error) {
          console.error('Error redirecting to checkout:', error);
          throw error;
        }
      } catch (redirectError) {
        console.error('Failed to redirect to checkout:', redirectError);
        throw new Error('Could not open payment page. Please ensure cookies are enabled and try again.');
      }
    } catch (error) {
      console.error('Error initiating donation:', error);
      setError(error);
      // Show error to user
      alert(`Donation error: ${error.message || 'Could not process donation. Please try again.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <LogoContainer>
        <Image
          src={team.logo}
          alt={`${team.name} logo`}
          fill
          sizes="(max-width: 320px) 160px"
          style={{ objectFit: 'contain' }}
          priority
        />
      </LogoContainer>
      <TeamName>{team.name}</TeamName>
      <CharityName>{team.charityName}</CharityName>
      <DonationInfo>
        <DonationAmount $teamColor={team.teamColor} $isLoading={isLoading}>
          {isLoading ? (
            <LoadingContainer>
              <Spinner color={team.teamColor} size="2rem" />
            </LoadingContainer>
          ) : error ? (
            <span style={{ fontSize: '1rem', color: 'red' }}>Error loading donations</span>
          ) : (
            <>
              <span className="currency">$</span>
              <AnimatedValue
                key={`donation-${team.id}-${animationKeyRef.current}`}
                value={formatNumber(donationTotal)}
                teamColor={team.teamColor}
              />
            </>
          )}
        </DonationAmount>
        <DonationLabel>Raised</DonationLabel>
      </DonationInfo>
      <DonateButton 
        onClick={handleDonateClick}
        disabled={isProcessing}
        $teamColor={team.teamColor}
      >
        {isProcessing ? 'Processing...' : 'Donate Now'}
      </DonateButton>
    </Card>
  );
};

export default TeamCard; 
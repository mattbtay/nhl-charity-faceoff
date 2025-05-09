import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled, { keyframes } from 'styled-components';
import Layout from '../components/Layout';
import MatchupCard from '../components/MatchupCard';
import Toast from '../components/Toast';
import TestUpdater from '../components/TestUpdater';
import { matchups, teams } from '../config/teams';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
`;

const Alert = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${props => props.theme.colors.success};
  color: white;
  padding: 1rem 2rem;
  border-radius: ${props => props.theme.borderRadius.medium};
  box-shadow: ${props => props.theme.shadows.medium};
  z-index: 1000;
  animation: ${props => props.isClosing ? fadeOut : fadeIn} 0.5s ease-in-out;
`;

const Hero = styled.div`
  text-align: center;
  max-width: 1000px;
  margin: 0 auto 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
  line-height: 1.2;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 2rem;
  }
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.accent};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.borderRadius.medium};
  transition: all ${props => props.theme.transitions.default};

  &:hover {
    background: ${props => props.theme.colors.backgroundAlt};
  }

  svg {
    width: 20px;
    height: 20px;
    transform: rotate(${props => props.isOpen ? '180deg' : '0deg'});
    transition: transform ${props => props.theme.transitions.default};
  }
`;

const ConceptContent = styled.div`
  max-height: ${props => props.isOpen ? '500px' : '0'};
  opacity: ${props => props.isOpen ? '1' : '0'};
  overflow: hidden;
  transition: all ${props => props.theme.transitions.default};
  background: ${props => props.theme.colors.backgroundAlt};
  border-radius: ${props => props.theme.borderRadius.large};
  margin-top: ${props => props.isOpen ? '1rem' : '0'};
`;

const ConceptInner = styled.div`
  padding: 1.5rem;
  
  p {
    font-size: 1.2rem;
    color: ${props => props.theme.colors.text};
    line-height: 1.4;
    margin-bottom: 1rem;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    strong {
      color: ${props => props.theme.colors.accent};
    }
  }
`;

const MatchupsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

export default function Home() {
  const [isConceptOpen, setIsConceptOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isToastClosing, setIsToastClosing] = useState(false);
  const [donatedTeam, setDonatedTeam] = useState(null);
  const [showTestUpdater, setShowTestUpdater] = useState(false);
  const [processedDonations, setProcessedDonations] = useState(new Set());
  const router = useRouter();
  const activeMatchups = matchups.filter(matchup => matchup.active);

  // Enable test updater with Ctrl+Shift+T for debugging purposes
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        setShowTestUpdater(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (router.query.donation === 'success' && router.query.team) {
      // Check session ID to avoid duplicate toasts
      const sessionId = router.query.session_id || 'unknown';
      
      // If we've already processed this donation, don't show toast again
      if (processedDonations.has(sessionId)) {
        console.log('🔄 Already processed donation session:', sessionId);
        // Still remove query params if they somehow got added back
        router.replace('/', undefined, { shallow: true });
        return;
      }
      
      // Look up the team by ID
      const teamId = router.query.team;
      console.log('🔍 Looking for team with ID:', teamId);
      
      // Find the team with matching ID
      let foundTeam = null;
      Object.values(teams).forEach(team => {
        if (team.id === teamId) {
          foundTeam = team;
        }
      });
      
      if (foundTeam) {
        console.log('✅ Found team for donation success:', foundTeam.name, 'Session:', sessionId);
        
        // Mark this donation as processed
        setProcessedDonations(prev => new Set(prev).add(sessionId));
        
        // Show the toast
        setDonatedTeam(foundTeam);
        setShowToast(true);
        setIsToastClosing(false);
        
        // Remove the query parameters - important to prevent reappearing toast
        router.replace('/', undefined, { shallow: true }).then(() => {
          console.log('URL parameters removed successfully');
        }).catch(err => {
          console.error('Failed to remove URL parameters:', err);
        });
        
        // Fallback manual update in case the webhook doesn't trigger
        // This is important for environments where webhooks may not reach the server
        setTimeout(async () => {
          try {
            console.log('🔄 Triggering fallback donation update for session:', sessionId);
            const response = await fetch('/api/test-donation', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                teamId: teamId,
                amount: 25, // Default fallback amount
                sessionId: sessionId
              }),
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('✅ Fallback donation update successful:', result);
            } else {
              console.error('❌ Fallback donation update failed:', await response.text());
            }
          } catch (error) {
            console.error('❌ Error in fallback donation update:', error);
          }
        }, 5000); // Wait 5 seconds to see if webhook updates things first
      } else {
        console.error('❌ Could not find team with ID:', teamId);
        // Still clean up the URL
        router.replace('/', undefined, { shallow: true });
      }
    }
  }, [router.query, processedDonations]);

  const handleToastClose = () => {
    console.log('📣 Toast closing handler called');
    setIsToastClosing(true);
    setTimeout(() => {
      setShowToast(false);
      setIsToastClosing(false);
      setDonatedTeam(null);
    }, 500);
  };

  return (
    <Layout>
      {showToast && donatedTeam && (
        <Toast
          message={`Thank you for your donation to ${donatedTeam.charityName}! Watch the total update in real-time.`}
          color={donatedTeam.teamColor}
          isClosing={isToastClosing}
          duration={6000}
          onClose={handleToastClose}
        />
      )}
      {showTestUpdater && <TestUpdater />}
      <Hero>
        <Title>NHL Playoff Charity Challenge</Title>
        <ToggleButton 
          onClick={() => setIsConceptOpen(!isConceptOpen)}
          isOpen={isConceptOpen}
        >
          {isConceptOpen ? 'Hide' : 'Learn'} How It Works
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </ToggleButton>
        <ConceptContent isOpen={isConceptOpen}>
          <ConceptInner>
            <p>
              Here's the twist: Instead of donating to your team's charity, donate to your <strong>opponent's foundation</strong>. 
              Show that hockey rivalries can unite communities and drive positive change!
            </p>
            <p>
              Watch the totals update in real-time and see which fanbase can raise more for their rival's cause. 
              When we compete to give back, everybody wins!
            </p>
          </ConceptInner>
        </ConceptContent>
      </Hero>
      <MatchupsContainer>
        {activeMatchups.map(matchup => (
          <MatchupCard key={matchup.id} matchup={matchup} />
        ))}
      </MatchupsContainer>
    </Layout>
  );
} 
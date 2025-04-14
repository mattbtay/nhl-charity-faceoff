import { useState } from 'react';
import styled from 'styled-components';
import Layout from '../components/Layout';
import MatchupCard from '../components/MatchupCard';
import { matchups } from '../config/teams';

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
  const activeMatchups = matchups.filter(matchup => matchup.active);

  return (
    <Layout>
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
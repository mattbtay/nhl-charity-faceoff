import styled from 'styled-components';
import Layout from '../components/Layout';
import MatchupCard from '../components/MatchupCard';
import { matchups } from '../config/teams';

const Hero = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
`;

const MatchupsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

export default function Home() {
  const activeMatchups = matchups.filter(matchup => matchup.active);

  return (
    <Layout>
      <Hero>
        <Title>NHL Charity Faceoff</Title>
        <Subtitle>
          Support your team by donating to their charity foundation. Every donation makes a difference in our communities.
        </Subtitle>
      </Hero>
      <MatchupsContainer>
        {activeMatchups.map(matchup => (
          <MatchupCard key={matchup.id} matchup={matchup} />
        ))}
      </MatchupsContainer>
    </Layout>
  );
} 
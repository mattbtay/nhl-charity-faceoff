import styled from 'styled-components';
import TeamCard from './TeamCard';
import { teams } from '../config/teams';

const MatchupContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 3rem;
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.large};
  box-shadow: ${props => props.theme.shadows.large};
  margin: 2rem 0;
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(
      to right,
      ${props => props.theme.colors.primary},
      ${props => props.theme.colors.accent}
    );
  }

  @media (min-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: row;
    align-items: center;
    padding: 4rem;
  }
`;

const VersusContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  position: relative;
  z-index: 1;

  &:before {
    content: '';
    position: absolute;
    width: 120px;
    height: 120px;
    background-color: ${props => props.theme.colors.backgroundAlt};
    border-radius: 50%;
    z-index: -1;
    opacity: 0.5;
  }
`;

const VersusText = styled.div`
  font-family: ${props => props.theme.fonts.heading};
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 1rem 0;
`;

const DifferenceBadge = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textLight};
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  background-color: ${props => props.theme.colors.backgroundAlt};
`;

const RoundInfo = styled.div`
  text-align: center;
  font-family: ${props => props.theme.fonts.heading};
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textLight};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 2rem;
  
  &:after {
    content: '';
    display: block;
    width: 60px;
    height: 2px;
    background-color: ${props => props.theme.colors.accent};
    margin: 1rem auto 0;
  }
`;

const TeamsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  flex: 1;

  @media (min-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
  }
`;

const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(number);
};

const MatchupCard = ({ matchup }) => {
  const team1 = teams[matchup.team1];
  const team2 = teams[matchup.team2];

  const addUtmParams = (url, teamUtmParams) => {
    const urlObj = new URL(url);
    Object.entries(teamUtmParams).forEach(([key, value]) => {
      urlObj.searchParams.append(`utm_${key}`, value);
    });
    return urlObj.toString();
  };

  const difference = Math.abs(team1.donationTotal - team2.donationTotal);

  return (
    <div>
      <RoundInfo>{matchup.round}</RoundInfo>
      <MatchupContainer>
        <TeamsContainer>
          <TeamCard
            team={team1}
            donationUrl={addUtmParams(team1.charityUrl, team1.utmParams)}
          />
          <VersusContainer>
            <VersusText>VS</VersusText>
            {difference > 0 && (
              <DifferenceBadge>
                Difference: {formatNumber(difference)}
              </DifferenceBadge>
            )}
          </VersusContainer>
          <TeamCard
            team={team2}
            donationUrl={addUtmParams(team2.charityUrl, team2.utmParams)}
          />
        </TeamsContainer>
      </MatchupContainer>
    </div>
  );
};

export default MatchupCard; 
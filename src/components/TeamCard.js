import { useEffect, useState } from 'react';
import Image from 'next/image';
import styled from 'styled-components';
import { subscribeToDonationTotals } from '../config/firebase';
import Spinner from './Spinner';

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
  font-size: 3.5rem;
  font-weight: 700;
  color: ${props => props.teamColor || props.theme.colors.primary};
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  
  &:before {
    content: '$';
    font-size: 2rem;
    vertical-align: top;
    margin-right: 0.25rem;
    opacity: 0.8;
    display: ${props => props.isLoading ? 'none' : 'inline'};
  }
`;

const DonationLabel = styled.div`
  font-size: 1.25rem;
  font-weight: 500;
  color: ${props => props.theme.colors.textLight};
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const DonateButton = styled.a`
  display: inline-block;
  background-color: ${props => props.teamColor || props.theme.colors.accent};
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
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 1.5rem;
  min-height: 3.5rem;
`;

const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(number);
};

const TeamCard = ({ team, donationUrl }) => {
  const [donationTotal, setDonationTotal] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('TeamCard mounted for team:', team.id);
    
    try {
      // Subscribe to real-time updates
      const unsubscribe = subscribeToDonationTotals((teams) => {
        console.log('Received teams update in TeamCard:', teams);
        const teamData = teams[team.id];
        console.log('Found team data:', teamData);
        if (teamData && teamData.donationTotal !== undefined) {
          console.log('Updating donation total for', team.id, 'to', teamData.donationTotal);
          setDonationTotal(teamData.donationTotal);
          setError(null);
        }
        setIsLoading(false);
      });

      // Cleanup subscription on unmount
      return () => {
        console.log('TeamCard unmounting, cleaning up subscription');
        unsubscribe();
      };
    } catch (error) {
      console.error('Error in TeamCard effect:', error);
      setError(error);
      setIsLoading(false);
    }
  }, [team.id]);

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
        <DonationAmount teamColor={team.teamColor} isLoading={isLoading}>
          {isLoading ? (
            <LoadingContainer>
              <Spinner color={team.teamColor} />
              Loading...
            </LoadingContainer>
          ) : (
            formatNumber(donationTotal ?? team.donationTotal)
          )}
        </DonationAmount>
        <DonationLabel>Raised</DonationLabel>
      </DonationInfo>
      <DonateButton 
        href={donationUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        teamColor={team.teamColor}
      >
        Donate Now
      </DonateButton>
    </Card>
  );
};

export default TeamCard; 
export const teams = {
  dallasStars: {
    id: 'dallasStars',
    name: 'Dallas Stars',
    logo: '/assets/logos/stars.png',
    charityName: 'Dallas Stars Foundation',
    charityUrl: 'https://www.nhl.com/stars/community/dallas-stars-foundation',
    donationTotal: 25750,
    teamColor: '#006847', // Stars green
    utmParams: {
      source: 'charity_faceoff',
      medium: 'website',
      campaign: 'playoffs_2024'
    }
  },
  coloradoAvalanche: {
    id: 'coloradoAvalanche',
    name: 'Colorado Avalanche',
    logo: '/assets/logos/avalanch.png',
    charityName: 'Kroenke Sports Charities',
    charityUrl: 'https://www.nhl.com/avalanche/community/kroenke-sports-charities',
    donationTotal: 28500,
    teamColor: '#6F263D', // Avalanche burgundy
    utmParams: {
      source: 'charity_faceoff',
      medium: 'website',
      campaign: 'playoffs_2024'
    }
  }
};

export const matchups = [
  {
    id: 'stars-avalanche-2024',
    team1: 'dallasStars',
    team2: 'coloradoAvalanche',
    round: 'First Round',
    active: true
  }
]; 
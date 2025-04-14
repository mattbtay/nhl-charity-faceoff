import styled from 'styled-components';
import Layout from '../components/Layout';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 2rem;
  text-align: center;
`;

const Section = styled.section`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 1rem;
`;

const Text = styled.p`
  font-size: 1.1rem;
  color: #666;
  line-height: 1.6;
  margin-bottom: 1rem;
`;

export default function About() {
  return (
    <Layout>
      <Container>
        <Title>About NHL Charity Faceoff</Title>
        
        <Section>
          <SectionTitle>Our Mission</SectionTitle>
          <Text>
            NHL Charity Faceoff transforms the excitement of playoff hockey into meaningful community impact. 
            We connect passionate fans with team-affiliated charities, creating a unique way to support both 
            your favorite team and important causes.
          </Text>
        </Section>

        <Section>
          <SectionTitle>How It Works</SectionTitle>
          <Text>
            During playoff matchups, fans can donate to their team's official charity foundation. Each donation 
            is tracked through our platform, creating a friendly competition that extends beyond the ice. 
            Whether your team wins or loses, your contribution makes a real difference in the community.
          </Text>
        </Section>

        <Section>
          <SectionTitle>Impact</SectionTitle>
          <Text>
            Every donation supports vital community programs run by NHL team foundations. These programs 
            range from youth hockey initiatives to education and healthcare support. By participating in 
            NHL Charity Faceoff, you're helping create positive change in communities across North America.
          </Text>
        </Section>
      </Container>
    </Layout>
  );
} 
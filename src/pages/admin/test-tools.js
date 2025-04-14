import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import Layout from '../../components/Layout';
import { teams } from '../../config/teams';

const Container = styled.div`
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.large};
  box-shadow: ${props => props.theme.shadows.medium};
`;

const Title = styled.h1`
  font-size: 2rem;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 1.5rem;
`;

const Section = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: ${props => props.theme.colors.secondary};
  margin-bottom: 1rem;
`;

const Form = styled.form`
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.text};
`;

const Select = styled.select`
  padding: 0.75rem;
  border-radius: ${props => props.theme.borderRadius.small};
  border: 1px solid ${props => props.theme.colors.border};
  font-size: 1rem;
  width: 100%;
  max-width: 400px;
`;

const Input = styled.input`
  padding: 0.75rem;
  border-radius: ${props => props.theme.borderRadius.small};
  border: 1px solid ${props => props.theme.colors.border};
  font-size: 1rem;
  width: 100%;
  max-width: 400px;
`;

const Button = styled.button`
  background-color: ${props => props.theme.colors.accent};
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: ${props => props.theme.borderRadius.small};
  border: none;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    background-color: ${props => props.theme.colors.border};
    cursor: not-allowed;
  }
`;

const ResultContainer = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: ${props => props.success 
    ? props.theme.colors.successLight 
    : props.theme.colors.errorLight};
  border-radius: ${props => props.theme.borderRadius.small};
  border-left: 4px solid ${props => props.success 
    ? props.theme.colors.success 
    : props.theme.colors.error};
`;

const WebhookStatus = styled.div`
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  padding: 1rem;
  margin-top: 1rem;
  background-color: ${props => props.theme.colors.backgroundAlt};
  max-height: 400px;
  overflow-y: auto;
`;

const InfoRow = styled.div`
  display: flex;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid ${props => props.theme.colors.borderLight};
  padding-bottom: 0.5rem;
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

const InfoLabel = styled.div`
  font-weight: 600;
  width: 180px;
  flex-shrink: 0;
`;

const InfoValue = styled.div`
  flex-grow: 1;
  word-break: break-word;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: 0.875rem;
  font-weight: 600;
  background-color: ${props => props.success ? props.theme.colors.success : props.theme.colors.error};
  color: white;
`;

export default function TestTools() {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [amount, setAmount] = useState(25);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [webhookStatus, setWebhookStatus] = useState(null);
  const [checkingWebhook, setCheckingWebhook] = useState(false);
  const router = useRouter();

  // Get team options from config
  const teamOptions = Object.values(teams).map(team => ({
    id: team.id,
    name: team.name,
    charityName: team.charityName
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTeam || !amount) {
      alert('Please select a team and enter a donation amount');
      return;
    }
    
    setLoading(true);
    setTestResult(null);
    
    try {
      // Call the test-donation API
      const response = await fetch(`/api/test-donation?teamId=${selectedTeam}&amount=${amount}`);
      const data = await response.json();
      
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const checkWebhookStatus = async () => {
    setCheckingWebhook(true);
    setWebhookStatus(null);
    
    try {
      const response = await fetch('/api/check-webhook');
      const data = await response.json();
      
      setWebhookStatus(data);
    } catch (error) {
      setWebhookStatus({
        error: error.message
      });
    } finally {
      setCheckingWebhook(false);
    }
  };

  return (
    <Layout>
      <Container>
        <Title>Admin Testing Tools</Title>
        
        <Section>
          <SectionTitle>Test Donation</SectionTitle>
          <p>This will simulate a donation for a team without going through Stripe.</p>
          
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="team">Select Team</Label>
              <Select 
                id="team" 
                value={selectedTeam} 
                onChange={(e) => setSelectedTeam(e.target.value)}
                required
              >
                <option value="">-- Select a team --</option>
                {teamOptions.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.charityName})
                  </option>
                ))}
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="amount">Donation Amount (USD)</Label>
              <Input 
                id="amount" 
                type="number" 
                min="1" 
                max="1000" 
                value={amount} 
                onChange={(e) => setAmount(parseInt(e.target.value, 10))}
                required
              />
            </FormGroup>
            
            <Button type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Test Donation'}
            </Button>
          </Form>
          
          {testResult && (
            <ResultContainer success={testResult.success}>
              <h3>{testResult.success ? 'Donation Successful!' : 'Donation Failed'}</h3>
              {testResult.success ? (
                <>
                  <p>Added ${testResult.donation.amount} to {testResult.team.name}</p>
                  <p>Previous total: ${testResult.donation.previousTotal}</p>
                  <p>New total: ${testResult.donation.newTotal}</p>
                </>
              ) : (
                <p>{testResult.message}</p>
              )}
            </ResultContainer>
          )}
        </Section>
        
        <Section>
          <SectionTitle>Check Webhook Status</SectionTitle>
          <p>This will check if Stripe webhooks are properly configured and receiving events.</p>
          
          <Button onClick={checkWebhookStatus} disabled={checkingWebhook}>
            {checkingWebhook ? 'Checking...' : 'Check Webhook Status'}
          </Button>
          
          {webhookStatus && (
            <WebhookStatus>
              <h3>Stripe Configuration</h3>
              <InfoRow>
                <InfoLabel>Secret Key</InfoLabel>
                <InfoValue>
                  <StatusBadge success={webhookStatus.stripeConfiguration.secretKey.valid}>
                    {webhookStatus.stripeConfiguration.secretKey.valid ? 'Valid' : 'Invalid'}
                  </StatusBadge>
                </InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Webhook Secret</InfoLabel>
                <InfoValue>
                  <StatusBadge success={webhookStatus.stripeConfiguration.webhookSecret.valid}>
                    {webhookStatus.stripeConfiguration.webhookSecret.valid ? 'Valid' : 'Invalid'}
                  </StatusBadge>
                </InfoValue>
              </InfoRow>
              
              <h3>Webhook Events</h3>
              <InfoRow>
                <InfoLabel>Events Received</InfoLabel>
                <InfoValue>{webhookStatus.webhookEvents.count}</InfoValue>
              </InfoRow>
              
              {webhookStatus.webhookEvents.recentEvents.length > 0 && (
                <>
                  <InfoRow>
                    <InfoLabel>Latest Event</InfoLabel>
                    <InfoValue>
                      {webhookStatus.webhookEvents.latest.eventType} at{' '}
                      {new Date(webhookStatus.webhookEvents.latest.received).toLocaleString()}
                    </InfoValue>
                  </InfoRow>
                </>
              )}
              
              <h3>Processed Sessions</h3>
              <InfoRow>
                <InfoLabel>Sessions Processed</InfoLabel>
                <InfoValue>{webhookStatus.processedSessions.count}</InfoValue>
              </InfoRow>
              
              {webhookStatus.processedSessions.recentSessions.length > 0 && (
                <>
                  <InfoRow>
                    <InfoLabel>Latest Session</InfoLabel>
                    <InfoValue>
                      Team: {webhookStatus.processedSessions.latest.teamId}, 
                      Amount: ${webhookStatus.processedSessions.latest.amount} at{' '}
                      {new Date(webhookStatus.processedSessions.latest.processedAt).toLocaleString()}
                    </InfoValue>
                  </InfoRow>
                </>
              )}
              
              <h3>Overall Status</h3>
              <InfoRow>
                <InfoLabel>Stripe Configured</InfoLabel>
                <InfoValue>
                  <StatusBadge success={webhookStatus.status.stripeConfigured}>
                    {webhookStatus.status.stripeConfigured ? 'Yes' : 'No'}
                  </StatusBadge>
                </InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Webhooks Received</InfoLabel>
                <InfoValue>
                  <StatusBadge success={webhookStatus.status.webhooksReceived}>
                    {webhookStatus.status.webhooksReceived ? 'Yes' : 'No'}
                  </StatusBadge>
                </InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Sessions Processed</InfoLabel>
                <InfoValue>
                  <StatusBadge success={webhookStatus.status.sessionsProcessed}>
                    {webhookStatus.status.sessionsProcessed ? 'Yes' : 'No'}
                  </StatusBadge>
                </InfoValue>
              </InfoRow>
            </WebhookStatus>
          )}
        </Section>
      </Container>
    </Layout>
  );
} 
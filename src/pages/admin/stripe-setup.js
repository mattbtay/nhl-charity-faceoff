import { useState, useEffect } from 'react';
import styled from 'styled-components';
import Layout from '../../components/Layout';

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

const StepContainer = styled.div`
  margin-bottom: 1.5rem;
  background: ${props => props.theme.colors.backgroundAlt};
  padding: 1.5rem;
  border-radius: ${props => props.theme.borderRadius.medium};
`;

const StepTitle = styled.h3`
  font-size: 1.2rem;
  color: ${props => props.theme.colors.text};
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  
  span {
    background: ${props => props.theme.colors.accent};
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
    font-size: 0.9rem;
  }
`;

const CodeBlock = styled.pre`
  background: #1e1e1e;
  color: #f8f8f8;
  padding: 1rem;
  border-radius: ${props => props.theme.borderRadius.small};
  overflow-x: auto;
  font-family: monospace;
  font-size: 0.9rem;
  margin: 1rem 0;
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

const InfoBox = styled.div`
  padding: 1rem;
  background-color: ${props => props.isError 
    ? props.theme.colors.errorLight 
    : props.isSuccess 
      ? props.theme.colors.successLight
      : props.theme.colors.infoLight};
  border-left: 4px solid ${props => props.isError 
    ? props.theme.colors.error 
    : props.isSuccess
      ? props.theme.colors.success
      : props.theme.colors.info};
  border-radius: ${props => props.theme.borderRadius.small};
  margin: 1rem 0;
`;

const Link = styled.a`
  color: ${props => props.theme.colors.accent};
  text-decoration: none;
  font-weight: 600;
  
  &:hover {
    text-decoration: underline;
  }
`;

export default function StripeSetup() {
  const [baseUrl, setBaseUrl] = useState('');
  const [webhookEndpoint, setWebhookEndpoint] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  
  useEffect(() => {
    // Get the base URL
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const baseUrl = `${url.protocol}//${url.host}`;
      setBaseUrl(baseUrl);
      setWebhookEndpoint(`${baseUrl}/api/webhook-debug`);
    }
  }, []);
  
  const testWebhook = async () => {
    setIsTestingWebhook(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/check-webhook');
      const data = await response.json();
      
      setTestResult({
        success: true,
        data
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };
  
  return (
    <Layout>
      <Container>
        <Title>Stripe Webhook Setup Guide</Title>
        
        <Section>
          <SectionTitle>Why Webhooks Are Important</SectionTitle>
          <p>
            Stripe webhooks are crucial for ensuring donation totals update correctly after payments.
            This page will help you set up and verify your Stripe webhook configuration.
          </p>
          
          <InfoBox>
            If donation totals aren't updating after successful payments, it's likely due to
            Stripe webhooks not reaching your application or not being processed correctly.
          </InfoBox>
        </Section>
        
        <Section>
          <SectionTitle>Setting Up Stripe Webhooks</SectionTitle>
          
          <StepContainer>
            <StepTitle><span>1</span>Log into your Stripe Dashboard</StepTitle>
            <p>
              Go to <Link href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                https://dashboard.stripe.com
              </Link> and log in to your account.
            </p>
          </StepContainer>
          
          <StepContainer>
            <StepTitle><span>2</span>Navigate to Webhooks</StepTitle>
            <p>
              In the sidebar, go to <strong>Developers</strong> → <strong>Webhooks</strong>.
            </p>
          </StepContainer>
          
          <StepContainer>
            <StepTitle><span>3</span>Add Endpoint</StepTitle>
            <p>
              Click <strong>Add endpoint</strong> and use the following URL:
            </p>
            <CodeBlock>{webhookEndpoint}</CodeBlock>
            <p>
              This is a special debugging endpoint that will help diagnose webhook issues.
              Once everything is working, you can switch to the regular webhook endpoint:
            </p>
            <CodeBlock>{baseUrl}/api/webhook</CodeBlock>
          </StepContainer>
          
          <StepContainer>
            <StepTitle><span>4</span>Select Events</StepTitle>
            <p>
              Under "Listen to select events", choose <strong>checkout.session.completed</strong>.
              This is the only event you need for the donation flow.
            </p>
          </StepContainer>
          
          <StepContainer>
            <StepTitle><span>5</span>Get Webhook Secret</StepTitle>
            <p>
              After creating the endpoint, you'll be shown a webhook signing secret that starts with <code>whsec_</code>.
              Copy this value and add it to your environment variables as <code>STRIPE_WEBHOOK_SECRET</code>.
            </p>
          </StepContainer>
        </Section>
        
        <Section>
          <SectionTitle>Environment Variables</SectionTitle>
          <p>
            Make sure you have the following environment variables set in your Vercel project:
          </p>
          <CodeBlock>
{`STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)`}
          </CodeBlock>
          <p>
            These must be set in your Vercel dashboard under Project Settings → Environment Variables.
          </p>
        </Section>
        
        <Section>
          <SectionTitle>Testing Your Webhook</SectionTitle>
          <p>
            After setting up the webhook and environment variables, you can test if everything is working:
          </p>
          
          <Button onClick={testWebhook} disabled={isTestingWebhook}>
            {isTestingWebhook ? 'Testing...' : 'Check Webhook Status'}
          </Button>
          
          {testResult && (
            <InfoBox isSuccess={testResult.success} isError={!testResult.success}>
              <h3>{testResult.success ? 'Status Check Complete' : 'Error Checking Status'}</h3>
              {testResult.success ? (
                <div>
                  <p><strong>Stripe API Key:</strong> {testResult.data.stripeConfiguration.secretKey.valid ? '✅ Valid' : '❌ Invalid'}</p>
                  <p><strong>Webhook Secret:</strong> {testResult.data.stripeConfiguration.webhookSecret.valid ? '✅ Valid' : '❌ Invalid'}</p>
                  <p><strong>Webhook Events Received:</strong> {testResult.data.status.webhooksReceived ? '✅ Yes' : '❌ No'}</p>
                  <p><strong>Sessions Processed:</strong> {testResult.data.status.sessionsProcessed ? '✅ Yes' : '❌ No'}</p>
                  
                  {!testResult.data.status.webhooksReceived && (
                    <div>
                      <p>No webhook events have been received yet. Try these steps:</p>
                      <ol>
                        <li>Verify the webhook URL in your Stripe dashboard</li>
                        <li>Test the webhook using Stripe's "Send test webhook" feature</li>
                        <li>Make a test donation and check again</li>
                      </ol>
                    </div>
                  )}
                </div>
              ) : (
                <p>{testResult.error}</p>
              )}
            </InfoBox>
          )}
          
          <InfoBox>
            <p><strong>Tip:</strong> In the Stripe dashboard, you can use the "Send test webhook" feature to test your webhook endpoint. 
            Select the "checkout.session.completed" event and click "Send test webhook".</p>
          </InfoBox>
        </Section>
        
        <Section>
          <SectionTitle>Troubleshooting</SectionTitle>
          
          <StepContainer>
            <StepTitle>Check Logs</StepTitle>
            <p>
              If webhooks aren't working, check your Vercel logs for errors. Look for 
              any errors in the webhook handling process.
            </p>
          </StepContainer>
          
          <StepContainer>
            <StepTitle>Use Test Donations</StepTitle>
            <p>
              While troubleshooting, you can use the <Link href="/admin/test-tools">Test Tools</Link> page 
              to manually update donation totals without going through Stripe.
            </p>
          </StepContainer>
          
          <StepContainer>
            <StepTitle>Verify Webhook Events</StepTitle>
            <p>
              In your Stripe Dashboard, go to Developers → Webhooks → [Your Endpoint] → 
              "Recent Events" to see if events are being sent and whether they're succeeding.
            </p>
          </StepContainer>
        </Section>
      </Container>
    </Layout>
  );
} 
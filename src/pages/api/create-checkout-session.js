import Stripe from 'stripe';

// Check if Stripe API key is available
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey || stripeKey.includes('${STRIPE')) {
  console.error('Missing or invalid STRIPE_SECRET_KEY environment variable');
}

// Initialize Stripe with safer API key handling
const stripe = stripeKey && !stripeKey.includes('${STRIPE') 
  ? new Stripe(stripeKey) 
  : null;

// Always generate absolute URLs to the production domain
// This ensures we never get auth prompts from Vercel
const getAbsoluteUrl = (path) => {
  // Force production URL for consistency
  const baseUrl = 'https://nhl-charity-faceoff.vercel.app';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export default async function handler(req, res) {
  // Log request method for debugging
  console.log(`Checkout API called with method: ${req.method}`);
  
  // Only allow POST method
  if (req.method !== 'POST') {
    console.error(`Method ${req.method} not allowed for checkout API`);
    return res.status(405).json({ 
      message: 'Method not allowed',
      allowedMethod: 'POST',
      receivedMethod: req.method
    });
  }

  // Check if Stripe is initialized
  if (!stripe) {
    console.error('Stripe is not properly initialized. Check your environment variables.');
    return res.status(500).json({ 
      message: 'Stripe configuration error', 
      error: 'The server is not properly configured to process payments'
    });
  }

  try {
    const { amount, teamId, charityName } = req.body;
    
    // Validate required parameters
    if (!amount || !teamId || !charityName) {
      console.error('Missing required parameters', { amount, teamId, charityName });
      return res.status(400).json({ 
        message: 'Missing required parameters',
        required: ['amount', 'teamId', 'charityName'],
        received: { amount, teamId, charityName }
      });
    }
    
    // Ensure amount is a number and properly formatted
    const numericAmount = typeof amount === 'string' ? parseInt(amount, 10) : amount;
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      console.error('Invalid amount', { amount, numericAmount });
      return res.status(400).json({
        message: 'Invalid amount',
        received: { amount, parsed: numericAmount }
      });
    }
    
    // Log the exact amount being processed
    console.log('Creating checkout session for:', { 
      teamId, 
      rawAmount: amount,
      numericAmount,
      amountInCents: numericAmount * 100,
      amountType: typeof amount,
      charityName 
    });

    // Ensure we have a proper URL with protocol
    let origin = req.headers.origin;
    
    // If origin is missing or contains "vercel", use the production URL
    if (!origin || origin.includes("vercel.app")) {
      // Always default to production URL for checkout redirects
      origin = 'https://nhl-charity-faceoff.vercel.app';
    }
    
    console.log('Using origin for URLs:', origin);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      submit_type: 'donate',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Donation to ${charityName}`,
              description: 'NHL Playoff Charity Challenge',
              images: ['https://nhl-charity-faceoff.vercel.app/logo.png'],
            },
            unit_amount_decimal: numericAmount * 100, // Convert to cents using numericAmount
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: getAbsoluteUrl(`/donation-success?session_id={CHECKOUT_SESSION_ID}&team=${teamId}`),
      cancel_url: getAbsoluteUrl('/'),
      metadata: {
        teamId,
        charityName,
        selectedAmount: numericAmount.toString(),
      },
      billing_address_collection: 'auto',
      custom_text: {
        submit: {
          message: 'Your donation helps the charity of your rival team!',
        },
      },
      payment_intent_data: {
        description: `Donation to ${charityName} - NHL Charity Faceoff`,
        metadata: {
          teamId,
          charityName,
        },
      },
    });

    console.log('Checkout session created:', session.id);
    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    // Include detailed error information
    res.status(500).json({ 
      message: 'Error creating checkout session',
      error: error.message,
      type: error.type || 'unknown',
      code: error.statusCode || 500
    });
  }
} 
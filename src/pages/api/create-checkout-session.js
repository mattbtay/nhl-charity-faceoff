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
    // Validate and process the request body
    const { teamId, charityName, selectedAmount } = req.body;
    
    if (!teamId || !charityName || !selectedAmount) {
      return res.status(400).json({ 
        error: {
          message: 'Missing required fields: teamId, charityName, and selectedAmount are required'
        }
      });
    }
    
    // Check if Stripe API key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY environment variable is not set');
      return res.status(500).json({
        error: {
          message: 'Stripe configuration error. Please contact support.'
        }
      });
    }
    
    // Create checkout session with Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Donation to ${charityName}`,
              description: 'NHL Charity Faceoff donation',
            },
            unit_amount: parseInt(selectedAmount) * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/?donation=success&team=${teamId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/`,
      metadata: {
        teamId,
        charityName,
        selectedAmount,
      },
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const errorMessage = error.message || 'An unknown error occurred';
    const statusCode = error.statusCode || 500;
    
    res.status(statusCode).json({
      error: {
        message: errorMessage
      }
    });
  }
} 
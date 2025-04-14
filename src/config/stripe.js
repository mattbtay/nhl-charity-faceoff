import { loadStripe } from '@stripe/stripe-js';

// Make sure to add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your .env.local file
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Enhanced logging for Stripe initialization
console.log('=== STRIPE INITIALIZATION ===');
console.log('Stripe config status:', { 
  hasPublishableKey: !!publishableKey,
  keyStartsWith: publishableKey ? publishableKey.substring(0, 7) : 'none',
  environment: typeof window !== 'undefined' ? 
    window.location.hostname.includes('localhost') ? 'development' : 'production' 
    : 'server'
});

// Check for publishable key
if (!publishableKey) {
  console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
}

// Create a safer stripePromise that handles undefined scenarios
let stripePromise;

try {
  console.log('Attempting to initialize Stripe...');
  // Only initialize Stripe if we have a publishable key
  if (publishableKey) {
    console.log('Loading Stripe with publishable key');
    stripePromise = loadStripe(publishableKey)
      .then(stripeInstance => {
        console.log('Stripe loaded successfully:', !!stripeInstance);
        return stripeInstance;
      })
      .catch(error => {
        console.error('Stripe initialization failed with error:', error);
        return null;
      });
  } else {
    console.log('No publishable key available, creating dummy promise');
    stripePromise = Promise.resolve(null);
  }
} catch (error) {
  console.error('Critical error in Stripe initialization:', error);
  // Provide a fallback promise that resolves to null
  stripePromise = Promise.resolve(null);
}

export default stripePromise; 
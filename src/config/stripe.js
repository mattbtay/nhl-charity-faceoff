import { loadStripe } from '@stripe/stripe-js';

// Make sure to add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your .env.local file
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Check for publishable key
if (!publishableKey) {
  console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
}

// Create a safer stripePromise that handles undefined scenarios
let stripePromise;

try {
  // Only initialize Stripe if we have a publishable key
  stripePromise = publishableKey ? 
    loadStripe(publishableKey) : 
    Promise.resolve(null);
} catch (error) {
  console.error('Error initializing Stripe:', error);
  // Provide a fallback promise that resolves to null
  stripePromise = Promise.resolve(null);
}

export default stripePromise; 
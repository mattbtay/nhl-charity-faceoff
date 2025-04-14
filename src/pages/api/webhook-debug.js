import Stripe from 'stripe';
import { buffer } from 'micro';
import admin from 'firebase-admin';

// Initialize Firebase Admin if it hasn't been initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

const db = admin.firestore();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Log request details
  console.log('===== WEBHOOK DEBUG ENDPOINT =====');
  console.log('Request method:', req.method);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    // Get raw body
    const rawBody = await buffer(req);
    console.log('Request body length:', rawBody.length);
    
    // Store webhook request in Firestore for debugging
    const requestData = {
      method: req.method,
      headers: req.headers,
      bodyLength: rawBody.length,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      url: req.url,
      query: req.query
    };
    
    // Save complete details to Firestore
    try {
      const docRef = await db.collection('webhookDebugLogs').add(requestData);
      console.log('Debug log saved with ID:', docRef.id);
      
      // Try to parse it if it's JSON
      try {
        if (req.headers['content-type']?.includes('application/json')) {
          const jsonBody = JSON.parse(rawBody.toString());
          console.log('JSON body detected, event type:', jsonBody.type);
          
          // Update the Firestore document with parsed data
          await docRef.update({
            parsedBody: {
              type: jsonBody.type,
              eventId: jsonBody.id,
              hasObject: !!jsonBody.data?.object,
              objectType: jsonBody.data?.object?.object
            }
          });
        }
      } catch (parseError) {
        console.log('Error parsing body as JSON:', parseError.message);
        await docRef.update({
          parseError: parseError.message
        });
      }
      
      // Check if it's a Stripe event
      if (req.headers['stripe-signature']) {
        console.log('Stripe signature detected');
        
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (webhookSecret) {
          try {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
            const event = stripe.webhooks.constructEvent(
              rawBody,
              req.headers['stripe-signature'],
              webhookSecret
            );
            
            console.log('✅ Successfully verified Stripe signature for event:', event.id);
            console.log('Event type:', event.type);
            
            await docRef.update({
              stripeEvent: {
                verified: true,
                eventId: event.id,
                eventType: event.type,
                objectType: event.data?.object?.object || null
              }
            });
            
            // If it's a checkout session completed event, log extra details
            if (event.type === 'checkout.session.completed') {
              const session = event.data.object;
              console.log('💰 Checkout session completed:', session.id);
              console.log('Amount:', session.amount_total / 100);
              console.log('Metadata:', session.metadata);
              
              await docRef.update({
                checkoutSession: {
                  id: session.id,
                  amount: session.amount_total / 100,
                  teamId: session.metadata?.teamId,
                  metadata: session.metadata
                }
              });
            }
          } catch (verifyError) {
            console.error('❌ Stripe signature verification failed:', verifyError.message);
            await docRef.update({
              stripeEvent: {
                verified: false,
                error: verifyError.message
              }
            });
          }
        } else {
          console.error('❌ Webhook secret not configured');
          await docRef.update({
            stripeEvent: {
              verified: false,
              error: 'Webhook secret not configured'
            }
          });
        }
      }
    } catch (firestoreError) {
      console.error('Error saving debug log:', firestoreError);
    }
    
    // Call the actual webhook handler in a non-blocking way so we can return quickly
    try {
      // Make a request to the actual webhook endpoint
      const webhookUrl = `${req.headers.host}/api/webhook`;
      console.log(`Forwarding to actual webhook handler: ${webhookUrl}`);
      
      // We don't await this - we want to respond quickly to Stripe
      fetch(`https://${webhookUrl}`, {
        method: req.method,
        headers: req.headers,
        body: rawBody
      }).then(response => {
        console.log('Webhook handler response status:', response.status);
        return response.text();
      }).then(text => {
        console.log('Webhook handler response:', text);
      }).catch(error => {
        console.error('Error forwarding to webhook handler:', error);
      });
    } catch (forwardError) {
      console.error('Error forwarding to webhook handler:', forwardError);
    }
    
    // Return a 200 success even if there were issues
    // This is important so Stripe doesn't retry unnecessarily
    return res.status(200).json({
      received: true,
      debug: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Critical error in webhook debug endpoint:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
} 
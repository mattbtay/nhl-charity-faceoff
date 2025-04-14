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

/**
 * Process a checkout session and update donation totals
 * @param {Object} session - The checkout session object from Stripe
 */
const handleCheckoutSession = async (session) => {
  console.log(`Processing checkout session ${session.id}`);
  
  try {
    // Check if we've already processed this session
    const processedDoc = await db.collection('processedSessions').doc(session.id).get();
    if (processedDoc.exists) {
      console.log(`Session ${session.id} already processed, skipping`);
      return {
        success: true,
        alreadyProcessed: true,
        sessionId: session.id
      };
    }
    
    // Get teamId from metadata
    const teamId = session.metadata?.teamId;
    if (!teamId) {
      console.error('Missing teamId in session metadata:', session.metadata);
      return {
        success: false,
        reason: 'missing_team_id',
        sessionId: session.id
      };
    }
    
    // Get amount from session
    const amount = session.amount_total / 100; // Convert from cents to dollars
    if (!amount || amount <= 0) {
      console.error(`Invalid amount in session: ${amount}`);
      return {
        success: false,
        reason: 'invalid_amount',
        sessionId: session.id
      };
    }
    
    // Update team donation total
    const teamRef = db.collection('teams').doc(teamId);
    const teamDoc = await teamRef.get();
    
    if (!teamDoc.exists) {
      console.error(`Team with ID ${teamId} not found`);
      return {
        success: false,
        reason: 'team_not_found',
        teamId: teamId,
        sessionId: session.id
      };
    }
    
    // Update the donation total and record the payment
    await db.runTransaction(async (transaction) => {
      // Get the current team data
      const teamSnapshot = await transaction.get(teamRef);
      const teamData = teamSnapshot.data();
      const currentTotal = teamData.donationTotal || 0;
      
      // Update the team total
      transaction.update(teamRef, {
        donationTotal: currentTotal + amount,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Add a donation record
      const donationRef = db.collection('donations').doc();
      transaction.set(donationRef, {
        teamId: teamId,
        amount: amount,
        sessionId: session.id,
        customerEmail: session.customer_details?.email || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Mark session as processed
      transaction.set(db.collection('processedSessions').doc(session.id), {
        teamId: teamId,
        amount: amount,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: session.metadata || {}
      });
    });
    
    console.log(`Successfully updated donation total for team ${teamId} with amount ${amount}`);
    return {
      success: true,
      teamId: teamId,
      amount: amount,
      sessionId: session.id
    };
  } catch (error) {
    console.error(`Error processing checkout session:`, error);
    return {
      success: false,
      reason: 'processing_error',
      error: error.message,
      sessionId: session.id
    };
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const stripeApiKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!stripeApiKey || !webhookSecret) {
    console.error('Missing Stripe configuration:', {
      hasApiKey: !!stripeApiKey,
      hasWebhookSecret: !!webhookSecret
    });
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  try {
    const stripe = new Stripe(stripeApiKey);
    const rawBody = await buffer(req);
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      console.error('No Stripe signature in request headers');
      return res.status(400).json({ error: 'No Stripe signature' });
    }
    
    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err.message);
      return res.status(400).json({ error: `Webhook signature verification failed` });
    }
    
    // Log the event
    console.log(`Received verified Stripe event: ${event.type}`);
    
    // Record webhook receipt
    try {
      await db.collection('webhookEvents').add({
        eventId: event.id,
        eventType: event.type,
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        livemode: event.livemode
      });
    } catch (logError) {
      console.error('Failed to log webhook event:', logError);
      // Continue processing even if logging fails
    }
    
    // Process checkout session completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Process the checkout session
      const result = await handleCheckoutSession(session);
      
      if (!result.success && !result.alreadyProcessed) {
        console.error(`Error processing checkout session:`, result);
      }
      
      // Always return 200 to acknowledge receipt
      return res.status(200).json({
        received: true,
        processed: result.success,
        details: result
      });
    }
    
    // For other event types, just acknowledge receipt
    return res.status(200).json({
      received: true,
      eventType: event.type
    });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 
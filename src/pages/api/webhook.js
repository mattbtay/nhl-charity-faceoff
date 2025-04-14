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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const handleCheckoutSession = async (session) => {
  console.log(`Starting to process checkout session ${session.id}`);
  
  try {
    // Check if session has already been processed
    const processedSessionsRef = db.collection('processedSessions');
    const existingSessionDoc = await processedSessionsRef.doc(session.id).get();
    
    if (existingSessionDoc.exists) {
      console.log(`Session ${session.id} has already been processed`);
      return { 
        success: true,
        alreadyProcessed: true,
        sessionId: session.id
      };
    }
    
    // Validate session metadata
    if (!session.metadata || !session.metadata.teamId) {
      console.error('Missing teamId in session metadata:', session.metadata);
      return {
        success: false,
        reason: 'missing_team_id',
        sessionId: session.id
      };
    }
    
    const teamId = session.metadata.teamId;
    
    // Get team data
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
    
    const teamData = teamDoc.data();
    
    // Calculate the donation amount (convert from cents to dollars)
    const amount = session.amount_total / 100;
    
    if (!amount || amount <= 0) {
      console.error(`Invalid donation amount: ${amount}`);
      return {
        success: false,
        reason: 'invalid_amount',
        amount: amount,
        teamId: teamId,
        teamName: teamData.name,
        sessionId: session.id
      };
    }
    
    // Update team's donation total
    try {
      await teamRef.update({
        donationTotal: admin.firestore.FieldValue.increment(amount),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Updated team ${teamId} donation total with amount ${amount}`);
    } catch (error) {
      console.error(`Error updating team ${teamId} donation total:`, error);
      return {
        success: false,
        reason: 'team_update_failed',
        error: error.message,
        teamId: teamId,
        teamName: teamData.name,
        amount: amount,
        sessionId: session.id
      };
    }
    
    // Add donation record
    try {
      await db.collection('donations').add({
        teamId: teamId,
        amount: amount,
        sessionId: session.id,
        customerId: session.customer || null,
        customerEmail: session.customer_details?.email || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Added donation record for team ${teamId}`);
    } catch (error) {
      // Log but don't fail the process if donation record creation fails
      console.error('Error adding donation record:', error);
      // We continue processing since the team total was already updated
    }
    
    // Mark session as processed
    try {
      await processedSessionsRef.doc(session.id).set({
        teamId: teamId,
        amount: amount,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: session.metadata || {},
        customer: session.customer || null
      });
      console.log(`Marked session ${session.id} as processed`);
    } catch (error) {
      console.error('Error marking session as processed:', error);
      // Continue processing since the critical operations were completed
    }
    
    return {
      success: true,
      teamId: teamId,
      teamName: teamData.name,
      amount: amount,
      sessionId: session.id,
      customerEmail: session.customer_details?.email || null
    };
  } catch (error) {
    console.error(`Error processing checkout session ${session.id}:`, error);
    return {
      success: false,
      reason: 'processing_error',
      error: error.message,
      sessionId: session.id
    };
  }
};

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not defined');
    return res.status(500).json({ error: 'Webhook secret is not configured' });
  }

  try {
    // Get the signature sent by Stripe
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      console.error('No Stripe signature found in request headers');
      return res.status(400).json({ error: 'No Stripe signature found' });
    }

    let event;
    try {
      const rawBody = await buffer(req);
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle the event
    console.log(`Received Stripe event: ${event.type}`);

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Record webhook receipt in Firestore for audit purposes
      try {
        await db.collection('webhookEvents').add({
          eventId: event.id,
          eventType: event.type,
          sessionId: session.id,
          received: admin.firestore.FieldValue.serverTimestamp(),
          metadata: session.metadata || {}
        });
      } catch (logError) {
        console.error('Failed to log webhook event:', logError);
        // Continue processing even if logging fails
      }

      // Process the checkout session
      console.log(`Processing checkout session ${session.id}`);
      const result = await handleCheckoutSession(session);
      
      if (result.error) {
        console.error(`Error processing checkout session: ${result.error}`);
        // We still return 200 to acknowledge receipt to Stripe
        return res.status(200).json({ 
          received: true, 
          processed: false, 
          error: result.error 
        });
      }
      
      if (result.alreadyProcessed) {
        console.log(`Session ${session.id} already processed, skipping`);
        return res.status(200).json({ 
          received: true, 
          processed: false, 
          alreadyProcessed: true 
        });
      }
      
      console.log(`Successfully processed session ${session.id} for team ${result.teamName}`);
      return res.status(200).json({ 
        received: true, 
        processed: true,
        teamName: result.teamName,
        teamId: result.teamId,
        donationAmount: result.amount,
        sessionId: result.sessionId
      });
    } else {
      // For other event types, just acknowledge receipt
      console.log(`Unhandled event type: ${event.type}`);
      return res.status(200).json({ received: true, processed: false, eventType: event.type });
    }
  } catch (err) {
    console.error(`Webhook handler error: ${err.message}`);
    return res.status(500).json({ error: `Webhook handler error: ${err.message}` });
  }
};

export default handler; 
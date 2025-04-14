import Stripe from 'stripe';
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

export default async function handler(req, res) {
  // Check Stripe configuration
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  // Initialize results object
  const results = {
    stripeConfiguration: {
      secretKey: {
        exists: !!stripeSecretKey,
        valid: stripeSecretKey && stripeSecretKey.startsWith('sk_'),
        firstChars: stripeSecretKey ? stripeSecretKey.substring(0, 7) : 'missing',
        length: stripeSecretKey ? stripeSecretKey.length : 0
      },
      webhookSecret: {
        exists: !!stripeWebhookSecret,
        valid: stripeWebhookSecret && stripeWebhookSecret.startsWith('whsec_'),
        firstChars: stripeWebhookSecret ? stripeWebhookSecret.substring(0, 7) : 'missing',
        length: stripeWebhookSecret ? stripeWebhookSecret.length : 0
      }
    },
    webhookEvents: {
      count: 0,
      latest: null,
      recentEvents: []
    },
    processedSessions: {
      count: 0,
      latest: null,
      recentSessions: []
    }
  };
  
  try {
    // Check if Stripe is properly configured
    if (stripeSecretKey && stripeSecretKey.startsWith('sk_')) {
      const stripe = new Stripe(stripeSecretKey);
      
      try {
        // Try to make a simple API call to validate the key
        const events = await stripe.events.list({ limit: 1 });
        results.stripeConfiguration.apiAccessible = true;
        results.stripeConfiguration.message = 'Stripe API is accessible';
      } catch (stripeError) {
        results.stripeConfiguration.apiAccessible = false;
        results.stripeConfiguration.message = `Stripe API error: ${stripeError.message}`;
      }
    } else {
      results.stripeConfiguration.apiAccessible = false;
      results.stripeConfiguration.message = 'Invalid Stripe secret key';
    }
    
    // Check for recent webhook events in Firestore
    try {
      const webhookEvents = await db.collection('webhookEvents')
        .orderBy('received', 'desc')
        .limit(5)
        .get();
      
      results.webhookEvents.count = webhookEvents.size;
      
      let events = [];
      webhookEvents.forEach(doc => {
        const data = doc.data();
        events.push({
          id: doc.id,
          eventId: data.eventId,
          eventType: data.eventType,
          sessionId: data.sessionId,
          received: data.received ? data.received.toDate?.() : null,
          metadata: data.metadata
        });
      });
      
      results.webhookEvents.recentEvents = events;
      if (events.length > 0) {
        results.webhookEvents.latest = events[0];
      }
    } catch (firestoreError) {
      results.webhookEvents.error = `Firestore error: ${firestoreError.message}`;
    }
    
    // Check for processed sessions in Firestore
    try {
      const processedSessions = await db.collection('processedSessions')
        .orderBy('processedAt', 'desc')
        .limit(5)
        .get();
      
      results.processedSessions.count = processedSessions.size;
      
      let sessions = [];
      processedSessions.forEach(doc => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          teamId: data.teamId,
          amount: data.amount,
          processedAt: data.processedAt ? data.processedAt.toDate?.() : null,
          metadata: data.metadata
        });
      });
      
      results.processedSessions.recentSessions = sessions;
      if (sessions.length > 0) {
        results.processedSessions.latest = sessions[0];
      }
    } catch (firestoreError) {
      results.processedSessions.error = `Firestore error: ${firestoreError.message}`;
    }
    
    // Overall status
    results.status = {
      stripeConfigured: results.stripeConfiguration.secretKey.valid && 
                        results.stripeConfiguration.webhookSecret.valid,
      webhooksReceived: results.webhookEvents.count > 0,
      sessionsProcessed: results.processedSessions.count > 0,
      summary: 'Diagnostics completed successfully'
    };
    
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error checking webhook configuration:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
} 
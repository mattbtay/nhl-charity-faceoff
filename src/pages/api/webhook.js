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

// Helper function to check if a session has already been processed
async function hasSessionBeenProcessed(sessionId) {
  try {
    // Check the 'processed_sessions' collection to see if this session ID exists
    const sessionsRef = db.collection('processed_sessions');
    const docRef = sessionsRef.doc(sessionId);
    const doc = await docRef.get();
    
    return doc.exists;
  } catch (error) {
    console.error('Error checking processed sessions:', error);
    // If there's an error, assume it hasn't been processed to avoid missing payments
    return false;
  }
}

// Helper function to mark a session as processed
async function markSessionAsProcessed(sessionId, teamId, amount) {
  try {
    const sessionsRef = db.collection('processed_sessions');
    await sessionsRef.doc(sessionId).set({
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      teamId,
      amount,
    });
    console.log('✅ Session marked as processed:', sessionId);
    return true;
  } catch (error) {
    console.error('Error marking session as processed:', error);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('🚀 Received webhook request');
  const sig = req.headers['stripe-signature'];
  console.log('🔑 Stripe signature:', sig);

  try {
    const buf = await buffer(req);
    console.log('📦 Request body length:', buf.length);

    const event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    console.log('✅ Webhook event verified:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { teamId } = session.metadata;
      const amount = session.amount_total / 100; // Convert from cents to dollars
      const sessionId = session.id;

      console.log('💰 Processing completed checkout:', {
        sessionId,
        teamId,
        amount,
        amountInCents: session.amount_total,
        metadata: session.metadata
      });

      // Check if this session has already been processed
      const alreadyProcessed = await hasSessionBeenProcessed(sessionId);
      if (alreadyProcessed) {
        console.log('⚠️ Session already processed, skipping:', sessionId);
        return res.status(200).json({ 
          received: true,
          processed: false,
          reason: 'Session already processed'
        });
      }

      try {
        // Find the team document by id field
        const teamsRef = db.collection('teams');
        const querySnapshot = await teamsRef.where('id', '==', teamId).get();
        console.log('🔍 Query results:', querySnapshot.size, 'documents found');

        if (querySnapshot.empty) {
          throw new Error(`Team not found with id: ${teamId}`);
        }

        const teamDoc = querySnapshot.docs[0];
        console.log('🏒 Found team document:', teamDoc.id, 'with data:', teamDoc.data());

        // Update the donation total using a transaction
        const result = await db.runTransaction(async (transaction) => {
          try {
            const docSnapshot = await transaction.get(teamDoc.ref);
            if (!docSnapshot.exists) {
              throw new Error('Document does not exist!');
            }

            const currentData = docSnapshot.data();
            const currentTotal = currentData.donationTotal || 0;
            const newTotal = currentTotal + amount;

            console.log('📝 Updating donation total:', {
              teamId,
              documentId: teamDoc.id,
              currentTotal,
              amount,
              newTotal
            });

            transaction.update(teamDoc.ref, {
              donationTotal: newTotal,
              lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });

            return { currentTotal, newTotal, success: true };
          } catch (error) {
            console.error('❌ Error in transaction:', error);
            return { success: false, error: error.message };
          }
        });

        if (!result.success) {
          throw new Error(`Transaction failed: ${result.error}`);
        }

        // Mark this session as processed to prevent duplicate processing
        await markSessionAsProcessed(sessionId, teamId, amount);

        console.log('🎉 Successfully updated donation total in Firebase:', result);
        
        // Let's log all docs in the 'teams' collection to verify the update
        const allTeams = await db.collection('teams').get();
        console.log(`📊 Current teams collection (${allTeams.size} docs):`);
        allTeams.forEach(doc => {
          console.log(`Team ${doc.id}:`, doc.data());
        });
        
        res.status(200).json({ 
          received: true,
          updated: true,
          result
        });
      } catch (error) {
        console.error('❌ Error updating Firebase:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        return res.status(500).json({ message: error.message });
      }
    } else {
      console.log('⏭️ Ignoring non-checkout event:', event.type);
      res.status(200).json({ received: true });
    }
  } catch (error) {
    console.error('❌ Webhook error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(400).json({ message: error.message });
  }
} 
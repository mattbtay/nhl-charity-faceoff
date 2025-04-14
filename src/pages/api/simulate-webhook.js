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
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Validate request body
  const { teamId, amount } = req.body;
  
  if (!teamId || amount === undefined || isNaN(parseFloat(amount))) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing or invalid parameters. Required: teamId (string) and amount (number)' 
    });
  }

  const numericAmount = parseFloat(amount);
  
  try {
    console.log(`🔮 Simulating webhook for team ${teamId} with amount ${numericAmount}`);
    
    // Find the team document by id field
    const teamsRef = db.collection('teams');
    const querySnapshot = await teamsRef.where('id', '==', teamId).get();
    
    if (querySnapshot.empty) {
      console.error(`❌ Team not found with id: ${teamId}`);
      return res.status(404).json({ 
        success: false, 
        message: `Team not found with id: ${teamId}` 
      });
    }

    const teamDoc = querySnapshot.docs[0];
    console.log('🏒 Found team document:', teamDoc.id, 'with data:', teamDoc.data());

    // Update the donation total using a transaction (identical to what the real webhook does)
    const result = await db.runTransaction(async (transaction) => {
      try {
        const docSnapshot = await transaction.get(teamDoc.ref);
        if (!docSnapshot.exists) {
          throw new Error('Document does not exist!');
        }

        const currentData = docSnapshot.data();
        const currentTotal = currentData.donationTotal || 0;
        
        // Make sure we're always dealing with integer amounts
        const intAmount = Math.round(numericAmount);
        const newTotal = currentTotal + intAmount;

        console.log('📝 Updating donation total:', {
          teamId,
          documentId: teamDoc.id,
          currentTotal,
          requestedAmount: numericAmount,
          actualAmount: intAmount,
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

    console.log('🎉 Successfully simulated webhook update:', result);
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Webhook simulation successful',
      previousTotal: result.currentTotal,
      newTotal: result.newTotal,
      teamId
    });
    
  } catch (error) {
    console.error('❌ Error simulating webhook:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
} 
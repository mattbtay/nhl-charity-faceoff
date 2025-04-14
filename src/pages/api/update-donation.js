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
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { teamId, amount, isIncrement } = req.body;

    if (!teamId || amount === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: teamId and amount are required' 
      });
    }

    // Validate inputs
    if (typeof amount !== 'number' || isNaN(amount)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount must be a valid number' 
      });
    }

    console.log(`🧪 API: ${isIncrement ? 'Incrementing' : 'Setting'} donation for team ${teamId} ${isIncrement ? 'by' : 'to'} ${amount}`);

    // Find the team document by id field
    const teamsRef = db.collection('teams');
    const querySnapshot = await teamsRef.where('id', '==', teamId).get();
    
    if (querySnapshot.empty) {
      return res.status(404).json({ 
        success: false, 
        message: `Team not found with id: ${teamId}` 
      });
    }

    const teamDoc = querySnapshot.docs[0];
    console.log('Found team document:', teamDoc.id);

    // Update the donation total using a transaction to ensure atomicity
    const result = await db.runTransaction(async (transaction) => {
      try {
        const docSnapshot = await transaction.get(teamDoc.ref);
        if (!docSnapshot.exists) {
          throw new Error('Document does not exist!');
        }

        const currentData = docSnapshot.data();
        const currentTotal = currentData.donationTotal || 0;
        
        // Convert amount to integer to ensure consistency 
        const intAmount = Math.round(amount);
        const newTotal = isIncrement ? currentTotal + intAmount : intAmount;

        console.log('Updating donation total:', {
          teamId,
          documentId: teamDoc.id,
          currentTotal,
          requestedAmount: amount,
          actualAmount: intAmount,
          newTotal,
          isIncrement
        });

        transaction.update(teamDoc.ref, {
          donationTotal: newTotal,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });

        return { currentTotal, newTotal, success: true };
      } catch (error) {
        console.error('Error in transaction:', error);
        return { success: false, error: error.message };
      }
    });

    if (!result.success) {
      throw new Error(`Transaction failed: ${result.error}`);
    }

    console.log('Successfully updated donation total in Firebase:', result);

    return res.status(200).json({
      success: true,
      previousTotal: result.currentTotal,
      newTotal: result.newTotal,
      teamId
    });
  } catch (error) {
    console.error('Error updating donation total:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
} 
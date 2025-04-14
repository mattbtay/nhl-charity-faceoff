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
  // Allow both GET and POST for easier testing
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Get parameters from query (GET) or body (POST)
  const teamId = req.method === 'GET' ? req.query.teamId : req.body.teamId;
  const amount = req.method === 'GET' 
    ? (req.query.amount ? parseInt(req.query.amount, 10) : 25) 
    : (req.body.amount ? parseInt(req.body.amount, 10) : 25);
  
  if (!teamId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing teamId parameter' 
    });
  }

  try {
    console.log(`🧪 Test donation for team ${teamId} with amount ${amount}`);
    
    // Find the team document
    const teamsRef = db.collection('teams');
    const querySnapshot = await teamsRef.where('id', '==', teamId).get();
    
    if (querySnapshot.empty) {
      return res.status(404).json({ 
        success: false, 
        message: `Team not found with id: ${teamId}` 
      });
    }

    const teamDoc = querySnapshot.docs[0];
    const teamData = teamDoc.data();
    const currentTotal = teamData.donationTotal || 0;
    const newTotal = currentTotal + amount;
    
    console.log('Current team data:', teamData);
    
    // Update the donation total
    await teamDoc.ref.update({
      donationTotal: newTotal,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Successfully updated donation total: ${currentTotal} → ${newTotal}`);
    
    // Add a record to the donations collection
    const donationId = await db.collection('donations').add({
      teamId: teamId,
      amount: amount,
      sessionId: `test-${Date.now()}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isTest: true
    });
    
    // Return success response
    return res.status(200).json({
      success: true,
      team: {
        id: teamId,
        name: teamData.name,
        charityName: teamData.charityName
      },
      donation: {
        amount: amount,
        previousTotal: currentTotal,
        newTotal: newTotal,
        id: donationId.id
      },
      instructions: "The donation total should now update in real-time through the Firestore subscription"
    });
    
  } catch (error) {
    console.error('❌ Error processing test donation:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
} 
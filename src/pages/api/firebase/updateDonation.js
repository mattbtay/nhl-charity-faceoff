import { mcp_firebase_mcp_firestore_update_document } from '@/lib/firebase-mcp';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { teamId, amount } = req.body;

  if (!teamId || amount === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await mcp_firebase_mcp_firestore_update_document({
      collection: 'donationTotals',
      id: teamId,
      data: { amount }
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating donation total:', error);
    res.status(500).json({ error: 'Failed to update donation total' });
  }
} 
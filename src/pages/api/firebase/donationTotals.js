export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('YOUR_FIREBASE_DATABASE_URL/donationTotals.json');
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching donation totals:', error);
    res.status(500).json({ error: 'Failed to fetch donation totals' });
  }
} 
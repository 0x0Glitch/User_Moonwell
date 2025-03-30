import { db } from "ponder:api";
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { desc, sql } from "drizzle-orm";

// Create the Hono app
const app = new Hono();

// Enable CORS
app.use('/*', cors());

// API Routes
// 1. GET all user positions
app.get('/api/positions', async (c) => {
  try {
    const positions = await db.select().from(sql`user_positions`);
    
    return c.json({ success: true, positions });
  } catch (error) {
    console.error('Error fetching positions:', error);
    return c.json({ success: false, error: 'Failed to fetch positions' }, 500);
  }
});

// 2. GET positions for a specific user
app.get('/api/positions/:userAddress', async (c) => {
  try {
    const userAddress = c.req.param('userAddress').toLowerCase();
    const positions = await db.select()
      .from(sql`user_positions`)
      .where(sql`user_address = ${userAddress}`);
    
    return c.json({ success: true, positions });
  } catch (error) {
    console.error('Error fetching user positions:', error);
    return c.json({ success: false, error: 'Failed to fetch user positions' }, 500);
  }
});

// 3. GET transaction history for a specific user
app.get('/api/transactions/:userAddress', async (c) => {
  try {
    const userAddress = c.req.param('userAddress').toLowerCase();
    const transactions = await db.select()
      .from(sql`user_transactions`)
      .where(sql`user_address = ${userAddress}`)
      .orderBy(sql`block_number desc`);
    
    return c.json({ success: true, transactions });
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return c.json({ success: false, error: 'Failed to fetch user transactions' }, 500);
  }
});

// 4. GET market parameters for a specific market
app.get('/api/market/:mTokenAddress', async (c) => {
  try {
    const mTokenAddress = c.req.param('mTokenAddress').toLowerCase();
    const parameters = await db.select()
      .from(sql`market_parameters`)
      .where(sql`m_token_address = ${mTokenAddress}`)
      .orderBy(sql`block_number desc`)
      .limit(10);
    
    return c.json({ success: true, parameters });
  } catch (error) {
    console.error('Error fetching market parameters:', error);
    return c.json({ success: false, error: 'Failed to fetch market parameters' }, 500);
  }
});

// Start the server if not in a test environment
if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 3001;
  console.log(`API server starting on port ${port}`);
  serve({
    fetch: app.fetch,
    port: Number(port)
  });
}

// Export the app for testing
export default app; 
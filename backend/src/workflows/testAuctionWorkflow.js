/**
 * Test script for auction close workflow
 * This script can be used to manually test the auction auto-close functionality
 */

const { sendEvent } = require('../services/inngest');
const { query } = require('../database/db');

/**
 * Test the auction close workflow by sending an auction.started event
 */
const testAuctionWorkflow = async () => {
  try {
    console.log('[Test] Starting auction workflow test...');
    
    // Get a sample auction from the database
    const auctionQuery = `
      SELECT a.*, dr.id as deal_room_id
      FROM auctions a
      JOIN deal_rooms dr ON a.deal_room_id = dr.id
      WHERE a.state = 'active'
      ORDER BY a.created_at DESC
      LIMIT 1
    `;
    
    const auctionResult = await query(auctionQuery);
    
    if (auctionResult.rows.length === 0) {
      console.log('[Test] No active auctions found. Creating test auction...');
      
      // You would need to create a test auction here
      // For now, let's use a mock auction ID
      const mockAuctionId = '00000000-0000-0000-0000-000000000000';
      const mockDealRoomId = '00000000-0000-0000-0000-000000000001';
      const endAt = new Date(Date.now() + 60000); // 1 minute from now
      
      console.log('[Test] Sending test event for mock auction...');
      
      await sendEvent({
        name: 'auction.started',
        data: {
          auctionId: mockAuctionId,
          dealRoomId: mockDealRoomId,
          endAt: endAt.toISOString()
        }
      });
      
      console.log('[Test] Test event sent. Workflow will trigger in 1 minute.');
      
    } else {
      const auction = auctionResult.rows[0];
      console.log(`[Test] Found active auction: ${auction.id}, ends at: ${auction.end_at}`);
      
      // Send the auction.started event (this will trigger the workflow)
      await sendEvent({
        name: 'auction.started',
        data: {
          auctionId: auction.id,
          dealRoomId: auction.deal_room_id,
          endAt: auction.end_at
        }
      });
      
      console.log('[Test] Event sent for existing auction');
    }
    
    console.log('[Test] Test completed successfully');
    
  } catch (error) {
    console.error('[Test] Test failed:', error);
  }
};

/**
 * Test the helper function directly
 */
const testCloseAuctionFunction = async (auctionId) => {
  try {
    console.log(`[Test] Testing closeAuctionAndPickWinner for auction: ${auctionId}`);
    
    const { closeAuctionAndPickWinner } = require('./auctionCloseWorkflow');
    const result = await closeAuctionAndPickWinner(auctionId);
    
    console.log('[Test] Result:', JSON.stringify(result, null, 2));
    return result;
    
  } catch (error) {
    console.error('[Test] Function test failed:', error);
    throw error;
  }
};

// Export for use in other scripts
module.exports = {
  testAuctionWorkflow,
  testCloseAuctionFunction
};

// If run directly
if (require.main === module) {
  (async () => {
    console.log('Running auction workflow tests...');
    
    // Test 1: Send workflow event
    await testAuctionWorkflow();
    
    // Test 2: Test helper function (uncomment and provide auctionId)
    // await testCloseAuctionFunction('your-auction-id-here');
    
    process.exit(0);
  })().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

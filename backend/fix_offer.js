const { pool } = require('./src/database/db');

async function fixOfferBuyerId() {
  try {
    console.log('Fixing buyer_id for offer 3a73892f-5182-40a9-8971-3573e13e566f...');
    
    // Update the buyer_id to the correct buyer (Mohd Bin Ali)
    const result = await pool.query(
      'UPDATE offers SET buyer_id = $1 WHERE id = $2',
      ['ea65c116-e605-432a-8d5c-873d27ad48c2', '3a73892f-5182-40a9-8971-3573e13e566f']
    );
    
    console.log(`Updated ${result.rowCount} offer(s)`);
    
    // Verify the fix
    const checkResult = await pool.query(
      'SELECT buyer_id, seller_id FROM offers WHERE id = $1',
      ['3a73892f-5182-40a9-8971-3573e13e566f']
    );
    
    console.log('Fixed offer data:', checkResult.rows[0]);
    console.log('Buyer ID (should end with 8c2):', checkResult.rows[0].buyer_id);
    
  } catch (error) {
    console.error('Error fixing offer:', error);
  } finally {
    process.exit(0);
  }
}

fixOfferBuyerId();

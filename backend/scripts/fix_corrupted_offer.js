const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_Vz5Amu3Isocn@ep-square-heart-a1bgc3fp-pooler.ap-southeast-1.aws.neon.tech/SwapSphere?sslmode=require&channel_binding=require'
});

async function fixCorruptedOffer() {
  try {
    console.log('Fixing corrupted offer buyer_id...');
    
    // Fix the corrupted offer record
    const updateResult = await pool.query(`
      UPDATE offers 
      SET buyer_id = 'ea65c116-e605-432a-8d5c-873d27ad48c2'
      WHERE id = '30b20dcc-2bde-4893-90e3-4c420bbac3f6'
      AND buyer_id = '12f7cbbb-5fde-4024-800d-edfbd1895729'
    `);
    
    console.log('Updated rows:', updateResult.rowCount);
    
    // Verify the fix
    const verifyResult = await pool.query(`
      SELECT 
        o.id,
        o.buyer_id,
        o.seller_id,
        s.user_id as seller_user_id,
        o.offered_price,
        o.status
      FROM offers o
      LEFT JOIN sellers s ON o.seller_id = s.id
      WHERE o.id = '30b20dcc-2bde-4893-90e3-4c420bbac3f6'
    `);
    
    console.log('Fixed offer data:', verifyResult.rows[0]);
    
  } catch (error) {
    console.error('Error fixing offer:', error);
  } finally {
    await pool.end();
  }
}

fixCorruptedOffer();

const { Pool } = require('pg');

const pool = new Pool();

async function fixAuctionMetadata() {
  try {
    const result = await pool.query(
      'UPDATE deal_rooms SET metadata = COALESCE(metadata, "{}") || $1 WHERE id = $2',
      [JSON.stringify({ auction_id: 'a7fae436-5387-4633-9ae7-e7a745fca0f4' }), 'c20e888f-d026-47b3-a931-7e626dd352cc']
    );
    
    console.log('Fixed existing auction metadata!');
    console.log('Rows affected:', result.rowCount);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

fixAuctionMetadata();
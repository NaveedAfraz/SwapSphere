const { pool } = require("../database/db");

/**
 * Compute haversine distance in kilometers between two lat/lng pairs.
 */
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Rank and return listings for an intent using semantic + location + seller commitment.
 * Falls back to keyword search if embeddings are unavailable or fail.
 */
async function matchIntent({
  intentId,
  intentEmbedding,
  buyerId,
  buyerLocation = {},
  maxPrice,
  category,
  limit = 20,
}) {
  const client = await pool.connect();
  try {
    const hasEmbedding =
      Array.isArray(intentEmbedding) && intentEmbedding.length > 0;
    let embeddingParam = null;

    if (hasEmbedding) {
      embeddingParam = `[${intentEmbedding.join(",")}]`; // ✅ pgvector literal
    }
    const candidates = [];

    // Helper to build location filter parts for SQL (city/state equality).
    const locationFilters = [];
    const locationParams = [];
    if (buyerLocation.city) {
      locationParams.push(buyerLocation.city);
      locationFilters.push(`LOWER(l.location->>'city') = LOWER($PLACEHOLDER$)`);
    }
    if (buyerLocation.state) {
      locationParams.push(buyerLocation.state);
      locationFilters.push(
        `LOWER(l.location->>'state') = LOWER($PLACEHOLDER$)`
      );
    }

    const buildLocationClause = (startIndex) => {
      if (locationFilters.length === 0) return { clause: "", params: [] };
      const clauseParts = locationFilters.map((f, idx) =>
        f.replace("$PLACEHOLDER$", `$${startIndex + idx}`)
      );
      return {
        clause: `AND (${clauseParts.join(" OR ")})`,
        params: locationParams,
      };
    };

    // Primary semantic + filter query
    if (hasEmbedding) {
      const { clause: locationClause, params: locParams } =
        buildLocationClause(5);
      const vectorParams = [
        embeddingParam,  
        maxPrice ?? null,
        category ?? null,
        buyerId,
        ...locParams,
      ];

      const vectorQuery = `
      SELECT
  l.id AS listing_id,
  l.title AS listing_title,
  l.description AS listing_description,
  l.price AS listing_price,
  l.latitude AS listing_latitude,
  l.longitude AS listing_longitude,
  l.location->>'city' AS listing_city,
  l.location->>'state' AS listing_state,
  s.user_id AS seller_user_id,
  s.seller_rating,
  s.total_sales,
  (l.embedding <=> $1::vector) AS semantic_distance
FROM listings l
JOIN sellers s ON s.id = l.seller_id
WHERE l.intent_eligible = TRUE
  AND l.is_published = TRUE
  AND l.deleted_at IS NULL
  AND l.embedding IS NOT NULL
  AND ($2::numeric IS NULL OR l.price <= ($2 * 1.25))
  AND ($3::text IS NULL OR l.category = $3)
  AND s.user_id != $4
  ${locationClause}
ORDER BY semantic_distance ASC
LIMIT 50;

      `;

      const { rows } = await client.query(vectorQuery, vectorParams);
      candidates.push(...rows);
    }

    // Fallback keyword search if no embedding results or embedding missing
    if (!hasEmbedding || candidates.length === 0) {
      const keywordText =
        (buyerLocation.city ? `${buyerLocation.city} ` : "") +
        (buyerLocation.state ? `${buyerLocation.state} ` : "") +
        (category || "");

      const tsQuery = keywordText.trim() || "market";
      const { clause: kwLocationClause, params: kwLocParams } =
        buildLocationClause(5);
      const kwParams = [
        tsQuery,
        maxPrice ?? null,
        category ?? null,
        buyerId,
        ...kwLocParams,
      ];

      const keywordQuery = `
        SELECT
          l.id AS listing_id,
          l.title AS listing_title,
          l.description AS listing_description,
          l.price AS listing_price,
          l.latitude AS listing_latitude,
          l.longitude AS listing_longitude,
          l.location->>'city' AS listing_city,
          l.location->>'state' AS listing_state,
          s.user_id AS seller_user_id,
          s.seller_rating,
          s.total_sales,
          ts_rank_cd(l.search_vector, plainto_tsquery($1)) AS keyword_rank
        FROM listings l
        JOIN sellers s ON s.id = l.seller_id
        WHERE l.intent_eligible = TRUE
          AND l.is_published = TRUE
          AND l.deleted_at IS NULL
          AND ($2::numeric IS NULL OR l.price <= ($2 * 1.25))
          AND ($3::text IS NULL OR l.category = $3)
          AND s.user_id != $4
          ${kwLocationClause}
        ORDER BY keyword_rank DESC
        LIMIT 50;
      `;

      console.warn("[MATCH] Using keyword fallback for intent", intentId);
      const { rows } = await client.query(keywordQuery, kwParams);
      candidates.push(...rows);
    }

    // Rank candidates client-side with weighted score
    const ranked = candidates
      .map((row) => {
        let semanticScore = 0;

        if (hasEmbedding && row.semantic_distance != null) {
          // pgvector cosine distance → similarity
          const d = Number(row.semantic_distance);
          semanticScore = 1 - Math.min(1, Math.max(0, d));
        } else if (row.keyword_rank != null) {
          // ts_rank_cd → already higher is better
          semanticScore = Math.min(1, Number(row.keyword_rank));
        }

        let locationScore = 0;
        if (
          buyerLocation.latitude != null &&
          buyerLocation.longitude != null &&
          row.listing_latitude != null &&
          row.listing_longitude != null
        ) {
          const km = haversineDistanceKm(
            Number(buyerLocation.latitude),
            Number(buyerLocation.longitude),
            Number(row.listing_latitude),
            Number(row.listing_longitude)
          );
          locationScore =
            km < 10
              ? 1
              : km < 25
              ? 0.8
              : km < 50
              ? 0.6
              : km < 100
              ? 0.4
              : km < 200
              ? 0.2
              : 0.3;
        } else if (buyerLocation.city && row.listing_city) {
          locationScore =
            buyerLocation.city.toLowerCase() === row.listing_city.toLowerCase()
              ? 0.8
              : 0.3;
        }

        const sellerRating = Number(row.seller_rating || 0);
        const totalSales = Number(row.total_sales || 0);
        const commitmentScore =
          Math.min(1, sellerRating / 5) * 0.7 +
          Math.min(1, totalSales / 50) * 0.3;

        const finalScore =
          0.6 * semanticScore + 0.25 * locationScore + 0.15 * commitmentScore;

        return {
          ...row,
          semantic_score: semanticScore,
          location_score: locationScore,
          commitment_score: commitmentScore,
          final_score: finalScore,
        };
      })
      .sort((a, b) => b.final_score - a.final_score)
      .slice(0, limit);

    // Persist matches (best-effort)
    if (ranked.length > 0) {
      const insertValues = ranked
        .map((_row, idx) => `($1, $${idx * 2 + 2}, $${idx * 2 + 3})`)
        .join(", ");
      const insertParams = ranked.flatMap((r) => [r.listing_id, r.final_score]);

      const insertQuery = `
        INSERT INTO intent_matches (intent_id, listing_id, similarity)
        VALUES ${insertValues}
        ON CONFLICT (intent_id, listing_id) DO UPDATE SET similarity = EXCLUDED.similarity;
      `;

      try {
        await client.query(insertQuery, [intentId, ...insertParams]);
      } catch (err) {
        console.error("[MATCH] Failed to persist intent_matches:", err);
      }
    }

    return ranked;
  } catch (err) {
    console.error("[MATCH] matchIntent error:", err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  matchIntent,
};

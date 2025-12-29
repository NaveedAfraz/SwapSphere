const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

// Helper function to pause execution (used for waiting between retries)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate an embedding for free-form text using Gemini.
 * Includes Retry Logic (Exponential Backoff) for 429 Errors.
 */
async function generateEmbedding(text) {
  // 1. Validate Input
  if (!text || !text.trim()) {
    throw new Error("generateEmbedding: text is required");
  }

  // 2. Validate API Key
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("[EMBEDDING] GOOGLE_API_KEY is missing in environment variables");
  }

  const url = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";
  const body = {
    content: { parts: [{ text }] },
  };

  // 3. Retry Logic Configuration
  const maxRetries = 5; // Maximum number of times to retry
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const res = await fetch(`${url}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      // --- SCENARIO A: SUCCESS ---
      if (res.ok) {
        const data = await res.json();
        const vector = data?.embedding?.values;
        
        if (!Array.isArray(vector)) {
          throw new Error("generateEmbedding: Received invalid format from API");
        }
        return vector;
      }

      // --- SCENARIO B: ERROR HANDLING ---
      const errText = await res.text();

      // Check for Rate Limit (429) or Server Overload (503)
      if (res.status === 429 || res.status === 503) {
        attempt++;
        
        if (attempt > maxRetries) {
          throw new Error(`[EMBEDDING] Failed after ${maxRetries} retries. Final error: ${errText}`);
        }

        // Calculate wait time: 1s, 2s, 4s, 8s, 16s...
        const waitTime = Math.pow(2, attempt) * 1000;
        
        console.warn(`[EMBEDDING] API Busy (Status ${res.status}). Retrying in ${waitTime / 1000}s...`);
        
        // Pause before looping back
        await delay(waitTime);
        continue;
      }

      // If it's a different error (e.g., 400 Bad Request), fail immediately
      throw new Error(`generateEmbedding: API Error ${res.status} - ${errText}`);

    } catch (error) {
      // Catch network-level errors (like DNS failure) and retry them too if needed,
      // otherwise rethrow.
      if (attempt < maxRetries && error.code === 'ETIMEDOUT') {
         attempt++;
         await delay(1000);
         continue;
      }
      throw error;
    }
  }
}

module.exports = { generateEmbedding };
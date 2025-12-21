require("dotenv").config();
const { sendEvent } = require("../services/inngest");

/**
 * Test function to send an intent.created event
 */
async function testIntentCreatedEvent() {
  try {
    const result = await sendEvent({
      name: "intent.created",
      data: {
        intentId: "test-intent-123",
        buyerId: "test-buyer-456",
        title: "Looking for iPhone 13",
        category: "electronics",
        maxPrice: 800,
        location: {
          city: "New York",
          state: "NY"
        }
      },
    });

    console.log("Event sent successfully:", result);
    return result;
  } catch (error) {
    console.error("Failed to send event:", error);
    throw error;
  }
}

/**
 * Test function to verify Inngest connectivity
 */
async function testInngestConnectivity() {
  try {
    const result = await sendEvent({
      name: "test.ping",
      data: {
        message: "Testing Inngest connectivity",
        timestamp: new Date().toISOString()
      },
    });

    console.log("Inngest connectivity test passed:", result);
    return result;
  } catch (error) {
    console.error("Inngest connectivity test failed:", error);
    throw error;
  }
}

/**
 * Test function to send multiple events for stress testing
 */
async function testMultipleEvents() {
  try {
    const promises = [];
    for (let i = 1; i <= 5; i++) {
      promises.push(sendEvent({
        name: "test.batch",
        data: {
          batchId: `batch-${Date.now()}`,
          eventId: i,
          message: `Test event ${i} in batch`
        }
      }));
    }

    const results = await Promise.all(promises);
    console.log(`Successfully sent ${results.length} events in batch`);
    return results;
  } catch (error) {
    console.error("Batch event test failed:", error);
    throw error;
  }
}

/**
 * Test function to validate webhook endpoint
 */
async function testWebhookEndpoint() {
  try {
    const baseUrl = process.env.NGROK_URL || 'http://localhost:5000';
    const webhookUrl = `${baseUrl}/api/inngest`;
    
    console.log(`Testing webhook endpoint: ${webhookUrl}`);
    
    // Simple health check
    const response = await fetch(`${webhookUrl}/health`);
    
    if (response.ok) {
      const data = await response.json();
      console.log("Webhook endpoint is healthy:", data);
      return data;
    } else {
      throw new Error(`Webhook responded with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Webhook endpoint test failed:", error);
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  (async () => {
    console.log("Testing Inngest connectivity...");
    await testInngestConnectivity();
    
    console.log("\nTesting intent.created event...");
    await testIntentCreatedEvent();
    
    console.log("\nTesting multiple events...");
    await testMultipleEvents();
    
    console.log("\nTesting webhook endpoint...");
    await testWebhookEndpoint();
    
    console.log("\nAll tests completed!");
  })().catch(console.error);
}

module.exports = {
  testIntentCreatedEvent,
  testInngestConnectivity,
  testMultipleEvents,
  testWebhookEndpoint
};

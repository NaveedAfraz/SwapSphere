const { Inngest } = require("inngest");
console.log("SIGNING KEY:", process.env.INNGEST_SIGNING_KEY?.slice(0, 20));
console.log("EVENT KEY:", process.env.INNGEST_EVENT_KEY?.slice(0, 20));

const inngest = new Inngest({
  id: "swapsphere-3fc852d0",
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
  dev: process.env.NODE_ENV !== "production",
});

console.log("[INNGEST] Client created with ID:", "swapsphere-3fc852d0");

const sendEvent = async (event) => {
  return await inngest.send(event);
};

module.exports = {
  inngest,
  sendEvent,
};

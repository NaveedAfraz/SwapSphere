const { Inngest } = require("inngest");

const inngest = new Inngest({
  id: "swapsphere-3fc852d0",
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
  dev: process.env.NODE_ENV !== "production",
});


const sendEvent = async (event) => {
  return await inngest.send(event);
};

module.exports = {
  inngest,
  sendEvent,
};

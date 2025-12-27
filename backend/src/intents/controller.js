const {
  createIntent,
  getIntentsByUser,
  getIntentById,
  updateIntent,
  deleteIntent,
  searchIntents,
} = require("./model");
const { inngest, sendEvent } = require("../services/inngest");

const createIntentController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, category, max_price, location } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ error: "Description is required" });
    }

    if (!max_price || parseFloat(max_price) <= 0) {
      return res.status(400).json({ error: "Valid max price is required" });
    }

    if (!category) {
      return res.status(400).json({ error: "Category is required" });
    }

    if (!location || !location.city) {
      return res.status(400).json({ error: "Location with city is required" });
    }

    const intentData = {
      buyer_id: userId,
      title: title.trim(),
      description: description.trim(),
      category,
      max_price: parseFloat(max_price),
      location,
    };

    const intent = await createIntent(intentData);

    await sendEvent({ name: "intent.created", data: { intentId: intent.id } });

    res.status(201).json(intent);
  } catch (error) {
    console.error("[INTENT] Error creating intent:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getIntentsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
    };

    const result = await getIntentsByUser(userId, options);
    res.json(result);
  } catch (error) {
    console.error("Error getting intents:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getIntentController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const intent = await getIntentById(id);

    if (!intent) {
      return res.status(404).json({ error: "Intent not found" });
    }

    // Verify user owns the intent
    if (intent.buyer_id !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(intent);
  } catch (error) {
    console.error("Error getting intent:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateIntentController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description, category, max_price, location, status } =
      req.body;

    // First check if intent exists and belongs to user
    const existingIntent = await getIntentById(id);

    if (!existingIntent) {
      return res.status(400).json({ error: "Intent not found" });
    }

    if (existingIntent.buyer_id !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Validate update data
    const updateData = {};

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ error: "Title cannot be empty" });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      if (!description.trim()) {
        return res.status(400).json({ error: "Description cannot be empty" });
      }
      updateData.description = description.trim();
    }

    if (max_price !== undefined) {
      if (parseFloat(max_price) <= 0) {
        return res
          .status(400)
          .json({ error: "Max price must be greater than 0" });
      }
      updateData.max_price = parseFloat(max_price);
    }

    if (category !== undefined) {
      updateData.category = category;
    }

    if (location !== undefined) {
      if (!location.city) {
        return res.status(400).json({ error: "Location must include city" });
      }
      updateData.location = location;
    }

    if (status !== undefined) {
      const validStatuses = ["open", "matched", "closed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      updateData.status = status;
    }

    const updatedIntent = await updateIntent(id, updateData);
    res.json(updatedIntent);
  } catch (error) {
    console.error("Error updating intent:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteIntentController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deletedIntent = await deleteIntent(id, userId);

    if (!deletedIntent) {
      return res
        .status(404)
        .json({ error: "Intent not found or cannot be deleted" });
    }

    res.json({ message: "Intent deleted successfully", intent: deletedIntent });
  } catch (error) {
    console.error("Error deleting intent:", error);

    if (error.message === "Cannot delete intent with active deal rooms") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Internal server error" });
  }
};

const searchIntentsController = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      max_price,
      location_text,
      buyer_location,
    } = req.query;

    const searchOptions = {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      max_price: max_price ? parseFloat(max_price) : undefined,
      location_text,
      buyer_location: buyer_location ? JSON.parse(buyer_location) : undefined,
    };

    const result = await searchIntents(searchOptions);
    res.json(result);
  } catch (error) {
    console.error("Error searching intents:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createIntent: createIntentController,
  getIntents: getIntentsController,
  getIntent: getIntentController,
  updateIntent: updateIntentController,
  deleteIntent: deleteIntentController,
  searchIntents: searchIntentsController,
};

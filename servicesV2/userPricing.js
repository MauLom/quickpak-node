const { MongoClient } = require("mongodb");

// Connection URL and database name
const url = "mongodb://localhost:27017";
const dbName = "your-database-name";

async function getSpecificPriceWithExtraKgs(user_id, provider, zone, kgs) {
    const client = new MongoClient(url, { useUnifiedTopology: true });
  
    try {
      await client.connect();
  
      const db = client.db(dbName);
      const userPricingCollection = db.collection("user_pricing");
  
      // Query for the specific price using the provided criteria
      const specificPrice = await userPricingCollection.findOne({
        user_id,
        provider,
        zone,
        kgs: { $lte: kgs }, // Find prices where kgs is less than or equal to the provided kgs
      });
  
      if (specificPrice) {
        const { kgs: maxKgs, prices } = specificPrice;
        const extraKgs = kgs - maxKgs;
  
        if (extraKgs > 0) {
          const extraKgPrice = prices[prices.length - 1]; // Get the last price for extra kgs
          const extraKgsCost = extraKgs * extraKgPrice;
          const totalCost = prices[prices.length - 1] + extraKgsCost;
          return totalCost;
        } else {
          return prices[prices.length - 1]; // No extra kgs
        }
      } else {
        return null; // Price not found for the given criteria
      }
    } finally {
      client.close();
    }
  }
module.exports={getSpecificPriceWithExtraKgs}
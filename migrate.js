// migrateUsersWithPricingMatrix.js
require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require("bcrypt");
const fs = require('fs');

// Como se va a perder la estructura de user_pricing primero hacermos backup de los arcvhivos en un json para poder  leerlo despues
const pricingData = JSON.parse(fs.readFileSync("C:\\Users\\RENTA INTERCOM\\Downloads\\Quickpak.user_pricing.json", 'utf8'));

const sourceDbUrl = process.env.MONGO_URI;
const targetDbUrl = process.env.MONGO_URI

async function migrate() {
  const sourceClient = new MongoClient(sourceDbUrl, { useUnifiedTopology: true });
  const targetClient = new MongoClient(targetDbUrl, { useUnifiedTopology: true });

  try {
    await sourceClient.connect();
    await targetClient.connect();

    const sourceDb = sourceClient.db('Quickpak');
    const targetDb = targetClient.db('Quickpak-TST');

    const users = await sourceDb.collection('users').find({}).toArray();

    for (const user of users) {
      let pricing_matrix_dhl = {};
      let pricing_matrix_estafeta = {};

      for (const access of user.provider_access || []) {
        for (const service of access.services) {
          const pricingEntry = pricingData.find(p =>
            p.provider_id === access.provider_id &&
            p.service === service &&
            p.user_id === user._id.toString()
          );
          if (pricingEntry && pricingEntry.pricing && pricingEntry.pricing.length > 0) {
            // Formatea el array de precios al formato solicitado
            const formattedPricing = pricingEntry.pricing.map(item => {
              // Si item.prices existe y es array, mapea cada precio
              if (Array.isArray(item.prices)) {
                return [
                  { value: String(item.kg), readOnly: true },
                  ...item.prices.map(priceObj => ({
                    value: String(priceObj.price),
                    readOnly: false
                  }))
                ];
              }
              return [];
            });

            if (access.provider_id === 'DHL') {
              pricing_matrix_dhl[service] = formattedPricing;
            }
            if (access.provider_id === 'Estafeta') {
              pricing_matrix_estafeta[service] = formattedPricing;
            }
          }
          // Si no hay pricingEntry, no agregues la clave
        }
      }

        const saltRounds = 10;
        const encryptedBasicAuthPass = await bcrypt.hash(`${user.userName}2025`, saltRounds);
      
      const newUserPricing = {
        user_id: user._id.toString(),
        email: user.email,
        userName: user.userName,
        password: user.password,
        reference_dhl: user.string_reference,
        reference_estafeta: user.string_reference,
        role: user.role,
        is_active: true,
        name: user.userName,
        basic_auth_username: user.userName,
        basic_auth_password: encryptedBasicAuthPass,
        pricing_matrix_dhl,
        pricing_matrix_estafeta,
        created_at: new Date()
      };

      await targetDb.collection('user_pricing').insertOne(newUserPricing);
      console.log(`Migrado: ${user.userName}`);
    }
  } catch (err) {
    console.error('Error en migración:', err);
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

migrate();
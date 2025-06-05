const express = require("express");
const router = express.Router();
const { MongoClient, ObjectId } = require("mongodb");

require("dotenv").config(); // charge les variables d’environnement

const url = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "project_delta";
const collectionName = process.env.MONGODB_COLLECTION || "avis";
const mdpSuppression = process.env.DELETE_PASSWORD;

const client = new MongoClient(url, { useUnifiedTopology: true });

async function getCollection() {
  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }
  return client.db(dbName).collection(collectionName);
}

// Récupérer tous les avis
router.get("/", async (req, res) => {
  try {
    const collection = await getCollection();
    const avis = await collection.find().toArray();
    res.json(avis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Ajouter un avis
router.post("/", async (req, res) => {
  try {
    const { pseudo, message } = req.body;
    if (!pseudo || !message) return res.status(400).json({ message: "Champs manquants" });

    const collection = await getCollection();
    await collection.insertOne({ pseudo, message });
    res.status(201).json({ message: "Avis ajouté avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Supprimer un avis
router.delete("/:id", async (req, res) => {
  try {
    const { mdp } = req.body;
    if (mdp !== mdpSuppression) return res.status(403).json({ message: "Mot de passe incorrect" });

    const collection = await getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) return res.status(404).json({ message: "Avis introuvable" });

    res.json({ message: "Avis supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;

import { getQdrantClient } from "../config/qdrant";
import { config } from "../config";

async function createCollection() {
  const client = getQdrantClient();
  const collectionName = config.qdrant.collectionName;
  const vectorSize = config.qdrant.vectorSize;

  console.log(
    `Checking collection '${collectionName}' with vector size ${vectorSize}...`,
  );

  try {
    const collections = await client.getCollections();
    const exists = collections.collections.some(
      (c) => c.name === collectionName,
    );

    if (exists) {
      console.log(`Collection '${collectionName}' already exists.`);

      const info = await client.getCollection(collectionName);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vectorParams = info.config?.params?.vectors as any;
      const size =
        vectorParams?.size || vectorParams?.[""]?.size || vectorParams;

      console.log(`Existing vector size: ${size}`);

      if (size !== vectorSize) {
        console.warn(
          `WARNING: Existing size ${size} matches config ${vectorSize}.`,
        );
        console.log("To recreate it, run this script with --recreate");

        if (process.argv.includes("--recreate")) {
          console.log("Recreating collection...");
          await client.deleteCollection(collectionName);
          await client.createCollection(collectionName, {
            vectors: {
              size: vectorSize,
              distance: "Cosine",
            },
          });
          console.log("Collection recreated successfully.");
        }
      } else {
        console.log("Collection configuration is correct.");
      }
    } else {
      console.log(`Creating collection '${collectionName}'...`);
      await client.createCollection(collectionName, {
        vectors: {
          size: vectorSize,
          distance: "Cosine",
        },
      });
      console.log("Collection created successfully.");
    }
  } catch (error) {
    console.error("Failed to manage collection:", error);
  }
}

createCollection();

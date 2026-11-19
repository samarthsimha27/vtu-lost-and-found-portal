import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Item } from './models/Item';
import { SAMPLE_ITEMS } from './sampleData';
import { MONGODB_URI } from './db';

dotenv.config();

async function runSeed() {
  console.log(`[Seed] Connecting to MongoDB at ${MONGODB_URI}...`);
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Connected to MongoDB.');

    console.log('[Seed] Upserting sample campus items...');
    for (const sample of SAMPLE_ITEMS) {
      await Item.findOneAndUpdate(
        { id: sample.id },
        { $set: sample },
        { upsert: true, new: true }
      );
      console.log(`  ✓ [${sample.kind}] ${sample.name} (${sample.location})`);
    }

    const total = await Item.countDocuments();
    console.log(`\n[Seed] Successfully seeded! Total items in MongoDB: ${total}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Seed] Error seeding database:', message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[Seed] Disconnected from MongoDB.');
    process.exit(0);
  }
}

runSeed();

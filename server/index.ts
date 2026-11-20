import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { connectDB, getIsConnected } from './db';
import { Item, IItem, ItemStatus, RecordKind } from './models/Item';
import { SAMPLE_ITEMS } from './sampleData';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// 20mb limit so base64 geotagged pictures don't exceed body limit
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// In-memory fallback repository when MongoDB server is offline
let fallbackStore: Record<string, unknown>[] = [];

const VALID_STATUSES: ItemStatus[] = ['Active', 'Claimed', 'Returned', 'Archived'];
const VALID_KINDS: RecordKind[] = ['lost_report', 'find_request', 'found_report'];

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    database: getIsConnected() ? 'mongodb' : 'in-memory-fallback',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/items
 * Create a new lost report or find request.
 */
app.post('/api/items', async (req: Request, res: Response) => {
  try {
    const {
      kind,
      name,
      description,
      location,
      locationCoordinates,
      dateLost,
      contactName,
      contactInfo,
      imageUrl,
      geotag,
      status,
      illustrationType,
      id
    } = req.body;

    if (!name || !description || !location || !dateLost || !contactName || !contactInfo) {
      return res.status(400).json({
        error: 'Missing required fields: name, description, location, dateLost, contactName, and contactInfo are required.'
      });
    }

    const itemKind: RecordKind = VALID_KINDS.includes(kind) ? kind : 'lost_report';
    const itemStatus: ItemStatus = VALID_STATUSES.includes(status) ? status : 'Active';
    const prefix = itemKind === 'found_report' ? 'found' : itemKind === 'find_request' ? 'req' : 'lost';
    const itemId = id || `vtu-${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    const newItemData = {
      id: itemId,
      kind: itemKind,
      name: String(name).trim(),
      description: String(description).trim(),
      status: itemStatus,
      imageUrl: imageUrl || undefined,
      geotag: geotag || undefined,
      location: String(location).trim(),
      locationCoordinates: locationCoordinates || { latitude: 15.7778, longitude: 74.4645 },
      dateLost: String(dateLost).trim(),
      contactName: String(contactName).trim(),
      contactInfo: String(contactInfo).trim(),
      illustrationType: illustrationType || 'electronics',
      createdAt: now
    };

    if (getIsConnected()) {
      const created = await Item.create(newItemData);
      return res.status(201).json(created.toJSON());
    } else {
      fallbackStore.unshift(newItemData);
      return res.status(201).json(newItemData);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error creating item:', message);
    return res.status(500).json({ error: 'Failed to create item', details: message });
  }
});

/**
 * GET /api/items
 * Fetch all reports with query filters:
 * - location
 * - category (illustrationType)
 * - keyword / q
 * - status
 * - kind
 */
app.get('/api/items', async (req: Request, res: Response) => {
  try {
    const { location, category, keyword, q, status, kind } = req.query;
    const searchTerm = (keyword || q || '') as string;

    if (getIsConnected()) {
      const query: Record<string, unknown> = {};

      if (kind && VALID_KINDS.includes(kind as RecordKind)) {
        query.kind = kind;
      }

      if (location && location !== 'All Locations') {
        query.location = location;
      }

      if (category && category !== 'All Categories') {
        query.illustrationType = category;
      }

      if (status && VALID_STATUSES.includes(status as ItemStatus)) {
        query.status = status;
      }

      if (searchTerm.trim()) {
        const regex = new RegExp(searchTerm.trim(), 'i');
        query.$or = [{ name: regex }, { description: regex }];
      }

      const items = await Item.find(query).sort({ createdAt: -1 }).lean();
      return res.json(items);
    } else {
      let filtered = [...fallbackStore];

      if (kind && VALID_KINDS.includes(kind as RecordKind)) {
        filtered = filtered.filter((i) => i.kind === kind);
      }

      if (location && location !== 'All Locations') {
        filtered = filtered.filter((i) => i.location === location);
      }

      if (category && category !== 'All Categories') {
        filtered = filtered.filter((i) => i.illustrationType === category);
      }

      if (status && VALID_STATUSES.includes(status as ItemStatus)) {
        filtered = filtered.filter((i) => i.status === status);
      }

      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        filtered = filtered.filter(
          (i) =>
            String(i.name || '').toLowerCase().includes(term) ||
            String(i.description || '').toLowerCase().includes(term)
        );
      }

      filtered.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
      return res.json(filtered);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error fetching items:', message);
    return res.status(500).json({ error: 'Failed to fetch items', details: message });
  }
});

/**
 * GET /api/items/:id
 * Fetch individual item details.
 */
app.get('/api/items/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (getIsConnected()) {
      const item = await Item.findOne({ id }).lean();
      if (!item) {
        return res.status(404).json({ error: `Item with id '${id}' not found` });
      }
      return res.json(item);
    } else {
      const item = fallbackStore.find((i) => i.id === id);
      if (!item) {
        return res.status(404).json({ error: `Item with id '${id}' not found` });
      }
      return res.json(item);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error fetching item ${req.params.id}:`, message);
    return res.status(500).json({ error: 'Failed to fetch item', details: message });
  }
});

/**
 * PATCH /api/items/:id/status
 * Mark an item as "Claimed", "Returned", or "Archived" (or "Active").
 */
app.patch('/api/items/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    if (getIsConnected()) {
      const updated = await Item.findOneAndUpdate(
        { id },
        { $set: { status } },
        { new: true, lean: true }
      );

      if (!updated) {
        return res.status(404).json({ error: `Item with id '${id}' not found` });
      }

      return res.json(updated);
    } else {
      const index = fallbackStore.findIndex((i) => i.id === id);
      if (index === -1) {
        return res.status(404).json({ error: `Item with id '${id}' not found` });
      }

      fallbackStore[index] = {
        ...fallbackStore[index],
        status
      };

      return res.json(fallbackStore[index]);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error updating status for item ${req.params.id}:`, message);
    return res.status(500).json({ error: 'Failed to update item status', details: message });
  }
});

/**
 * DELETE /api/items/:id
 * Allow the author or admin to remove a listing.
 */
app.delete('/api/items/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (getIsConnected()) {
      const deleted = await Item.findOneAndDelete({ id }).lean();
      if (!deleted) {
        return res.status(404).json({ error: `Item with id '${id}' not found` });
      }
      return res.json({
        success: true,
        message: 'Item deleted successfully',
        id
      });
    } else {
      const index = fallbackStore.findIndex((i) => i.id === id);
      if (index === -1) {
        return res.status(404).json({ error: `Item with id '${id}' not found` });
      }
      fallbackStore.splice(index, 1);
      return res.json({
        success: true,
        message: 'Item deleted successfully',
        id
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error deleting item ${req.params.id}:`, message);
    return res.status(500).json({ error: 'Failed to delete item', details: message });
  }
});

/**
 * POST /api/seed
 * Seed or reset sample campus items in MongoDB / memory store.
 */
app.post('/api/seed', async (_req: Request, res: Response) => {
  try {
    if (getIsConnected()) {
      for (const sample of SAMPLE_ITEMS) {
        await Item.findOneAndUpdate({ id: sample.id }, sample, { upsert: true, new: true });
      }
      const all = await Item.find().sort({ createdAt: -1 }).lean();
      return res.json({ success: true, count: all.length, items: all });
    } else {
      fallbackStore = [];
      return res.json({ success: true, count: 0, items: [] });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error seeding items:', message);
    return res.status(500).json({ error: 'Failed to seed sample items', details: message });
  }
});

// Serve frontend static files if built (Production deployment)
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Server and Connect DB
connectDB().finally(() => {
  app.listen(PORT, () => {
    console.log(`[Express] Backend server running on http://localhost:${PORT}`);
    console.log(`[Express] CRUD Endpoints active:`);
    console.log(`  - POST   /api/items`);
    console.log(`  - GET    /api/items (supports ?location=&category=&keyword=&status=&kind=)`);
    console.log(`  - GET    /api/items/:id`);
    console.log(`  - PATCH  /api/items/:id/status`);
    console.log(`  - DELETE /api/items/:id`);
    console.log(`  - POST   /api/seed (re-populate sample items)`);
  });
});

export default app;

import mongoose, { Schema, Document } from 'mongoose';

export type RecordKind = 'lost_report' | 'find_request' | 'found_report';
export type ItemStatus = 'Active' | 'Claimed' | 'Returned' | 'Archived';
export type CampusLocation =
  | 'Sports Complex'
  | 'Basketball Court'
  | 'Ground'
  | 'Boys’ Mess'
  | 'Girls’ Mess'
  | 'Administrative Department'
  | 'Regional Office / CUE Department'
  | 'Mechanical and MEA Department'
  | 'Xerox Shop'
  | 'Kateel Canteen'
  | 'Vidya Bhavan';

export type IllustrationType =
  | 'calculator'
  | 'id_card'
  | 'notebook'
  | 'electronics'
  | 'keys'
  | 'drafter'
  | 'watch';

export interface IItem extends Document {
  id: string;
  kind: RecordKind;
  name: string;
  description: string;
  status: ItemStatus;
  imageUrl?: string;
  geotag?: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    capturedAt?: string;
  };
  location: CampusLocation;
  locationCoordinates: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
  };
  dateLost: string;
  contactName: string;
  contactInfo: string;
  illustrationType: IllustrationType;
  createdAt: number;
}

const ItemSchema = new Schema<IItem>(
  {
    id: { type: String, required: true, unique: true, index: true },
    kind: { type: String, required: true, enum: ['lost_report', 'find_request', 'found_report'], index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Claimed', 'Returned', 'Archived'],
      default: 'Active',
      index: true
    },
    imageUrl: { type: String },
    geotag: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number, default: null },
      capturedAt: { type: String }
    },
    location: { type: String, required: true, index: true },
    locationCoordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      accuracy: { type: Number, default: null }
    },
    dateLost: { type: String, required: true },
    contactName: { type: String, required: true, trim: true },
    contactInfo: { type: String, required: true, trim: true },
    illustrationType: {
      type: String,
      required: true,
      enum: ['calculator', 'id_card', 'notebook', 'electronics', 'keys', 'drafter', 'watch']
    },
    createdAt: { type: Number, required: true, default: () => Date.now(), index: true }
  },
  {
    timestamps: false,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

ItemSchema.index({ name: 'text', description: 'text' });

export const Item: mongoose.Model<IItem> =
  (mongoose.models.Item as mongoose.Model<IItem>) || mongoose.model<IItem>('Item', ItemSchema);

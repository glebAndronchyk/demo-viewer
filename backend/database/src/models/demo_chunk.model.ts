import mongoose, { Model } from 'mongoose';
import { IDemoChunkDocument } from '../types/demo_chunk.types';
import { DemoChunkSchema } from '../schemas/demo_chunk.schema';

export const DemoChunkModel: Model<IDemoChunkDocument> =
  mongoose.models.DemoChunk || mongoose.model<IDemoChunkDocument>('DemoChunk', DemoChunkSchema);

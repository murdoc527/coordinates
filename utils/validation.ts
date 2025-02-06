import { z } from 'zod';

export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const SavedLocationSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  coordinates: CoordinatesSchema,
  timestamp: z.number(),
  format: z.enum(['BNG', 'DD', 'DDM', 'DMS']),
  originalInput: z.string(),
});

export type Coordinates = z.infer<typeof CoordinatesSchema>;
export type SavedLocation = z.infer<typeof SavedLocationSchema>; 
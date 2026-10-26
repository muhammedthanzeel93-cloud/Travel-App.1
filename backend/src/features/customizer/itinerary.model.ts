import mongoose, { Document, Schema } from 'mongoose';

export interface IAttractionStop {
  name: string;
  category: 'ICONIC_LANDMARK' | 'CULTURE_HERITAGE' | 'ADVENTURE' | 'BEACH_LEISURE' | 'SHOPPING_DINING';
  coordinates: {
    lat: number;
    lng: number;
  };
  recommendedDurationHours: number;
  image: string;
  entryFeeAed: number;
  tips: string;
}

export interface IDayPlan {
  dayNumber: number;
  title: string;
  theme: string;
  attractions: IAttractionStop[];
  recommendedStayId?: mongoose.Types.ObjectId;
  recommendedHotelName: string;
  estimatedDrivingKm: number;
  transitAdvice: string;
}

export interface IItinerary extends Document {
  userId?: mongoose.Types.ObjectId;
  title: string;
  destinationCity: string;
  visaType: string;
  totalDays: number;
  days: IDayPlan[];
  isOfficialTemplate: boolean;
  totalEstimatedCostAed: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttractionStopSchema = new Schema<IAttractionStop>({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['ICONIC_LANDMARK', 'CULTURE_HERITAGE', 'ADVENTURE', 'BEACH_LEISURE', 'SHOPPING_DINING'],
    default: 'ICONIC_LANDMARK'
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  recommendedDurationHours: { type: Number, default: 2 },
  image: { type: String, required: true },
  entryFeeAed: { type: Number, default: 0 },
  tips: { type: String, default: 'Best visited during afternoon/sunset hours.' }
});

const DayPlanSchema = new Schema<IDayPlan>({
  dayNumber: { type: Number, required: true },
  title: { type: String, required: true },
  theme: { type: String, required: true },
  attractions: [AttractionStopSchema],
  recommendedStayId: { type: Schema.Types.ObjectId, ref: 'Hotel' },
  recommendedHotelName: { type: String, default: 'Address Downtown Dubai' },
  estimatedDrivingKm: { type: Number, default: 15 },
  transitAdvice: { type: String, default: 'Dubai Metro Red Line & RTA Taxi' }
});

const ItinerarySchema = new Schema<IItinerary>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    destinationCity: { type: String, default: 'Dubai' },
    visaType: { type: String, default: '10-Day Tourist Visa' },
    totalDays: { type: Number, default: 10 },
    days: [DayPlanSchema],
    isOfficialTemplate: { type: Boolean, default: false },
    totalEstimatedCostAed: { type: Number, default: 4500 }
  },
  { timestamps: true }
);

export const Itinerary = mongoose.model<IItinerary>('Itinerary', ItinerarySchema);

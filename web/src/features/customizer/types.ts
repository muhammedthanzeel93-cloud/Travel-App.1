export interface AttractionStop {
  name: string;
  category: string;
  image: string;
  entryFeeAed: number;
  tips: string;
}

export interface DayItineraryCluster {
  dayNumber: number;
  title: string;
  theme: string;
  hotel: string;
  drivingKm: number;
  transitAdvice: string;
  attractions: AttractionStop[];
}

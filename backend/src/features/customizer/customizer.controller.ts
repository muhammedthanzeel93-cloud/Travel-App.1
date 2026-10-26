import { Request, Response } from 'express';
import { Itinerary } from './itinerary.model.js';

export class CustomizerController {
  public static async getDubai10DayItinerary(req: Request, res: Response): Promise<void> {
    try {
      const defaultDubaiPlan = {
        title: 'Dubai 10-Day Complete Discovery & Visa Roadmap',
        destinationCity: 'Dubai, UAE',
        visaType: '10-Day Tourist Visa',
        totalDays: 10,
        totalEstimatedCostAed: 4850,
        days: [
          {
            dayNumber: 1,
            title: 'Arrival & Downtown Glamour',
            theme: 'Iconic Architecture & Fountain Shows',
            recommendedHotelName: 'Address Downtown Dubai',
            estimatedDrivingKm: 16.5,
            transitAdvice: 'Red Line Metro to Burj Khalifa / Dubai Mall Station',
            attractions: [
              {
                name: 'Burj Khalifa (At The Top Level 148)',
                category: 'ICONIC_LANDMARK',
                coordinates: { lat: 25.1972, lng: 55.2744 },
                recommendedDurationHours: 2.5,
                image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
                entryFeeAed: 399,
                tips: 'Book sunset slot (17:30) for golden hour photos across the Arabian Gulf.'
              },
              {
                name: 'The Dubai Mall & Dubai Aquarium',
                category: 'SHOPPING_DINING',
                coordinates: { lat: 25.1985, lng: 55.2796 },
                recommendedDurationHours: 3,
                image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80',
                entryFeeAed: 199,
                tips: 'Catch the 18:00 Fountain show from the Apple Store balcony.'
              }
            ]
          },
          {
            dayNumber: 2,
            title: 'Old Dubai & Heritage Souks',
            theme: 'Culture, Spice & Gold Tradewinds',
            recommendedHotelName: 'Al Seef Heritage Hotel Curio',
            estimatedDrivingKm: 12.0,
            transitAdvice: 'Traditional Abra boat across Dubai Creek (AED 1 cash)',
            attractions: [
              {
                name: 'Al Fahidi Historical Neighborhood',
                category: 'CULTURE_HERITAGE',
                coordinates: { lat: 25.2631, lng: 55.2972 },
                recommendedDurationHours: 2,
                image: 'https://images.unsplash.com/photo-1578895101408-1a36b834405b?auto=format&fit=crop&w=800&q=80',
                entryFeeAed: 0,
                tips: 'Sample authentic Karak tea at Arabian Tea House.'
              },
              {
                name: 'Dubai Gold & Spice Souk',
                category: 'CULTURE_HERITAGE',
                coordinates: { lat: 25.2673, lng: 55.2991 },
                recommendedDurationHours: 2.5,
                image: 'https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&w=800&q=80',
                entryFeeAed: 0,
                tips: 'Politely bargain for saffron and certified gold jewelry.'
              }
            ]
          },
          {
            dayNumber: 3,
            title: 'Palm Jumeirah & Coastal Luxury',
            theme: 'Man-Made Wonder & Aquaventure',
            recommendedHotelName: 'Atlantis The Royal',
            estimatedDrivingKm: 28.0,
            transitAdvice: 'Palm Monorail from Gateway Station to Atlantis',
            attractions: [
              {
                name: 'The View at The Palm (Level 52)',
                category: 'ICONIC_LANDMARK',
                coordinates: { lat: 25.1147, lng: 55.1396 },
                recommendedDurationHours: 2,
                image: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80',
                entryFeeAed: 125,
                tips: 'Offers 360-degree vistas of the entire Palm archipelago.'
              },
              {
                name: 'Atlantis Aquaventure Waterpark',
                category: 'ADVENTURE',
                coordinates: { lat: 25.1332, lng: 55.1203 },
                recommendedDurationHours: 4.5,
                image: 'https://images.unsplash.com/photo-1574958269340-fa927503f3dd?auto=format&fit=crop&w=800&q=80',
                entryFeeAed: 345,
                tips: 'World’s largest waterpark; wear aqua socks to navigate hot sun pavers.'
              }
            ]
          },
          {
            dayNumber: 4,
            title: 'Arabian Desert Conservation Reserve',
            theme: 'Dune Bashing, Camel Treks & Starry Camp',
            recommendedHotelName: 'Bab Al Shams Desert Resort',
            estimatedDrivingKm: 65.0,
            transitAdvice: 'Licensed 4x4 Land Cruiser Hotel Pickup',
            attractions: [
              {
                name: 'Red Dunes Desert Safari & Sandboarding',
                category: 'ADVENTURE',
                coordinates: { lat: 24.9602, lng: 55.5901 },
                recommendedDurationHours: 5,
                image: 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?auto=format&fit=crop&w=800&q=80',
                entryFeeAed: 220,
                tips: 'Includes Tanoura dance, henna art, and traditional BBQ dinner under the desert stars.'
              }
            ]
          },
          {
            dayNumber: 5,
            title: 'Dubai Marina & JBR Beach Walk',
            theme: 'Yacht Cruising & Promenade Dining',
            recommendedHotelName: 'Ritz-Carlton Dubai JBR',
            estimatedDrivingKm: 22.0,
            transitAdvice: 'Dubai Tram loop connecting Marina Towers and JBR',
            attractions: [
              {
                name: 'Dubai Marina Luxury Yacht Cruise',
                category: 'BEACH_LEISURE',
                coordinates: { lat: 25.0784, lng: 55.1378 },
                recommendedDurationHours: 2.5,
                image: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=800&q=80',
                entryFeeAed: 260,
                tips: 'Glides through Bluewaters Island and Ain Dubai.'
              }
            ]
          },
          {
            dayNumber: 6,
            title: 'Future Tech & Global Culture',
            theme: 'Museum of the Future & Global Village',
            recommendedHotelName: '25hours Hotel One Central',
            estimatedDrivingKm: 34.0,
            transitAdvice: 'Metro Red Line (Emirates Towers Station)',
            attractions: [
              {
                name: 'Museum of the Future',
                category: 'ICONIC_LANDMARK',
                coordinates: { lat: 25.2192, lng: 55.2819 },
                recommendedDurationHours: 3,
                image: 'https://images.unsplash.com/photo-1658826723326-1b777a8342ca?auto=format&fit=crop&w=800&q=80',
                entryFeeAed: 149,
                tips: 'Tickets must be booked at least 2 weeks in advance.'
              },
              {
                name: 'Global Village Cultural Pavilions',
                category: 'CULTURE_HERITAGE',
                coordinates: { lat: 25.0682, lng: 55.3052 },
                recommendedDurationHours: 4,
                image: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=800&q=80',
                entryFeeAed: 25,
                tips: 'Experience cuisines and crafts from 90+ countries in one venue.'
              }
            ]
          },
          {
            dayNumber: 7,
            title: 'Day Excursion: Abu Dhabi Sheikh Zayed Grand Mosque',
            theme: 'White Marble Splendor & Louvre Abu Dhabi',
            recommendedHotelName: 'Emirates Palace Mandarin Oriental',
            estimatedDrivingKm: 130.0,
            transitAdvice: 'E101 Express Coach from Ibn Battuta or Private Chauffeur',
            attractions: [
              {
                name: 'Sheikh Zayed Grand Mosque',
                category: 'CULTURE_HERITAGE',
                coordinates: { lat: 24.4128, lng: 54.475 },
                recommendedDurationHours: 3,
                image: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=800&q=80',
                entryFeeAed: 0,
                tips: 'Strict modest dress code enforced. Free admission with pre-registration.'
              }
            ]
          },
          {
            dayNumber: 8,
            title: 'Miracle Garden & Souk Madinat Jumeirah',
            theme: 'Floral Tapestries & Burj Al Arab Canals',
            recommendedHotelName: 'Jumeirah Al Qasr',
            estimatedDrivingKm: 24.0,
            transitAdvice: 'RTA Bus 105 from Mall of the Emirates directly to Miracle Garden',
            attractions: [
              {
                name: 'Dubai Miracle Garden',
                category: 'ICONIC_LANDMARK',
                coordinates: { lat: 25.0598, lng: 55.2443 },
                recommendedDurationHours: 2.5,
                image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
                entryFeeAed: 95,
                tips: '150 million blooming flowers arranged into Emirates A380 sculpture.'
              }
            ]
          },
          {
            dayNumber: 9,
            title: 'Hatta Mountain Escapade & Kayaking',
            theme: 'Hajar Mountains & Turquoise Dam',
            recommendedHotelName: 'JA Hatta Fort Hotel',
            estimatedDrivingKm: 135.0,
            transitAdvice: 'Hatta Express Bus H02 from Dubai Mall',
            attractions: [
              {
                name: 'Hatta Dam Kayaking & Heritage Village',
                category: 'ADVENTURE',
                coordinates: { lat: 24.7836, lng: 56.1264 },
                recommendedDurationHours: 4.5,
                image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
                entryFeeAed: 60,
                tips: 'Rent a single or double kayak to glide on emerald mountain waters.'
              }
            ]
          },
          {
            dayNumber: 10,
            title: 'Farewell Leisure & Airport Transfer',
            theme: 'Dubai Frame & Duty Free Shopping',
            recommendedHotelName: 'Dubai International Hotel (Airport Concourse)',
            estimatedDrivingKm: 15.0,
            transitAdvice: 'Red Line direct to Terminal 1 or 3',
            attractions: [
              {
                name: 'Dubai Frame (Zabeel Park)',
                category: 'ICONIC_LANDMARK',
                coordinates: { lat: 25.2355, lng: 55.3003 },
                recommendedDurationHours: 2,
                image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80',
                entryFeeAed: 50,
                tips: 'Walk the 150m-high glass bridge connecting Old and New Dubai.'
              }
            ]
          }
        ]
      };

      res.status(200).json({ success: true, itinerary: defaultDubaiPlan });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async saveCustomItinerary(req: Request, res: Response): Promise<void> {
    try {
      const { title, days, destinationCity = 'Dubai', totalEstimatedCostAed } = req.body;
      const itinerary = await Itinerary.create({
        title: title || 'My Customized Dubai Trip',
        destinationCity,
        days,
        totalDays: days?.length || 10,
        totalEstimatedCostAed: totalEstimatedCostAed || 4850,
        isOfficialTemplate: false
      });

      res.status(201).json({ success: true, message: 'Custom itinerary saved successfully!', itinerary });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

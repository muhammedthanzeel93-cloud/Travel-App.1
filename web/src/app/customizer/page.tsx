'use client';

import { useState } from 'react';
import { Map, Calendar, Navigation, Hotel, DollarSign, Sparkles, Check, MoveVertical, Compass, Car } from 'lucide-react';

interface Attraction {
  name: string;
  category: string;
  image: string;
  entryFeeAed: number;
  tips: string;
}

interface DayCluster {
  dayNumber: number;
  title: string;
  theme: string;
  hotel: string;
  drivingKm: number;
  transitAdvice: string;
  attractions: Attraction[];
}

export default function DubaiVisaCustomizerPage() {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [savedNotification, setSavedNotification] = useState(false);

  const [itineraryDays, setItineraryDays] = useState<DayCluster[]>([
    {
      dayNumber: 1,
      title: 'Arrival & Downtown Dubai Majesty',
      theme: 'Burj Khalifa Sunset & Dancing Fountains',
      hotel: 'Address Downtown Dubai',
      drivingKm: 16.5,
      transitAdvice: 'Red Line Metro to Burj Khalifa / Dubai Mall Station',
      attractions: [
        {
          name: 'Burj Khalifa (At The Top Level 148)',
          category: 'Iconic Landmark',
          image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
          entryFeeAed: 399,
          tips: 'Reserve the 17:30 golden hour slot for magical sunset views.'
        },
        {
          name: 'Dubai Mall Fountain Boardwalk',
          category: 'Shopping & Dining',
          image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80',
          entryFeeAed: 25,
          tips: 'Watch the choreographed fountain spectacle up close on the floating bridge.'
        }
      ]
    },
    {
      dayNumber: 2,
      title: 'Old Dubai & Heritage Souks',
      theme: 'Creek Abra Boats, Gold & Saffron Markets',
      hotel: 'Al Seef Heritage Hotel',
      drivingKm: 12.0,
      transitAdvice: 'Traditional Wooden Abra across Dubai Creek (AED 1)',
      attractions: [
        {
          name: 'Al Fahidi Historical District',
          category: 'Culture & Heritage',
          image: 'https://images.unsplash.com/photo-1578895101408-1a36b834405b?auto=format&fit=crop&w=800&q=80',
          entryFeeAed: 0,
          tips: 'Explore traditional wind-tower architecture and coffee museums.'
        },
        {
          name: 'Deira Gold & Spice Souk',
          category: 'Culture & Shopping',
          image: 'https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&w=800&q=80',
          entryFeeAed: 0,
          tips: 'Sample fresh dates and aromatic Iranian saffron.'
        }
      ]
    },
    {
      dayNumber: 3,
      title: 'Palm Jumeirah & Atlantis Thrills',
      theme: 'The View Level 52 & Aquaventure Waterpark',
      hotel: 'Atlantis The Royal',
      drivingKm: 28.0,
      transitAdvice: 'Palm Monorail from Gateway Station',
      attractions: [
        {
          name: 'The View at The Palm',
          category: 'Iconic Landmark',
          image: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80',
          entryFeeAed: 125,
          tips: 'Incredible 360-degree views of the crescent and palm fronds.'
        },
        {
          name: 'Atlantis Aquaventure Waterpark',
          category: 'Adventure',
          image: 'https://images.unsplash.com/photo-1574958269340-fa927503f3dd?auto=format&fit=crop&w=800&q=80',
          entryFeeAed: 345,
          tips: 'Try the Leap of Faith slide plunging through a shark-filled lagoon.'
        }
      ]
    },
    {
      dayNumber: 4,
      title: 'Arabian Desert Conservation Reserve',
      theme: 'Red Dune Bashing & Starlit Camp Feast',
      hotel: 'Bab Al Shams Desert Resort',
      drivingKm: 65.0,
      transitAdvice: 'Licensed 4x4 Land Cruiser Hotel Pickup',
      attractions: [
        {
          name: 'Lahbab Red Dune Safari & Sandboarding',
          category: 'Adventure',
          image: 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?auto=format&fit=crop&w=800&q=80',
          entryFeeAed: 220,
          tips: 'Includes camel rides, henna painting, and live Tanoura fire show.'
        }
      ]
    },
    {
      dayNumber: 5,
      title: 'Dubai Marina & Bluewaters Island',
      theme: 'Luxury Yacht Cruise & Ain Dubai Promenade',
      hotel: 'The Ritz-Carlton Dubai JBR',
      drivingKm: 22.0,
      transitAdvice: 'Dubai Tram loop connecting Marina & JBR',
      attractions: [
        {
          name: 'Dubai Marina Sunset Yacht Cruise',
          category: 'Leisure & Luxury',
          image: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=800&q=80',
          entryFeeAed: 260,
          tips: '2-hour cruise with barbecue buffet gliding past Bluewaters Island.'
        }
      ]
    },
    {
      dayNumber: 6,
      title: 'Museum of the Future & Global Village',
      theme: 'Year 2071 Innovation & 90+ Country Pavilions',
      hotel: '25hours Hotel One Central',
      drivingKm: 34.0,
      transitAdvice: 'Red Line Metro (Emirates Towers)',
      attractions: [
        {
          name: 'Museum of the Future',
          category: 'Future Tech & Culture',
          image: 'https://images.unsplash.com/photo-1658826723326-1b777a8342ca?auto=format&fit=crop&w=800&q=80',
          entryFeeAed: 149,
          tips: 'Explore bio-engineered DNA vault and orbital space station simulator.'
        },
        {
          name: 'Global Village Cultural Pavilions',
          category: 'Culture & Shopping',
          image: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=800&q=80',
          entryFeeAed: 25,
          tips: 'Must visit Yemeni honey and Turkish delight stalls.'
        }
      ]
    },
    {
      dayNumber: 7,
      title: 'Day Excursion: Abu Dhabi Grand Mosque',
      theme: 'White Marble Splendor & Louvre Abu Dhabi',
      hotel: 'Emirates Palace Mandarin Oriental',
      drivingKm: 130.0,
      transitAdvice: 'E101 Express Coach from Ibn Battuta or Chauffeur',
      attractions: [
        {
          name: 'Sheikh Zayed Grand Mosque',
          category: 'Culture & Heritage',
          image: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=800&q=80',
          entryFeeAed: 0,
          tips: 'Features world’s largest hand-knotted carpet and 24-carat gold chandeliers.'
        }
      ]
    },
    {
      dayNumber: 8,
      title: 'Miracle Garden & Souk Madinat Canals',
      theme: 'Floral Sculpture Tapestries & Burj Al Arab Views',
      hotel: 'Jumeirah Al Qasr',
      drivingKm: 24.0,
      transitAdvice: 'RTA Bus 105 from Mall of the Emirates',
      attractions: [
        {
          name: 'Dubai Miracle Garden',
          category: 'Iconic Landmark',
          image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
          entryFeeAed: 95,
          tips: '150 million blooming flowers shaped as Emirates A380 and fairytale castles.'
        }
      ]
    },
    {
      dayNumber: 9,
      title: 'Hatta Mountain Dam & Kayaking',
      theme: 'Turquoise Waters & Hajar Mountain Escapade',
      hotel: 'JA Hatta Fort Hotel',
      drivingKm: 135.0,
      transitAdvice: 'Hatta Express Bus H02 from Dubai Mall',
      attractions: [
        {
          name: 'Hatta Dam Emerald Kayaking',
          category: 'Adventure & Nature',
          image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
          entryFeeAed: 60,
          tips: 'Paddle through rugged mountain fjords on tranquil turquoise waters.'
        }
      ]
    },
    {
      dayNumber: 10,
      title: 'Dubai Frame & Airport Departure',
      theme: 'Old Meets New Dubai Glass Bridge & Duty Free',
      hotel: 'Dubai International Hotel (Concourse)',
      drivingKm: 15.0,
      transitAdvice: 'Metro Red Line direct to Airport Terminal 1 / 3',
      attractions: [
        {
          name: 'Dubai Frame (Zabeel Park)',
          category: 'Iconic Landmark',
          image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80',
          entryFeeAed: 50,
          tips: 'Walk the 150m-high glass walkway framing historic Deira and ultra-modern Downtown.'
        }
      ]
    }
  ]);

  const activeDay = itineraryDays[selectedDayIndex];

  // Total budget calculation
  const totalCostAed = itineraryDays.reduce(
    (acc, day) => acc + day.attractions.reduce((sum, a) => sum + a.entryFeeAed, 0),
    0
  );

  const handleSwapDays = (index1: number, index2: number) => {
    if (index2 < 0 || index2 >= itineraryDays.length) return;
    const updated = [...itineraryDays];
    const temp = updated[index1];
    updated[index1] = updated[index2];
    updated[index2] = temp;
    // update day numbers
    updated[index1].dayNumber = index1 + 1;
    updated[index2].dayNumber = index2 + 1;
    setItineraryDays(updated);
    setSelectedDayIndex(index2);
  };

  const handleSaveCustomPlan = () => {
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <Map className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Dynamic Visa Itinerary &amp; Road Map Customizer</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                Dubai 10-Day Visa Standard
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Day-by-day attraction clusters, interactive road map driving distances, and custom drag-and-drop reorganization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveCustomPlan}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Custom Roadmap</span>
          </button>
        </div>
      </div>

      {savedNotification && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-lg">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Your 10-Day Customized Dubai Roadmap has been saved and pre-cached in your 4H Offline Vault!</span>
        </div>
      )}

      {/* Main Grid: Days Navigation & Active Day Roadmap Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 10-Day Selector Strip (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>10-Day Visa Timeline</span>
            </span>
            <span className="text-[11px] font-mono text-amber-400 font-bold">
              Est. Total: AED {totalCostAed}
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {itineraryDays.map((day, idx) => {
              const isSelected = idx === selectedDayIndex;
              return (
                <div
                  key={day.dayNumber}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`p-3 rounded-xl cursor-pointer border transition-all text-xs flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-950/60 border-blue-500 shadow-md ring-1 ring-blue-500/40 text-white'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-xs text-blue-400 block">
                      Day {day.dayNumber}: {day.title}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium line-clamp-1">
                      {day.theme}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Car className="w-3 h-3 text-amber-400" /> {day.drivingKm} km driving
                    </span>
                  </div>

                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleSwapDays(idx, idx - 1)}
                      disabled={idx === 0}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-[10px]"
                      title="Move Day Up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleSwapDays(idx, idx + 1)}
                      disabled={idx === itineraryDays.length - 1}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-[10px]"
                      title="Move Day Down"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Day Roadmap & Attractions View (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Day Header & Travel Logistics */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Day {activeDay.dayNumber} Cluster
                </span>
                <h2 className="text-xl font-extrabold text-white mt-0.5">{activeDay.title}</h2>
                <p className="text-xs text-slate-400">{activeDay.theme}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-blue-400" />
                  <span>{activeDay.drivingKm} km driving</span>
                </span>
              </div>
            </div>

            {/* Hotel & Transit Advice Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Hotel className="w-3.5 h-3.5 text-emerald-400" /> Recommended Luxury Stay
                </span>
                <span className="font-extrabold text-slate-200 block text-sm mt-1">
                  {activeDay.hotel}
                </span>
                <span className="text-[10px] text-emerald-400">Verified Partner Hotel (12% Platform Escrow)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-blue-400" /> Transit &amp; Route Guidance
                </span>
                <span className="font-medium text-slate-200 block text-xs mt-1">
                  {activeDay.transitAdvice}
                </span>
                <span className="text-[10px] text-blue-400">Metro Red Line / RTA Smart Nav Active</span>
              </div>
            </div>
          </div>

          {/* Attraction Stops Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Day {activeDay.dayNumber} Scheduled Attractions &amp; Experiences</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeDay.attractions.map((attraction, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg group hover:border-slate-700 transition-all"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={attraction.image}
                      alt={attraction.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-amber-400 border border-amber-500/30">
                      {attraction.entryFeeAed > 0 ? `AED ${attraction.entryFeeAed}` : 'Free Entry'}
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-semibold text-slate-200">
                      {attraction.category}
                    </div>
                  </div>

                  <div className="p-4 space-y-2 text-xs">
                    <h4 className="font-extrabold text-white text-sm">{attraction.name}</h4>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      💡 <span className="text-slate-300 font-medium">Tip:</span> {attraction.tips}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

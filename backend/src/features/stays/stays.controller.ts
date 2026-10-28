import { Request, Response } from 'express';
import { Hotel, Room, RoomBooking } from './stay.model.js';

export class StaysController {
  public static async getHotels(req: Request, res: Response): Promise<void> {
    try {
      const mockHotels = [
        {
          _id: 'hotel_1',
          name: 'Address Downtown Dubai',
          city: 'Dubai',
          address: 'Downtown Dubai, Sheikh Mohammed bin Rashid Blvd',
          starRating: 5,
          verificationStatus: 'VERIFIED',
          bannerImages: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'
          ],
          amenities: ['Infinity Pool facing Burj Khalifa', 'Luxury Spa', 'Free High-Speed WiFi', 'Airport Chauffeur'],
          rooms: [
            {
              _id: 'room_101',
              roomType: 'Deluxe Fountain View Suite',
              basePricePerNight: 1250,
              photosWithHighlights: [
                {
                  url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
                  label: 'Direct Burj Fountain View 🌊',
                  isApprovedBadge: true
                },
                {
                  url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
                  label: 'Deep Soaking Jacuzzi Tub 🛁',
                  isApprovedBadge: true
                },
                {
                  url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
                  label: 'King Orthopedic Bed 🛏️',
                  isApprovedBadge: true
                }
              ],
              packages: [
                {
                  packageName: '3-Day Luxury City Package',
                  durationNights: 3,
                  includedAmenities: ['Daily International Buffet Breakfast', 'Burj Khalifa Fast-Track Entry', 'AED 200 Spa Voucher'],
                  packagePrice: 3450,
                  discountPercentage: 15
                }
              ]
            }
          ]
        },
        {
          _id: 'hotel_2',
          name: 'The Raviz Kadavu Luxury Resort',
          city: 'Calicut',
          address: 'NH 17, Calicut Bypass Road, Azhinjillam',
          starRating: 5,
          verificationStatus: 'VERIFIED',
          bannerImages: [
            'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80'
          ],
          amenities: ['Chaliyar River View', 'Ayurveda Spa', 'Infinity Pool', 'Houseboat Dining'],
          rooms: [
            {
              _id: 'room_201',
              roomType: 'Heritage Riverview Cottage',
              basePricePerNight: 4800,
              photosWithHighlights: [
                {
                  url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
                  label: 'Open-to-Sky Rain Shower 🚿',
                  isApprovedBadge: true
                }
              ],
              packages: [
                {
                  packageName: 'Ayurvedic Rejuvenation 2-Night Stay',
                  durationNights: 2,
                  includedAmenities: ['Daily Abhyanga Herbal Massage', 'Traditional Kerala Sadya Breakfast', 'Evening River Cruise'],
                  packagePrice: 11999,
                  discountPercentage: 12
                }
              ]
            }
          ]
        }
      ];

      res.status(200).json({ success: true, count: mockHotels.length, hotels: mockHotels });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async bookStayPackage(req: Request, res: Response): Promise<void> {
    try {
      const { hotelId, roomId, packagePrice = 3450 } = req.body;

      const commissionRate = 0.12;
      const platformCommission = Math.round(packagePrice * commissionRate);
      const hostPayout = packagePrice - platformCommission;

      const bookingRef = `STAY-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const voucherCode = `VCHR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      res.status(201).json({
        success: true,
        message: 'Stay booked successfully!',
        bookingReference: bookingRef,
        hotelVoucherCode: voucherCode,
        platformCommission,
        hostPayout
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

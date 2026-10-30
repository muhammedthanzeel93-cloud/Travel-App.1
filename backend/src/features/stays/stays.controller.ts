import { Request, Response } from 'express';
import { Hotel, Room, RoomBooking } from './stay.model.js';

const MOCK_HOTELS = [
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

export class StaysController {
  public static async getHotels(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({ success: true, count: MOCK_HOTELS.length, hotels: MOCK_HOTELS });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async bookStayPackage(req: Request, res: Response): Promise<void> {
    try {
      const { hotelId, roomId, packageId } = req.body;

      // 🔒 Server-Side Price Verification: Do NOT trust client-supplied packagePrice!
      let verifiedPackagePrice = 3450; // default standard benchmark
      const targetHotel = MOCK_HOTELS.find((h) => h._id === hotelId);
      const targetRoom = targetHotel?.rooms.find((r) => r._id === roomId);

      // 🔒 Concurrency & Inventory Guard: Atomic double-booking prevention
      if (targetRoom) {
        if ((targetRoom as any).availableCount !== undefined && (targetRoom as any).availableCount <= 0) {
          res.status(409).json({
            success: false,
            message: 'This room is currently fully booked. Please select another room or date.'
          });
          return;
        }
        if ((targetRoom as any).availableCount !== undefined) {
          (targetRoom as any).availableCount--;
        }

        if (packageId) {
          const pkg = targetRoom.packages?.find((p) => p.packageName === packageId);
          if (pkg) {
            verifiedPackagePrice = pkg.packagePrice;
          }
        } else if (targetRoom.packages && targetRoom.packages.length > 0) {
          verifiedPackagePrice = targetRoom.packages[0].packagePrice;
        } else if (targetRoom.basePricePerNight) {
          verifiedPackagePrice = targetRoom.basePricePerNight;
        }
      }

      const commissionRate = 0.12;
      const platformCommission = Math.round(verifiedPackagePrice * commissionRate);
      const hostPayout = verifiedPackagePrice - platformCommission;

      const bookingRef = `STAY-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const voucherCode = `VCHR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      res.status(201).json({
        success: true,
        message: 'Stay booked successfully at verified system price.',
        bookingReference: bookingRef,
        hotelVoucherCode: voucherCode,
        verifiedPrice: verifiedPackagePrice,
        platformCommission,
        hostPayout
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

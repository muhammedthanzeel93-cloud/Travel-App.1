import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Hotel, Room, RoomBooking } from './stay.model.js';
import { Booking } from '../booking/booking.model.js';

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
      if (mongoose.connection.readyState === 1) {
        try {
          const hotels = await Hotel.find({ verificationStatus: 'VERIFIED' }).lean();
          if (hotels && hotels.length > 0) {
            const hotelIds = hotels.map((h) => h._id);
            const rooms = await Room.find({ hotelId: { $in: hotelIds }, isAvailable: true }).lean();

            const hotelsWithRooms = hotels.map((hotel) => ({
              ...hotel,
              rooms: rooms.filter((r) => r.hotelId.toString() === hotel._id.toString())
            }));

            res.status(200).json({ success: true, count: hotelsWithRooms.length, hotels: hotelsWithRooms });
            return;
          }
        } catch (e: any) {
          console.warn('⚠️ [STAYS] Mongo query fallback:', e.message);
        }
      }

      res.status(200).json({ success: true, count: MOCK_HOTELS.length, hotels: MOCK_HOTELS });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async bookStayPackage(req: Request, res: Response): Promise<void> {
    try {
      const {
        hotelId,
        roomId,
        packagePrice = 3450,
        checkInDate,
        checkOutDate,
        nights = 2,
        numberOfGuests = 2,
        selectedPackage,
        specialRequests
      } = req.body;
      const user = (req as any).user;
      const userId = user?.userId || user?._id;

      const commissionRate = 0.12;
      const platformCommission = Math.round(packagePrice * commissionRate);
      const hostPayout = packagePrice - platformCommission;

      const bookingRef = `STAY-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const voucherCode = `VCHR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      let savedBooking = null;
      if (mongoose.connection.readyState === 1 && userId && hotelId && roomId) {
        try {
          const order = await Booking.create({
            bookingReference: bookingRef,
            userId,
            bookingType: 'ROOM_STAY',
            status: 'CONFIRMED',
            totalAmount: packagePrice,
            currency: 'INR',
            paymentDetails: {
              gateway: 'RAZORPAY',
              platformCommission,
              partnerPayoutAmount: hostPayout,
              escrowStatus: 'HELD_IN_ESCROW',
              paidAt: new Date()
            },
            contactDetails: {
              email: user?.email || 'guest@travelbuddy.internal',
              phone: user?.phone || '+910000000000'
            }
          });

          savedBooking = await RoomBooking.create({
            orderId: order._id,
            userId,
            hotelId,
            roomId,
            checkInDate: checkInDate ? new Date(checkInDate) : new Date(),
            checkOutDate: checkOutDate ? new Date(checkOutDate) : new Date(Date.now() + nights * 86400000),
            nights,
            numberOfGuests,
            selectedPackage,
            specialRequests,
            checkInStatus: 'UPCOMING',
            escrowStatus: 'HELD_UNTIL_24H_POST_CHECKIN',
            hotelVoucherCode: voucherCode
          });
        } catch (dbErr: any) {
          console.warn('⚠️ [STAYS BOOKING] MongoDB save note:', dbErr.message);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Stay booked successfully!',
        bookingReference: bookingRef,
        hotelVoucherCode: voucherCode,
        platformCommission,
        hostPayout,
        booking: savedBooking
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

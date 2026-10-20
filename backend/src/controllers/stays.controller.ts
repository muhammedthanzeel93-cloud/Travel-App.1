import { Request, Response } from 'express';
import { Hotel, Room, RoomBooking } from '../models/Stay.js';
import { Booking } from '../models/Booking.js';

export class StaysController {
  /**
   * Search Hotels & Stays with photo highlights
   */
  public static async getHotels(req: Request, res: Response): Promise<void> {
    try {
      const { city = 'Dubai' } = req.query;

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
          address: 'NH 17, Calicut Bypass Road, Kozhikode',
          starRating: 5,
          verificationStatus: 'VERIFIED',
          bannerImages: [
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'
          ],
          amenities: ['Chaliyar Riverfront Lawn', 'Ayurvedic Wellness Spa', 'Infinity Pool', 'Houseboat Dining'],
          rooms: [
            {
              _id: 'room_201',
              roomType: 'Heritage Riverview Cottage',
              basePricePerNight: 5500,
              photosWithHighlights: [
                {
                  url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
                  label: 'Serene Chaliyar River View 🛶',
                  isApprovedBadge: true
                },
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

  /**
   * Book Room Stay & Hold Escrow until 24h post-check-in
   */
  public static async bookStayPackage(req: Request, res: Response): Promise<void> {
    try {
      const { userId, hotelId, roomId, checkInDate, checkOutDate, nights = 3, packagePrice = 3450 } = req.body;

      const commissionRate = 0.12; // 12% platform fee
      const platformCommission = Math.round(packagePrice * commissionRate);
      const hostPayout = packagePrice - platformCommission;

      const bookingRef = `STAY-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const booking = await Booking.create({
        bookingReference: bookingRef,
        userId: userId || '65f123456789012345678901',
        bookingType: 'ROOM_STAY',
        status: 'PAID',
        totalAmount: packagePrice,
        currency: 'AED',
        paymentDetails: {
          gateway: 'STRIPE',
          paidAt: new Date(),
          platformCommission,
          partnerPayoutAmount: hostPayout,
          escrowStatus: 'HELD_IN_ESCROW'
        },
        contactDetails: {
          email: 'traveler@example.com',
          phone: '+971 50 123 4567'
        }
      });

      const voucherCode = `VCHR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      res.status(201).json({
        success: true,
        message: 'Stay booked successfully! Funds held in escrow until 24 hours post-check-in.',
        bookingReference: booking.bookingReference,
        hotelVoucherCode: voucherCode,
        platformCommission,
        hostPayout
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

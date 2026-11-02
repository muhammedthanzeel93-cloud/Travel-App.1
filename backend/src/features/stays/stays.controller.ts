import { Request, Response } from 'express';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware.js';
import { Hotel, Room, RoomBooking } from './stay.model.js';

const isValidDate = (value: unknown): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value));

export class StaysController {
  public static async getHotels(_req: Request, res: Response): Promise<void> {
    try {
      const hotels = await Hotel.find({ verificationStatus: 'VERIFIED' }).sort({ name: 1 }).limit(200).lean();
      const rooms = await Room.find({ hotelId: { $in: hotels.map((hotel) => hotel._id) }, isAvailable: true }).lean();
      const roomsByHotel = new Map<string, any[]>();
      for (const room of rooms) {
        const key = room.hotelId.toString();
        roomsByHotel.set(key, [...(roomsByHotel.get(key) || []), room]);
      }
      const result = hotels.map((hotel) => ({ ...hotel, _id: hotel._id.toString(), rooms: roomsByHotel.get(hotel._id.toString()) || [] }));
      res.status(200).json({ success: true, count: result.length, hotels: result });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load available stays.' });
    }
  }

  public static async bookStayPackage(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    let reservedRoomId: string | undefined;
    try {
      const { hotelId, roomId, packageId, checkInDate, checkOutDate, numberOfGuests = 1, specialRequests = '' } = req.body || {};
      if (!userId || !mongoose.isValidObjectId(hotelId) || !mongoose.isValidObjectId(roomId) || !isValidDate(checkInDate) || !isValidDate(checkOutDate)) {
        res.status(400).json({ success: false, message: 'Hotel, room, check-in and check-out are required.' });
        return;
      }
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);
      if (nights < 1 || nights > 90 || checkIn.getTime() < Date.now() - 86400000 || !Number.isInteger(numberOfGuests) || numberOfGuests < 1 || numberOfGuests > 20 || typeof specialRequests !== 'string' || specialRequests.length > 1000) {
        res.status(400).json({ success: false, message: 'Booking dates, guest count or special requests are invalid.' });
        return;
      }

      const hotel = await Hotel.findOne({ _id: hotelId, verificationStatus: 'VERIFIED' }).select('hostId name');
      const room = await Room.findOne({ _id: roomId, hotelId, isAvailable: true });
      if (!hotel || !room || numberOfGuests > room.maxGuests) {
        res.status(404).json({ success: false, message: 'Stay or room is unavailable.' });
        return;
      }

      const selectedPackage = packageId ? room.packages.find((item) => item.packageName === String(packageId)) : undefined;
      if (packageId && !selectedPackage) {
        res.status(400).json({ success: false, message: 'Selected package is not available for this room.' });
        return;
      }
      if (selectedPackage && nights !== selectedPackage.durationNights) {
        res.status(400).json({ success: false, message: 'Stay length does not match the selected package.' });
        return;
      }
      const verifiedPrice = selectedPackage ? selectedPackage.packagePrice : room.basePricePerNight * nights;
      const platformCommission = Math.round(verifiedPrice * 0.12);
      const hostPayout = verifiedPrice - platformCommission;

      const reservation = await Room.updateOne({ _id: roomId, hotelId, isAvailable: true, availableCount: { $gt: 0 } }, { $inc: { availableCount: -1 } });
      if (!reservation.modifiedCount) {
        res.status(409).json({ success: false, message: 'This room is no longer available.' });
        return;
      }
      reservedRoomId = String(roomId);

      const bookingReference = 'STAY-' + new Date().getFullYear() + '-' + randomBytes(4).toString('hex').toUpperCase();
      const hotelVoucherCode = 'VCHR-' + randomBytes(5).toString('hex').toUpperCase();
      try {
        const booking = await RoomBooking.create({
          userId, hotelId, roomId, checkInDate: checkIn, checkOutDate: checkOut, nights,
          numberOfGuests, selectedPackage: selectedPackage?.packageName,
          specialRequests: specialRequests.trim(), checkInStatus: 'UPCOMING',
          escrowStatus: 'HELD_UNTIL_24H_POST_CHECKIN', bookingReference, hotelVoucherCode,
          verifiedPrice, platformCommission, hostPayout
        });
        res.status(201).json({
          success: true, message: 'Stay reservation confirmed.', bookingId: booking._id.toString(),
          bookingReference, hotelVoucherCode, verifiedPrice, platformCommission, hostPayout
        });
        reservedRoomId = undefined;
      } catch (error) {
        await Room.updateOne({ _id: reservedRoomId }, { $inc: { availableCount: 1 } });
        reservedRoomId = undefined;
        throw error;
      }
    } catch (error) {
      console.error('[STAYS] Booking write failed:', error instanceof Error ? error.message : 'unknown error');
      if (reservedRoomId) await Room.updateOne({ _id: reservedRoomId }, { $inc: { availableCount: 1 } }).catch(() => {});
      if (!res.headersSent) res.status(500).json({ success: false, message: 'Unable to complete stay reservation.' });
    }
  }

  public static async getMyBookings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const bookings = await RoomBooking.find({ userId: req.user?.id })
        .populate('hotelId', 'name city address bannerImages')
        .populate('roomId', 'roomType')
        .sort({ createdAt: -1 }).limit(100).lean();
      res.status(200).json({ success: true, bookings });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load reservations.' });
    }
  }

  public static async cancelMyBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const bookingId = req.params.bookingId;
      if (!mongoose.isValidObjectId(bookingId)) {
        res.status(400).json({ success: false, message: 'A valid booking ID is required.' });
        return;
      }
      const booking = await RoomBooking.findOneAndUpdate({
        _id: bookingId, userId: req.user?.id, checkInStatus: 'UPCOMING', checkInDate: { $gt: new Date() }
      }, { $set: { checkInStatus: 'CANCELLED' } }, { new: true });
      if (!booking) {
        res.status(404).json({ success: false, message: 'Upcoming booking was not found or cannot be cancelled.' });
        return;
      }
      await Room.updateOne({ _id: booking.roomId, $expr: { $lt: ['$availableCount', '$totalRoomsCount'] } }, { $inc: { availableCount: 1 } });
      res.status(200).json({ success: true, message: 'Booking cancelled.' });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to cancel booking.' });
    }
  }
}

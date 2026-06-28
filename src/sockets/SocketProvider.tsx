import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { RootState } from '../store';
import { API_BASE_URL } from '../api/config';
import { normalizeRideOffer, RideRequest } from '../api/endpoints/ride';

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const token = useSelector((state: RootState) => state.auth.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketInstance = io(API_BASE_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    const removeOffer = (bookingId?: string) => {
      queryClient.setQueryData<RideRequest[]>(['pendingOffers'], (oldData) => {
        if (!Array.isArray(oldData)) return [];
        if (!bookingId) return [];
        return oldData.filter((offer) => offer._id !== bookingId);
      });
    };

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // ── New Ride Offer ──
    socketInstance.on('driver:new_offer', (payload) => {
      const offer = normalizeRideOffer(payload);
      queryClient.setQueryData<RideRequest[]>(['pendingOffers'], (oldData) => {
        const currentOffers = Array.isArray(oldData) ? oldData : [];
        return [offer, ...currentOffers.filter((item) => item._id !== offer._id)];
      });
      Toast.show({
        type: 'info',
        text1: 'New Ride Request',
        text2: 'Accept or decline the request before it expires.',
      });
    });

    // ── Offer Removed (accepted by another driver or expired) ──
    socketInstance.on('driver:offer_removed', (payload) => {
      removeOffer(payload?.bookingId);
      if (payload?.reason === 'accepted') {
        queryClient.invalidateQueries({ queryKey: ['activeRide'] });
        Toast.show({
          type: 'info',
          text1: 'Ride Taken',
          text2: 'This ride was accepted by another driver.',
        });
      } else if (payload?.reason === 'expired') {
        Toast.show({
          type: 'info',
          text1: 'Offer Expired',
          text2: 'The ride offer has expired.',
        });
      }
    });

    // ── Ride Accepted (by this driver) ──
    socketInstance.on('driver:booking:accepted', (payload) => {
      removeOffer(payload?.bookingId);
      queryClient.invalidateQueries({ queryKey: ['activeRide'] });
      Toast.show({
        type: 'success',
        text1: 'Ride Accepted!',
        text2: 'Navigate to the pickup location.',
      });
    });

    // ── Ride Rejected (by this driver) ──
    socketInstance.on('driver:booking:rejected', (payload) => {
      removeOffer(payload?.bookingId);
    });

    // ── Booking Cancelled ──
    socketInstance.on('booking:cancelled', (payload) => {
      removeOffer(payload?.bookingId);
      queryClient.invalidateQueries({ queryKey: ['activeRide'] });
      queryClient.invalidateQueries({ queryKey: ['pendingOffers'] });
      queryClient.invalidateQueries({ queryKey: ['driverStats'] });
      Toast.show({
        type: 'error',
        text1: 'Booking Cancelled',
        text2: payload?.reason || 'The booking has been cancelled.',
      });
    });

    // ── Booking Status Lifecycle Events (real-time status sync) ──
    const bookingStatusEvents = [
      'booking:store_assigned',
      'booking:driver_searching',
      'booking:driver_assigned',
      'booking:driver_arrived',
      'booking:picked_up',
      'booking:arrived_at_store',
      'booking:stored',
      'booking:return_requested',
      'booking:return_driver_assigned',
      'booking:out_for_return',
      'booking:arrived_for_delivery',
      'booking:delivered',
    ];

    bookingStatusEvents.forEach((event) => {
      socketInstance.on(event, (payload) => {
        // Refresh active ride and stats on any status change
        queryClient.invalidateQueries({ queryKey: ['activeRide'] });
        queryClient.invalidateQueries({ queryKey: ['driverStats'] });
      });
    });

    // ── Driver Status Changed (from admin or system) ──
    socketInstance.on('driver:status:changed', (payload) => {
      queryClient.invalidateQueries({ queryKey: ['driverProfile'] });
      if (payload?.is_online === false) {
        Toast.show({
          type: 'info',
          text1: 'Status Update',
          text2: 'You have been set offline by the system.',
        });
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.log('Socket connection error:', error.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.off('connect');
      socketInstance.off('disconnect');
      socketInstance.off('driver:new_offer');
      socketInstance.off('driver:offer_removed');
      socketInstance.off('driver:booking:accepted');
      socketInstance.off('driver:booking:rejected');
      socketInstance.off('booking:cancelled');
      socketInstance.off('driver:status:changed');
      socketInstance.off('connect_error');
      bookingStatusEvents.forEach((event) => socketInstance.off(event));
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, queryClient]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
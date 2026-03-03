import { Server as HTTPServer } from 'http';
import { Socket as ClientSocket } from 'socket.io-client';
import { Server as IOServer } from 'socket.io';

let io: IOServer | null = null;

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new IOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join user's personal room
    socket.on('join_room', (userId: string) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined room user_${userId}`);
    });

    // Admin joins conversation room
    socket.on('admin_join_conversation', (conversationId: string) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`Admin joined conversation: ${conversationId}`);
    });

    // User sends message
    socket.on('send_message', async (data: {
      conversationId: string;
      userId: string;
      content: string;
    }) => {
      // Broadcast to admin in conversation
      io?.to(`conversation_${data.conversationId}`).emit('receive_message', {
        ...data,
        senderType: 'user',
        createdAt: new Date(),
      });
    });

    // Admin sends message
    socket.on('admin_send_message', async (data: {
      conversationId: string;
      staffId: string;
      content: string;
    }) => {
      // Broadcast to user in their room
      io?.to(`conversation_${data.conversationId}`).emit('admin_message', {
        ...data,
        senderType: 'admin',
        createdAt: new Date(),
      });
    });

    // Typing indicator
    socket.on('typing', (conversationId: string) => {
      socket.broadcast.to(`conversation_${conversationId}`).emit('user_typing');
    });

    socket.on('stop_typing', (conversationId: string) => {
      socket.broadcast.to(`conversation_${conversationId}`).emit('user_stopped_typing');
    });

    // Close conversation
    socket.on('close_conversation', (conversationId: string) => {
      io?.to(`conversation_${conversationId}`).emit('conversation_closed');
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => io;

export type { ClientSocket };

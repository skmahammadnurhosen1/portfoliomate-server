import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Message } from '../models/Message.ts';

// In-memory fallback message store if database is offline during testing
const inMemoryMessages: any[] = [];

// Public: Submit contact inquiry
export async function submitContactMessage(req: Request, res: Response): Promise<void> {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    if (!firstName || !email || !message) {
      res.status(400).json({
        success: false,
        message: 'First name, email, and message are required fields.',
      });
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
      return;
    }

    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    if (mongoose.connection.readyState !== 1) {
      const fallbackMessage = {
        _id: `msg-${Date.now()}`,
        firstName: firstName.trim(),
        lastName: (lastName || '').trim(),
        email: email.trim().toLowerCase(),
        phone: (phone || '').trim(),
        message: message.trim(),
        isRead: false,
        isArchived: false,
        ip,
        userAgent,
        createdAt: new Date(),
      };
      inMemoryMessages.unshift(fallbackMessage);

      res.status(201).json({
        success: true,
        message: 'Thank you! Your message has been received successfully.',
        data: {
          id: fallbackMessage._id,
          createdAt: fallbackMessage.createdAt,
        },
      });
      return;
    }

    const newMessage = await Message.create({
      firstName: firstName.trim(),
      lastName: (lastName || '').trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || '').trim(),
      message: message.trim(),
      ip,
      userAgent,
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been received successfully.',
      data: {
        id: newMessage._id,
        createdAt: newMessage.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Message Controller] Error submitting contact message:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit message. Please try again later.',
    });
  }
}

// Admin: Get all contact messages
export async function getAdminMessages(_req: Request, res: Response): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      const unreadCount = inMemoryMessages.filter((m) => !m.isRead).length;
      res.status(200).json({
        success: true,
        count: inMemoryMessages.length,
        unreadCount,
        data: inMemoryMessages,
        isFallback: true,
      });
      return;
    }

    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .lean();

    const unreadCount = messages.filter((m) => !m.isRead).length;

    res.status(200).json({
      success: true,
      count: messages.length,
      unreadCount,
      data: messages,
    });
  } catch (error) {
    console.error('[Message Controller] Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve messages.' });
  }
}

// Admin: Mark message as read/unread
export async function toggleMessageRead(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { isRead } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const target = inMemoryMessages.find((m) => m._id === id);
      if (!target) {
        res.status(404).json({ success: false, message: 'Message not found.' });
        return;
      }
      target.isRead = typeof isRead === 'boolean' ? isRead : !target.isRead;
      res.status(200).json({
        success: true,
        message: `Message marked as ${target.isRead ? 'read' : 'unread'}.`,
        data: target,
      });
      return;
    }

    const message = await Message.findById(id);
    if (!message) {
      res.status(404).json({ success: false, message: 'Message not found.' });
      return;
    }

    message.isRead = typeof isRead === 'boolean' ? isRead : !message.isRead;
    await message.save();

    res.status(200).json({
      success: true,
      message: `Message marked as ${message.isRead ? 'read' : 'unread'}.`,
      data: message,
    });
  } catch (error) {
    console.error('[Message Controller] Error updating message status:', error);
    res.status(500).json({ success: false, message: 'Failed to update message status.' });
  }
}

// Admin: Delete contact message
export async function deleteMessage(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      const idx = inMemoryMessages.findIndex((m) => m._id === id);
      if (idx === -1) {
        res.status(404).json({ success: false, message: 'Message not found.' });
        return;
      }
      inMemoryMessages.splice(idx, 1);
      res.status(200).json({
        success: true,
        message: 'Message deleted successfully.',
        data: { id },
      });
      return;
    }

    const message = await Message.findByIdAndDelete(id);
    if (!message) {
      res.status(404).json({ success: false, message: 'Message not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully.',
      data: { id },
    });
  } catch (error) {
    console.error('[Message Controller] Error deleting message:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message.' });
  }
}

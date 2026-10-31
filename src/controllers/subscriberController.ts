import { Request, Response, NextFunction } from "express";
import { Subscriber } from "../models/Subscriber.js";
import { sendNewsletterEmail } from "../services/emailService.js";

/**
 * @desc Subscribe a new email to newsletter
 * @route POST /api/subscribers
 * @access Public
 */
export const subscribeEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, source } = req.body;

    if (!email || !email.includes("@")) {
      res.status(400).json({ success: false, message: "Please provide a valid email address." });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await Subscriber.findOne({ email: cleanEmail });

    if (existing) {
      if (!existing.isSubscribed) {
        existing.isSubscribed = true;
        await existing.save();
      }
      res.json({
        success: true,
        message: "You are already subscribed to the Aqua Pets newsletter!",
        subscriber: existing,
        data: existing,
      });
      return;
    }

    const newSubscriber = await Subscriber.create({
      email: cleanEmail,
      source: source || "Storefront Newsletter",
      isSubscribed: true,
    });

    res.status(201).json({
      success: true,
      message: "Thank you for subscribing! Your email has been added to our newsletter list.",
      subscriber: newSubscriber,
      data: newSubscriber,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * @desc Get all newsletter subscribers (Admin view)
 * @route GET /api/subscribers
 * @access Public / Admin
 */
export const getSubscribers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: subscribers.length,
      data: subscribers,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * @desc Send broadcast or targeted email to subscribers
 * @route POST /api/subscribers/send-email
 * @access Admin
 */
export const sendEmailToSubscribers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subject, message, recipientEmails } = req.body;

    if (!subject || !message) {
      res.status(400).json({ success: false, message: "Subject and message are required." });
      return;
    }

    let emailsToSend: string[] = [];

    if (Array.isArray(recipientEmails) && recipientEmails.length > 0) {
      emailsToSend = recipientEmails.map((e) => e.trim().toLowerCase());
    } else {
      const activeSubscribers = await Subscriber.find({ isSubscribed: true }).select("email");
      emailsToSend = activeSubscribers.map((s: { email: string }) => s.email);
    }

    if (emailsToSend.length === 0) {
      res.status(400).json({ success: false, message: "No active subscribers available to send emails to." });
      return;
    }

    const result = await sendNewsletterEmail(emailsToSend, subject, message);

    res.json({
      success: true,
      message: `Successfully sent email to ${emailsToSend.length} subscriber(s)!`,
      sentCount: emailsToSend.length,
      simulated: result.simulated,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * @desc Delete or Unsubscribe an email (Admin action)
 * @route DELETE /api/subscribers/:id
 * @access Public / Admin
 */
export const deleteSubscriber = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await Subscriber.findByIdAndDelete(id);
    res.json({
      success: true,
      message: "Subscriber removed successfully.",
    });
  } catch (error: any) {
    next(error);
  }
};

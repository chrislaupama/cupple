import {
  users,
  therapySessions,
  messages,
  partners,
  type User,
  type UpsertUser,
  type TherapySession,
  type InsertTherapySession,
  type Message,
  type InsertMessage,
  type Partner,
  type InsertPartner
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, asc, or } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserThemePreference(userId: string, theme: string): Promise<User>;

  // Therapy Session operations
  getTherapySession(id: number): Promise<TherapySession | undefined>;
  getTherapySessions(userId: string): Promise<TherapySession[]>;
  createTherapySession(session: InsertTherapySession): Promise<TherapySession>;
  updateSessionLastActivity(sessionId: number): Promise<void>;
  updateSessionTitle(sessionId: number, title: string): Promise<TherapySession>;
  deleteTherapySession(sessionId: number): Promise<boolean>;

  // Message operations
  getSessionMessages(sessionId: number, limit?: number): Promise<Message[]>;
  getMessage(messageId: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(messageId: number, content: string): Promise<Message>;

  // Partner operations
  getPartner(userId: string, partnerId: string): Promise<Partner | undefined>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  getUserPartners(userId: string): Promise<Partner[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserThemePreference(userId: string, theme: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        themePreference: theme,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Therapy Session operations
  async getTherapySession(id: number): Promise<TherapySession | undefined> {
    const [session] = await db
      .select()
      .from(therapySessions)
      .where(eq(therapySessions.id, id));
    return session;
  }

  async getTherapySessions(userId: string): Promise<TherapySession[]> {
    return await db
      .select()
      .from(therapySessions)
      .where(
        and(
          eq(therapySessions.isActive, true),
          or(
            eq(therapySessions.creatorId, userId),
            eq(therapySessions.partnerId, userId)
          )
        )
      )
      .orderBy(desc(therapySessions.lastMessageAt));
  }

  async createTherapySession(session: InsertTherapySession): Promise<TherapySession> {
    const [newSession] = await db
      .insert(therapySessions)
      .values(session)
      .returning();
    return newSession;
  }

  async updateSessionLastActivity(sessionId: number): Promise<void> {
    await db
      .update(therapySessions)
      .set({ lastMessageAt: new Date() })
      .where(eq(therapySessions.id, sessionId));
  }
  
  async updateSessionTitle(sessionId: number, title: string): Promise<TherapySession> {
    const [updatedSession] = await db
      .update(therapySessions)
      .set({
        title,
        updatedAt: new Date(),
      })
      .where(eq(therapySessions.id, sessionId))
      .returning();
    
    return updatedSession;
  }
  
  async deleteTherapySession(sessionId: number): Promise<boolean> {
    try {
      // First delete all messages that belong to this session
      await db
        .delete(messages)
        .where(eq(messages.sessionId, sessionId));
      
      // Then delete the session itself
      const result = await db
        .delete(therapySessions)
        .where(eq(therapySessions.id, sessionId))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting therapy session:", error);
      return false;
    }
  }

  // Message operations
  async getSessionMessages(sessionId: number, limit: number = 50): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(asc(messages.createdAt))
      .limit(limit);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }
  
  async getMessage(messageId: number): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId));
    
    return message;
  }
  
  async updateMessage(messageId: number, content: string): Promise<Message> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ content })
      .where(eq(messages.id, messageId))
      .returning();
    return updatedMessage;
  }

  // Partner operations
  async getPartner(userId: string, partnerId: string): Promise<Partner | undefined> {
    const [partner] = await db
      .select()
      .from(partners)
      .where(
        and(
          eq(partners.userId, userId),
          eq(partners.partnerId, partnerId),
          eq(partners.isActive, true)
        )
      );
    return partner;
  }

  async createPartner(partner: InsertPartner): Promise<Partner> {
    const [newPartner] = await db
      .insert(partners)
      .values(partner)
      .returning();
    return newPartner;
  }

  async getUserPartners(userId: string): Promise<Partner[]> {
    return await db
      .select()
      .from(partners)
      .where(
        and(
          eq(partners.userId, userId),
          eq(partners.isActive, true)
        )
      );
  }
}

export const storage = new DatabaseStorage();

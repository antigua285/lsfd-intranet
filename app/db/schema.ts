// src/db/schema.ts
import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(), // Sera haché avec bcrypt
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  rank: text('rank').notNull(),
  station: text('station').notNull(),
  avatarUrl: text('avatar_url'), // URL de la photo
  isAdmin: boolean('is_admin').default(false).notNull(), // Pour l'accès au Panel Admin
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
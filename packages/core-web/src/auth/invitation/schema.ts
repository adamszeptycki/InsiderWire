import { z } from 'zod'

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().url().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  isPremium: z.boolean(),
  role: z.string().nullable(),
})

const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  logo: z.string().url().nullable(),
  createdAt: z.coerce.date(),
  metadata: z.unknown().optional(),
})

const InviterSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.literal('owner'),
  createdAt: z.coerce.date(),
  user: UserSchema,
})

const InvitationSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  email: z.string().email(),
  role: z.literal('member'),
  status: z.enum(['pending', 'accepted', 'declined', 'expired']),
  expiresAt: z.coerce.date(),
  inviterId: z.string().uuid(),
})

export const InvitationEnvelopeSchema = z.object({
  id: z.string().uuid(),
  role: z.literal('member'),
  email: z.string().email(),
  organization: OrganizationSchema,
  inviter: InviterSchema,
  invitation: InvitationSchema,
})

export type InvitationEnvelope = z.infer<typeof InvitationEnvelopeSchema>
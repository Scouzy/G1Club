import { Request, Response } from 'express';
import Stripe from 'stripe';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY non défini dans .env');
  return new Stripe(key, { apiVersion: '2025-01-27.acacia' });
};

const PRO_PRICE_ID = () => process.env.STRIPE_PRO_PRICE_ID as string;
const CLIENT_URL   = () => process.env.CLIENT_URL || 'http://localhost:5173';

// POST /api/stripe/create-checkout-session
export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    const clubId = req.user?.clubId;
    if (!clubId) return res.status(400).json({ message: 'Club introuvable' });

    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) return res.status(404).json({ message: 'Club introuvable' });

    if (club.plan === 'PRO') {
      return res.status(400).json({ message: 'Votre club est déjà en formule Pro' });
    }

    // Créer ou réutiliser le customer Stripe
    const stripe = getStripe();
    let customerId = club.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: club.name,
        metadata: { clubId },
      });
      customerId = customer.id;
      await prisma.club.update({ where: { id: clubId }, data: { stripeCustomerId: customerId } });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: PRO_PRICE_ID(), quantity: 1 }],
      success_url: `${CLIENT_URL()}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${CLIENT_URL()}/subscribe?cancelled=1`,
      metadata: { clubId },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('[Stripe] createCheckoutSession error:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la session de paiement' });
  }
};

// POST /api/stripe/webhook  (raw body required)
export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('[Stripe] Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const clubId = session.metadata?.clubId;
        if (!clubId) break;
        await prisma.club.update({
          where: { id: clubId },
          data: {
            plan: 'PRO',
            stripeSubscriptionId: session.subscription as string,
            stripePriceId: PRO_PRICE_ID(),
          },
        });
        console.log(`[Stripe] Club ${clubId} passé en PRO`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const sub = await getStripe().subscriptions.retrieve(invoice.subscription as string);
        const clubId = sub.metadata?.clubId || (invoice as any).metadata?.clubId;
        if (!clubId) break;
        await prisma.club.update({
          where: { id: clubId },
          data: { plan: 'PRO', planExpiresAt: null },
        });
        break;
      }

      case 'customer.subscription.deleted':
      case 'invoice.payment_failed': {
        const obj = event.data.object as any;
        const subId = obj.id || obj.subscription;
        if (!subId) break;
        const club = await prisma.club.findFirst({ where: { stripeSubscriptionId: subId } });
        if (!club) break;
        await prisma.club.update({
          where: { id: club.id },
          data: { plan: 'STARTER', stripeSubscriptionId: null },
        });
        console.log(`[Stripe] Club ${club.id} repassé en STARTER (abonnement annulé/échoué)`);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('[Stripe] Webhook handler error:', err);
  }

  res.json({ received: true });
};

// GET /api/stripe/portal  — portail de gestion Stripe pour l'abonné
export const createPortalSession = async (req: AuthRequest, res: Response) => {
  try {
    const clubId = req.user?.clubId;
    if (!clubId) return res.status(400).json({ message: 'Club introuvable' });

    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club?.stripeCustomerId) return res.status(400).json({ message: 'Aucun abonnement Stripe trouvé' });

    const session = await getStripe().billingPortal.sessions.create({
      customer: club.stripeCustomerId,
      return_url: `${CLIENT_URL()}/admin/club`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('[Stripe] createPortalSession error:', error);
    res.status(500).json({ message: 'Erreur portail Stripe' });
  }
};

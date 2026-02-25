import Stripe from 'stripe'

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable')
  }
  return new Stripe(key, { typescript: true })
}

// Lazy initialization — only created when first used at runtime, not at build time
let _stripe: Stripe | null = null

export function getStripe() {
  if (!_stripe) {
    _stripe = getStripeClient()
  }
  return _stripe
}

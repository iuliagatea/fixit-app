import { loadStripe } from '@stripe/stripe-js'

function publishableKey(): string {
  return document.querySelector('meta[name="stripe-publishable-key"]')?.getAttribute('content') ?? ''
}

export const stripePromise = loadStripe(publishableKey())

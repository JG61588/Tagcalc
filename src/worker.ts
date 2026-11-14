interface AssetFetcher {
  fetch(request: Request): Promise<Response>;
}

export interface Env {
  ASSETS: AssetFetcher;
  STRIPE_RESTRICTED_KEY?: string;
}

interface StripeCheckoutSession {
  id?: string;
  payment_status?: string;
}

interface StripeSessionsResponse {
  data?: StripeCheckoutSession[];
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/verify-purchase' && request.method === 'POST') {
      let email = '';
      try {
        const body = (await request.json()) as { email?: unknown };
        if (typeof body?.email === 'string') {
          email = body.email.trim().toLowerCase();
        }
      } catch {
        return jsonResponse({ unlocked: false }, 400);
      }

      if (!email || !email.includes('@')) {
        return jsonResponse({ unlocked: false }, 400);
      }

      if (!env.STRIPE_RESTRICTED_KEY) {
        return jsonResponse({ unlocked: false }, 500);
      }

      try {
        const stripeUrl = `https://api.stripe.com/v1/checkout/sessions?customer_details[email]=${encodeURIComponent(
          email
        )}&limit=10`;

        const stripeRes = await fetch(stripeUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${env.STRIPE_RESTRICTED_KEY}`,
          },
        });

        if (!stripeRes.ok) {
          return jsonResponse({ unlocked: false }, 502);
        }

        const data = (await stripeRes.json()) as StripeSessionsResponse;
        const unlocked =
          Array.isArray(data?.data) &&
          data.data.some((session) => session?.payment_status === 'paid');

        return jsonResponse({ unlocked }, 200);
      } catch {
        return jsonResponse({ unlocked: false }, 502);
      }
    }

    return env.ASSETS.fetch(request);
  },
};

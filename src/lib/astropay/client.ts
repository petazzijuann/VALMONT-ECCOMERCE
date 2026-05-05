import crypto from "crypto";

const BASE_URL = "https://api.astropaycard.com";

interface CreatePaymentParams {
  orderId: string;
  amount: number;
  customerEmail: string;
  description: string;
  redirectUrl: string;
  callbackUrl: string;
}

interface AstroPayResponse {
  paymentUrl: string;
  paymentId: string;
}

export async function createPaymentLink({
  orderId,
  amount,
  customerEmail,
  description,
  redirectUrl,
  callbackUrl,
}: CreatePaymentParams): Promise<AstroPayResponse> {
  const apiKey = process.env.ASTROPAY_API_KEY;
  const merchantCode = process.env.ASTROPAY_MERCHANT_CODE;

  if (!apiKey || !merchantCode) {
    throw new Error("AstroPay credentials not configured");
  }

  const res = await fetch(`${BASE_URL}/merchant/initiatedeposit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "Merchant-Gateway-Code": merchantCode,
    },
    body: JSON.stringify({
      merchant_transaction_id: orderId,
      amount: amount.toFixed(2),
      currency: "ARS",
      country: "AR",
      description,
      callback_url: callbackUrl,
      redirect_url: redirectUrl,
      user: { email: customerEmail },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AstroPay error: ${res.status} — ${err}`);
  }

  const data = await res.json();

  return {
    paymentUrl: data.deposit_url ?? data.payment_url,
    paymentId: data.external_id ?? data.payment_id ?? orderId,
  };
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.ASTROPAY_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex")
  );
}

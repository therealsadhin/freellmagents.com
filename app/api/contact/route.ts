import { Resend } from "resend";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;
const MAX_TRACKED_ADDRESSES = 5000;
const MAX_BODY_BYTES = 16_000;
const SUPPORT_EMAIL = "support@freellmagents.com";
const requestsByAddress = new Map<string, { count: number; resetAt: number }>();

type ContactFields = {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getField(value: unknown, limit: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned && cleaned.length <= limit ? cleaned : null;
}

function parseFields(value: unknown): ContactFields | null {
  if (!isRecord(value)) return null;
  const name = getField(value.name, 100);
  const email = getField(value.email, 254);
  const subject = getField(value.subject, 160);
  const message = getField(value.message, 5000);
  const website =
    typeof value.website === "string" ? value.website.trim() : null;

  if (
    !name ||
    name.length < 2 ||
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !subject ||
    subject.length < 3 ||
    /[\r\n]/.test(subject) ||
    !message ||
    message.length < 10 ||
    website === null
  ) {
    return null;
  }

  return { name, email, subject, message, website };
}

function getClientAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realAddress = request.headers.get("x-real-ip");
  return (
    realAddress?.trim() ||
    forwarded?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function isRateLimited(address: string): boolean {
  const now = Date.now();
  for (const [key, value] of requestsByAddress) {
    if (value.resetAt <= now) requestsByAddress.delete(key);
  }

  const record = requestsByAddress.get(address);
  if (record && record.resetAt > now && record.count >= MAX_REQUESTS) {
    return true;
  }

  if (!record || record.resetAt <= now) {
    if (requestsByAddress.size >= MAX_TRACKED_ADDRESSES) {
      const oldest = requestsByAddress.keys().next().value;
      if (oldest) requestsByAddress.delete(oldest);
    }
    requestsByAddress.set(address, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  record.count += 1;
  return false;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function getErrorDetails(
  error: unknown,
  apiKey: string,
): { name: string; statusCode: number | null; message: string } {
  if (!isRecord(error)) {
    return {
      name: "UnknownError",
      statusCode: null,
      message: "Resend returned an unrecognized error.",
    };
  }

  const rawMessage =
    typeof error.message === "string" ? error.message : "Email request failed.";
  const safeMessage = (apiKey ? rawMessage.split(apiKey).join("[redacted]") : rawMessage)
    .replace(/[\r\n]+/g, " ")
    .slice(0, 500);

  return {
    name: typeof error.name === "string" ? error.name : "ResendError",
    statusCode:
      typeof error.statusCode === "number" ? error.statusCode : null,
    message: safeMessage,
  };
}

function getDeliveryErrorMessage(
  statusCode: number | null,
  errorName: string,
  errorMessage: string,
): string {
  if (
    /sender|domain|verify|validation/i.test(`${errorName} ${errorMessage}`) ||
    statusCode === 400 ||
    statusCode === 422
  ) {
    return "The configured sender was not accepted. Verify CONTACT_FROM_EMAIL and its domain in Resend, then try again.";
  }
  if (statusCode === 401 || statusCode === 403) {
    return "The email service rejected its credentials or permissions. Please contact support directly.";
  }
  if (statusCode === 429) {
    return "The email service is temporarily rate-limited. Please try again later.";
  }
  return "The email service could not accept your message. Please try again later or email support@freellmagents.com.";
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json({ message: "Request is too large." }, { status: 413 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return Response.json({ message: "Invalid request body." }, { status: 400 });
  }
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return Response.json({ message: "Request is too large." }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ message: "Invalid request body." }, { status: 400 });
  }

  const fields = parseFields(payload);
  if (!fields) {
    return Response.json(
      { message: "Check the form fields and try again." },
      { status: 400 },
    );
  }
  if (fields.website) {
    return Response.json({ message: "Invalid request." }, { status: 400 });
  }

  if (isRateLimited(getClientAddress(request))) {
    return Response.json(
      { message: "Too many messages. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(WINDOW_MS / 1000)) },
      },
    );
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CONTACT_FROM_EMAIL?.trim();
  const configuredTo = process.env.CONTACT_TO_EMAIL?.trim();
  const missingConfiguration = [
    !apiKey && "RESEND_API_KEY",
    !from && "CONTACT_FROM_EMAIL",
  ].filter((value): value is string => Boolean(value));

  if (!apiKey || !from) {
    console.error("Contact email delivery is missing configuration.", {
      missing: missingConfiguration,
    });
    return Response.json(
      {
        message:
          "Email delivery is not configured yet. Please email support@freellmagents.com directly.",
      },
      { status: 503 },
    );
  }

  if (
    configuredTo &&
    configuredTo.toLowerCase() !== SUPPORT_EMAIL.toLowerCase()
  ) {
    console.error("Contact email recipient configuration is invalid.", {
      expected: SUPPORT_EMAIL,
    });
    return Response.json(
      {
        message:
          "The support email destination is not configured correctly. Please email support@freellmagents.com directly.",
      },
      { status: 503 },
    );
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: SUPPORT_EMAIL,
      replyTo: fields.email,
      subject: `[FreeLLMAgents contact] ${fields.subject}`,
      text: [
        `Name: ${fields.name}`,
        `Email: ${fields.email}`,
        `Subject: ${fields.subject}`,
        "",
        fields.message,
      ].join("\n"),
      html: `<h2>New FreeLLMAgents contact message</h2><p><strong>Name:</strong> ${escapeHtml(fields.name)}</p><p><strong>Email:</strong> ${escapeHtml(fields.email)}</p><p><strong>Subject:</strong> ${escapeHtml(fields.subject)}</p><p>${escapeHtml(fields.message).replace(/\n/g, "<br>")}</p>`,
    });

    if (error) {
      const details = getErrorDetails(error, apiKey);
      console.error("Resend rejected contact message.", {
        ...details,
      });
      return Response.json(
        {
          message: getDeliveryErrorMessage(
            details.statusCode,
            details.name,
            details.message,
          ),
        },
        { status: 502 },
      );
    }

    if (!data?.id) {
      console.error("Resend returned no accepted email identifier.");
      return Response.json(
        {
          message:
            "The email service did not confirm acceptance. Please try again later or email support@freellmagents.com.",
        },
        { status: 502 },
      );
    }

    return Response.json({ message: "Message sent." }, { status: 200 });
  } catch (error) {
    const details = getErrorDetails(error, apiKey);
    console.error("Contact email request failed.", {
      ...details,
    });
    return Response.json(
      {
        message: getDeliveryErrorMessage(
          details.statusCode,
          details.name,
          details.message,
        ),
      },
      { status: 502 },
    );
  }
}

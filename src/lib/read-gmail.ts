import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

export type InboxMessage = {
  id: string;
  text: string;
};

export class GmailReadError extends Error {
  constructor(readonly reason: "invalid_credentials" | "email_unreachable") {
    super(reason);
    this.name = "GmailReadError";
  }
}

function asGmailError(error: unknown): GmailReadError {
  if (
    error &&
    typeof error === "object" &&
    "authenticationFailed" in error &&
    (error as { authenticationFailed?: boolean }).authenticationFailed
  ) {
    return new GmailReadError("invalid_credentials");
  }
  if (error instanceof GmailReadError) return error;
  return new GmailReadError("email_unreachable");
}

export async function readRecentGmail(address: string, appPassword: string): Promise<InboxMessage[]> {
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: address.trim(),
      pass: appPassword.replace(/\s+/g, ""),
    },
    logger: false,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  // Timeouts are emitted on the client after the request has already failed.
  client.on("error", () => undefined);

  try {
    await client.connect();
  } catch (error) {
    client.close();
    throw asGmailError(error);
  }

  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const since = new Date(Date.now() - 36 * 60 * 60 * 1000);
      const uids = await client.search({ since }, { uid: true });
      const recent = Array.isArray(uids) && uids.length > 0 ? uids.slice(-40) : [];
      if (recent.length === 0) return [];

      const messages: InboxMessage[] = [];

      for await (const message of client.fetch(recent.join(","), { uid: true, source: true }, { uid: true })) {
        if (!message.source) continue;
        const parsed = await simpleParser(message.source);
        const html = typeof parsed.html === "string" ? parsed.html : "";
        const id = parsed.messageId || `uid:${message.uid}`;
        messages.push({
          id,
          text: [parsed.subject ?? "", parsed.text ?? "", html].join("\n"),
        });
      }

      return messages;
    } finally {
      lock.release();
    }
  } catch (error) {
    throw asGmailError(error);
  } finally {
    await client.logout().catch(() => {
      client.close();
    });
  }
}

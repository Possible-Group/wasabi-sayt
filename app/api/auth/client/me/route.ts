import { NextResponse } from "next/server";
import { getClientSession, setClientSession } from "@/lib/auth/clientAuth";
import { findPosterClientByPhone, normalizePosterClient } from "@/lib/poster/posterClients";

export async function GET() {
  const session = await getClientSession();
  if (!session) {
    return NextResponse.json({ client: null });
  }

  const fresh = session.phone ? await findPosterClientByPhone(session.phone) : null;
  const normalized = fresh ? normalizePosterClient(fresh) : null;
  const responseClient =
    normalized || {
      id: session.clientId,
      name: session.name || "",
      phone: session.phone || "",
      bonus: 0,
    };

  // Sliding session: refresh cookie TTL on active usage.
  await setClientSession({
    clientId: responseClient.id,
    phone: responseClient.phone || session.phone || "",
    name: responseClient.name || session.name || "",
  });

  return NextResponse.json({
    client: responseClient,
  });
}

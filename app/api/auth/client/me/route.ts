import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/auth/clientAuth";
import { getPosterClientById, normalizePosterClient } from "@/lib/poster/posterClients";

export async function GET() {
  const session = await getClientSession();
  if (!session) {
    return NextResponse.json({ client: null });
  }

  const fresh = await getPosterClientById(session.clientId);
  const normalized = fresh ? normalizePosterClient(fresh) : null;

  return NextResponse.json({
    client: normalized || {
      id: session.clientId,
      name: session.name || "",
      phone: session.phone || "",
      bonus: 0,
    },
  });
}

import { NextResponse } from "next/server";

import { getClientSession } from "@/lib/auth/clientAuth";
import { getPosterAccountOrders } from "@/lib/poster/posterOrders";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getClientSession();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const orders = await getPosterAccountOrders({
      clientId: session.clientId,
      phone: session.phone,
    });
    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ error: "ORDER_HISTORY_UNAVAILABLE" }, { status: 502 });
  }
}

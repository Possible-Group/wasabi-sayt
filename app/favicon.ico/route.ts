import { NextResponse } from "next/server";

export function GET(req: Request) {
  return NextResponse.redirect(new URL("/icons/logo.png", req.url), 307);
}

export function HEAD(req: Request) {
  return NextResponse.redirect(new URL("/icons/logo.png", req.url), 307);
}

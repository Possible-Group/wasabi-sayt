import { posterFetch } from "./posterClient";
import { cached } from "./posterCache";

export type PosterClient = Record<string, any>;

export type NormalizedPosterClient = {
  id: string;
  name: string;
  phone: string;
  bonus: number;
};

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function formatBirthdayAlt(value?: string) {
  if (!value) return undefined;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  return `${match[3]}.${match[2]}.${match[1]}`;
}

function formatBirthdayDash(value?: string) {
  if (!value) return undefined;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function toNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const cleaned = value.replace(/\s+/g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }
  if (typeof value === "object") {
    for (const v of Object.values(value)) {
      const num = toNumber(v);
      if (num !== null) return num;
    }
  }
  return null;
}

function extractClients(payload: any): PosterClient[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  const response = payload.response ?? payload.clients ?? payload.data ?? payload.result ?? payload;
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.clients)) return response.clients;
  if (Array.isArray(response?.items)) return response.items;
  if (response && typeof response === "object") {
    if (response.client_id || response.id) return [response];
  }
  return [];
}

function getClientId(client: PosterClient): string | null {
  const raw =
    client.client_id ??
    client.id ??
    client.clientId ??
    client.client_id_poster ??
    client.customer_id ??
    client.customerId;
  const id = raw !== undefined && raw !== null ? String(raw).trim() : "";
  return id || null;
}

function getClientName(client: PosterClient): string {
  const direct = String(
    client.client_name ?? client.name ?? client.full_name ?? client.fullname ?? ""
  ).trim();
  if (direct) return direct;

  const first = String(
    client.firstname ?? client.first_name ?? client.firstName ?? ""
  ).trim();
  const last = String(client.lastname ?? client.last_name ?? client.lastName ?? "").trim();
  const middle = String(
    client.patronymic ?? client.middle_name ?? client.middleName ?? ""
  ).trim();
  return [first, last, middle].filter(Boolean).join(" ");
}

function getClientPhone(client: PosterClient): string {
  return String(client.phone ?? client.phone_number ?? client.tel ?? "").trim() || "";
}

function formatUzPhone(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;
  const digits = normalizePhone(raw);
  if (!digits) return raw;
  if (digits.startsWith("998")) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  if (digits.length === 10 && digits.startsWith("0")) return `+998${digits.slice(1)}`;
  return raw;
}

function getClientBonus(client: PosterClient): number {
  const direct =
    toNumber(client.bonus) ??
    toNumber(client.bonus_points) ??
    toNumber(client.bonus_sum) ??
    toNumber(client.bonus_total) ??
    toNumber(client.bonus_amount) ??
    toNumber(client.balance);
  return direct !== null && direct !== undefined ? direct / 100 : 0;
}

export function normalizePosterClient(client: PosterClient): NormalizedPosterClient | null {
  const id = getClientId(client);
  if (!id) return null;
  return {
    id,
    name: getClientName(client),
    phone: formatUzPhone(getClientPhone(client)),
    bonus: getClientBonus(client),
  };
}

type PosterClientGroup = {
  client_groups_id?: string | number;
  delete?: string | number;
};

async function getDefaultPosterClientGroupId(): Promise<string | null> {
  const explicit = process.env.POSTER_CLIENT_GROUP_ID;
  if (explicit && explicit.trim()) return explicit.trim();

  try {
    const data = await cached("poster:client_groups", 300_000, () =>
      posterFetch<{ response?: PosterClientGroup[] }>("clients.getGroups")
    );
    const groups = Array.isArray(data?.response) ? data.response : [];
    if (!groups.length) return null;
    const active = groups.find((group) => String(group?.delete ?? "0") !== "1") ?? groups[0];
    const id = active?.client_groups_id;
    if (id === undefined || id === null) return null;
    const normalized = String(id).trim();
    return normalized || null;
  } catch {
    return null;
  }
}

export async function findPosterClientByPhone(phone: string): Promise<PosterClient | null> {
  const rawPhone = String(phone || "").trim();
  if (!rawPhone) return null;
  const normalized = normalizePhone(rawPhone);
  const plusNormalized = normalized ? `+${normalized}` : "";

  const tryFetch = async (value: string) => {
    const data = await posterFetch<any>("clients.getClients", { phone: value });
    return extractClients(data);
  };

  try {
    const candidates = [rawPhone, normalized, plusNormalized].filter(Boolean);
    const seen = new Set<string>();
    let clients: PosterClient[] = [];
    for (const candidate of candidates) {
      if (seen.has(candidate)) continue;
      seen.add(candidate);
      clients = await tryFetch(candidate);
      if (clients.length) break;
    }
    if (!clients.length) return null;
    const wanted = normalized || normalizePhone(rawPhone);
    const matched = clients.find((client) => {
      const clientPhone = normalizePhone(getClientPhone(client));
      return clientPhone && wanted ? clientPhone === wanted : false;
    });
    return matched ?? clients[0] ?? null;
  } catch {
    return null;
  }
}

export async function getPosterClientById(clientId: string): Promise<PosterClient | null> {
  const id = String(clientId || "").trim();
  if (!id) return null;
  try {
    const data = await posterFetch<any>("clients.getClient", { client_id: id });
    const clients = extractClients(data);
    return clients[0] ?? null;
  } catch {
    try {
      const data = await posterFetch<any>("clients.getClients", { client_id: id });
      const clients = extractClients(data);
      return clients[0] ?? null;
    } catch {
      return null;
    }
  }
}

export async function createPosterClient({
  name,
  phone,
  email,
  birthday,
}: {
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
}): Promise<PosterClient | null> {
  const clientName = String(name || "").trim();
  const clientPhone = String(phone || "").trim();
  if (!clientName || !clientPhone) return null;
  const normalizedPhone = normalizePhone(clientPhone);
  const plusNormalized = normalizedPhone ? `+${normalizedPhone}` : "";
  const birthdayAlt = formatBirthdayAlt(birthday);
  const birthdayDash = formatBirthdayDash(birthday);
  const nameParts = clientName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  const clientGroupId = await getDefaultPosterClientGroupId();
  const groupId = clientGroupId || undefined;
  const emailValue = email || undefined;

  const tryCreate = async (method: string, payload: Record<string, string | undefined>) => {
    const data = await posterFetch<any>(method, payload, { httpMethod: "POST" });
    const clients = extractClients(data);
    if (clients.length) return clients[0];
    const maybe = data?.response ?? data;
    if (maybe && typeof maybe === "object") return maybe as PosterClient;
    return null;
  };

  const phoneVariants = [clientPhone, normalizedPhone, plusNormalized].filter(Boolean);
  const birthdayVariants = [birthday, birthdayAlt, birthdayDash].filter(Boolean);
  const payloads: Array<Record<string, string | undefined>> = [];

  for (const phoneValue of phoneVariants) {
    payloads.push({
      client_name: clientName,
      phone: phoneValue,
      client_phone: phoneValue,
      phone_number: phoneValue,
      client_groups_id_client: groupId,
      email: emailValue,
    });
    for (const birth of birthdayVariants) {
      payloads.push({
        client_name: clientName,
        phone: phoneValue,
        client_phone: phoneValue,
        phone_number: phoneValue,
        client_groups_id_client: groupId,
        email: emailValue,
        birthday: birth,
        birthdate: birth,
        birth_date: birth,
      });
    }
    payloads.push({
      name: clientName,
      phone: phoneValue,
      client_phone: phoneValue,
      phone_number: phoneValue,
      client_groups_id_client: groupId,
      email: emailValue,
    });
    if (firstName) {
      payloads.push({
        first_name: firstName,
        last_name: lastName || undefined,
        client_name: clientName,
        phone: phoneValue,
        client_phone: phoneValue,
        phone_number: phoneValue,
        client_groups_id_client: groupId,
        email: emailValue,
      });
    }
  }

  const methods = [
    "clients.createClient",
    "clients.create",
    "clients.addClient",
    "clients.createOrUpdate",
  ];

  let lastError: string | null = null;
  for (const method of methods) {
    for (const payload of payloads) {
      try {
        const created = await tryCreate(method, payload);
        if (created) return created;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const isUnknown = /Unknown API method|Unknown method/i.test(message);
        if (!lastError || !isUnknown || /Unknown API method|Unknown method/i.test(lastError)) {
          lastError = message;
        }
      }
    }
  }

  if (lastError) {
    throw new Error(lastError);
  }
  return null;
}

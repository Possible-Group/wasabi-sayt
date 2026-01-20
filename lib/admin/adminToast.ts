export type AdminToastTone = "success" | "error" | "info";

export type AdminToastDetail = {
  message: string;
  tone?: AdminToastTone;
  duration?: number;
};

export const ADMIN_TOAST_EVENT = "admin-toast";

export function emitAdminToast(
  message: string,
  tone: AdminToastTone = "success",
  duration = 2400
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AdminToastDetail>(ADMIN_TOAST_EVENT, {
      detail: { message, tone, duration },
    })
  );
}

export const TRIAL_DAYS = 14;
export const PAID_DAYS = 30;

export type SubscriptionStatus = "trial" | "active" | "expired" | "canceled";

export interface SubscriptionFields {
  subscriptionStatus: string;
  trialEndsAt: Date;
  paidUntil: Date | null;
}

export interface AccessState {
  active: boolean;
  status: SubscriptionStatus;
  label: string;
  endsAt: Date | null;
  daysLeft: number;
}

function asStatus(value: string): SubscriptionStatus {
  if (value === "trial" || value === "active" || value === "expired" || value === "canceled") {
    return value;
  }
  return "expired";
}

export function trialEndsFrom(now = new Date()): Date {
  return new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

export function paidUntilFrom(now = new Date()): Date {
  return new Date(now.getTime() + PAID_DAYS * 24 * 60 * 60 * 1000);
}

export function getAccessState(salon: SubscriptionFields, now = new Date()): AccessState {
  const stored = asStatus(salon.subscriptionStatus);

  if (stored === "canceled") {
    return {
      active: false,
      status: "canceled",
      label: "İptal edildi",
      endsAt: salon.paidUntil,
      daysLeft: 0,
    };
  }

  if (stored === "active" && salon.paidUntil && salon.paidUntil.getTime() > now.getTime()) {
    const daysLeft = Math.ceil((salon.paidUntil.getTime() - now.getTime()) / 86_400_000);
    return {
      active: true,
      status: "active",
      label: "Aktif abonelik",
      endsAt: salon.paidUntil,
      daysLeft,
    };
  }

  if (stored === "trial" && salon.trialEndsAt.getTime() > now.getTime()) {
    const daysLeft = Math.ceil((salon.trialEndsAt.getTime() - now.getTime()) / 86_400_000);
    return {
      active: true,
      status: "trial",
      label: "Deneme süresi",
      endsAt: salon.trialEndsAt,
      daysLeft,
    };
  }

  return {
    active: false,
    status: "expired",
    label: "Abonelik yok",
    endsAt: stored === "trial" ? salon.trialEndsAt : salon.paidUntil,
    daysLeft: 0,
  };
}

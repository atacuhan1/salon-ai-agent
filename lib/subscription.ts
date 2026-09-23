export const TRIAL_DAYS = 14;
export const PAID_DAYS = 30;

export const SUBSCRIPTION_STATUS = {
  trial: "trial",
  active: "active",
  expired: "expired",
  canceled: "canceled",
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

const SUBSCRIPTION_STATUS_VALUES = new Set<string>(
  Object.values(SUBSCRIPTION_STATUS),
);

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
  if (SUBSCRIPTION_STATUS_VALUES.has(value)) {
    return value as SubscriptionStatus;
  }
  return SUBSCRIPTION_STATUS.expired;
}

export function trialEndsFrom(now = new Date()): Date {
  return new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

export function paidUntilFrom(now = new Date()): Date {
  return new Date(now.getTime() + PAID_DAYS * 24 * 60 * 60 * 1000);
}

export function getAccessState(salon: SubscriptionFields, now = new Date()): AccessState {
  const stored = asStatus(salon.subscriptionStatus);

  if (stored === SUBSCRIPTION_STATUS.canceled) {
    return {
      active: false,
      status: SUBSCRIPTION_STATUS.canceled,
      label: "İptal edildi",
      endsAt: salon.paidUntil,
      daysLeft: 0,
    };
  }

  if (
    stored === SUBSCRIPTION_STATUS.active &&
    salon.paidUntil &&
    salon.paidUntil.getTime() > now.getTime()
  ) {
    const daysLeft = Math.ceil((salon.paidUntil.getTime() - now.getTime()) / 86_400_000);
    return {
      active: true,
      status: SUBSCRIPTION_STATUS.active,
      label: "Aktif abonelik",
      endsAt: salon.paidUntil,
      daysLeft,
    };
  }

  if (stored === SUBSCRIPTION_STATUS.trial && salon.trialEndsAt.getTime() > now.getTime()) {
    const daysLeft = Math.ceil((salon.trialEndsAt.getTime() - now.getTime()) / 86_400_000);
    return {
      active: true,
      status: SUBSCRIPTION_STATUS.trial,
      label: "Deneme süresi",
      endsAt: salon.trialEndsAt,
      daysLeft,
    };
  }

  return {
    active: false,
    status: SUBSCRIPTION_STATUS.expired,
    label: "Abonelik yok",
    endsAt: stored === SUBSCRIPTION_STATUS.trial ? salon.trialEndsAt : salon.paidUntil,
    daysLeft: 0,
  };
}

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  priceTry: number;
  keywords: string[];
}

export interface WorkingHours {
  /** 0 = Sunday ... 6 = Saturday. null means closed. */
  [weekday: number]: { open: string; close: string } | null;
}

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  start: Date;
  end: Date;
}

export interface CreateAppointmentResult {
  success: boolean;
  eventId?: string;
  startDateTime: string;
  endDateTime: string;
  message: string;
}

export interface AgentResult {
  reply: string;
  toolCalls: string[];
  usedFallback: boolean;
}

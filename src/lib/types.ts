export interface Lead {
  id: string;
  name: string;
  phone: string;
  interest: string;
  status: "new" | "contacted" | "qualified" | "booked" | "lost";
  source: string;
  createdAt: string;
  notes?: string;
}

export interface Booking {
  id: string;
  name: string;
  phone: string;
  car: string;
  date: string;
  time: string;
  status: "confirmed" | "completed" | "cancelled";
  notes?: string;
}

export interface Message {
  id: string;
  from: string;
  text: string;
  timestamp: string;
  direction: "inbound" | "outbound";
}

export interface Conversation {
  phone: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  messages: Message[];
}

export interface DashboardStats {
  totalLeads: number;
  newLeadsToday: number;
  bookingsThisWeek: number;
  bookingsToday: number;
  conversionRate: number;
  activeConversations: number;
}

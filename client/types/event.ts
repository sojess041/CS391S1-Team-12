export type EventCardProps = {
  id?: string;
  eventName: string;
  eventLocation: string;
  roomNumber?: string | null;
  eventDate: string;
  startTime: string;
  endTime: string;
  foodType: string;
  quantity: number;
  quantityRemaining: number;
  eventDescription?: string | null;
  eventTags?: string[];
  eventImage?: string | null;
  organizerName?: string;
};

export type EventFormData = {
  eventName: string;
  eventLocation: string;
  roomNumber: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  foodType: string;
  quantity: number;
  eventDescription?: string;
  eventTags?: string;
  eventImage?: string;
};

export type SignUpFormData = {
  name: string;
  email: string;
  password: string;
  confirm: string;
  role: 'student' | 'organizer';
  foodRestrictions?: string[];
};

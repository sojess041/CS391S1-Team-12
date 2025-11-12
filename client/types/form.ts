export type FormData = {
  eventName: string;
  eventLocation: string;
  roomNumber: string;
  eventDate: string;
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

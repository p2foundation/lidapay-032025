export interface Profile {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password?: string;
  gravatar?: string;
  roles: string[];
  points: number;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  qrCodeUsageCount: number;
  invitationLink: string;
  invitationLinkUsageCount: number;
  invitationLinks?: InvitationLink[];
  totalPointsEarned: number;
  createdAt: string;
  updatedAt: string;
  account: string;
  wallet: string;
  qrCode: string;
  isVerified: boolean;
  // Additional profile properties
  bio?: string;
  location?: string;
  website?: string;
  company?: string;
  jobTitle?: string;
  education?: string;
  interests?: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

interface InvitationLink {
  link: string;
  createdAt: string;
  lastUsed: string | null;
  usageCount: number;
  pointsEarned: number;
} 
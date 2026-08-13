import {
  Code2,
  Palette,
  Share2,
  Bot,
  MonitorSmartphone,
  Camera,
  Megaphone,
  FileSpreadsheet,
  Wrench,
  UserCheck,
  Users,
  Award,
  Building2,
  Rocket,
  Sparkles,
  Calendar,
  Star,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';

/**
 * Maps a stored icon name (from admin config/programs) to a Lucide component.
 * Falls back to Sparkles for unknown names.
 */
export function getHubIcon(name?: string): LucideIcon {
  switch (name) {
    case 'Code2':
      return Code2;
    case 'Palette':
      return Palette;
    case 'Share2':
      return Share2;
    case 'Bot':
      return Bot;
    case 'MonitorSmartphone':
      return MonitorSmartphone;
    case 'Camera':
      return Camera;
    case 'Megaphone':
      return Megaphone;
    case 'FileSpreadsheet':
      return FileSpreadsheet;
    case 'Wrench':
      return Wrench;
    case 'UserCheck':
      return UserCheck;
    case 'Users':
      return Users;
    case 'Award':
      return Award;
    case 'Building2':
      return Building2;
    case 'Rocket':
      return Rocket;
    case 'Calendar':
      return Calendar;
    case 'Star':
      return Star;
    case 'GraduationCap':
      return GraduationCap;
    default:
      return Sparkles;
  }
}

export const HUB_PROGRAM_ICONS = [
  'Code2',
  'Palette',
  'Share2',
  'Bot',
  'MonitorSmartphone',
  'Camera',
  'Megaphone',
  'FileSpreadsheet',
  'Rocket',
  'GraduationCap',
];

export const HUB_HIGHLIGHT_ICONS = [
  'Wrench',
  'UserCheck',
  'Users',
  'Award',
  'Building2',
  'Rocket',
  'Sparkles',
  'Calendar',
];
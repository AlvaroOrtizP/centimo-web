import { PlatformType } from './platform-type';

export interface Platform {
  id: string;
  name: string;
  type: PlatformType;
  color: string;
  icon: string;
  order: number;
  fixedNotes?: string;
}

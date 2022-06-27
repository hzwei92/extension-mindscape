import type { Arrow } from "~features/arrow/arrow";

export type Sheaf  = {
  id: string;
  routeName: string;

  sourceId: string;
  source: Arrow;
  targetId: string;
  target: Arrow;

  links: Arrow[];

  clicks: number;
  tokens: number;
  weight: number;
  
  createDate: Date;
  updateDate: Date;
  deleteDate: Date | null;
}

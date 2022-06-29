import type { Arrow } from "~features/arrow/arrow";

export type Sheaf  = {
  id: string;
  routeName: string;

  sourceId: string;
  source: Sheaf;
  targetId: string;
  target: Sheaf;

  ins: Sheaf[];
  outs: Sheaf[];
  inCount: number;
  outCount: number;
  
  arrows: Arrow[];

  clicks: number;
  tokens: number;
  weight: number;
  
  createDate: Date;
  updateDate: Date;
  deleteDate: Date | null;
}

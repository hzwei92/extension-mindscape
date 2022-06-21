import type { Arrow } from '../arrow/arrow';
import type { User } from '../user/user';

export type Role = {
  id: string;
  userId: string;
  user: User;
  arrowId: string;
  arrow: Arrow;
  type: string;
  isInvited: boolean;
  isRequested: boolean;
  createDate: Date;
  updateDate: Date;
  deleteDate: Date | null;
  __typename: string;
}
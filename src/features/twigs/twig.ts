import type { DisplayMode } from "~constants";
import type { Arrow } from "~features/arrow/arrow";
import type { Sheaf } from "~features/sheaf/sheaf";
import type { User } from "~features/user/user";

export type Twig = {
  id: string;
  sourceId: string | null;
  targetId: string | null;
  userId: string;
  user: User;
  abstractId: string;
  abstract: Arrow;
  detailId: string | null;
  detail: Arrow | null
  sheafId: string | null;
  sheaf: Sheaf | null;
  parent: Twig;
  children: Twig[];
  i: number;
  x: number;
  y: number;
  z: number;
  isRoot: boolean;
  degree: number;
  rank: number;
  color: string | null;
  displayMode: string;
  windowId: number | null;
  groupId: number | null;
  tabId: number | null;
  isOpen: boolean;
  createDate: Date | null;
  updateDate: Date | null;
  deleteDate: Date | null;
  __typename: string;
}


export const createTwig = (
  user: User, 
  id: string,
  abstract: Arrow, 
  detail: Arrow | null, 
  sheaf: Sheaf | null,
  parent: Twig, 
  x: number,
  y: number,
  color: string | null,
  isOpen: boolean,
  windowId: number | null,
  groupId: number | null,
  tabId: number | null,
  displayMode: DisplayMode,
) => {
  const date = new Date();
  const twig: Twig = {
    id,
    sourceId: null,
    targetId: null,
    userId: user.id,
    user,
    abstractId: abstract.id,
    abstract,
    detailId: detail?.id,
    detail,
    sheafId: sheaf?.id,
    sheaf,
    parent,
    children: [],
    isRoot: false,
    i: abstract.twigN + 1,
    x,
    y,
    z: abstract.twigZ + 1,
    color,
    degree: parent.degree + 1,
    rank: 0,
    tabId,
    groupId,
    windowId,
    isOpen,
    displayMode,
    createDate: date,
    updateDate: date,
    deleteDate: null,
    __typename: 'Twig'
  };
  return twig;
}
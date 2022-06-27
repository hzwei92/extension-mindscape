import { gql } from '@apollo/client';
import { FULL_SHEAF_FIELDS } from '~features/sheaf/sheafFragments';
import { FULL_ARROW_FIELDS } from '../arrow/arrowFragments';

export const TWIG_FIELDS = gql`
  fragment TwigFields on Twig {
    id
    sourceId
    targetId
    userId
    abstractId
    detailId
    sheafId
    i
    x
    y
    z
    isRoot
    degree
    rank
    displayMode
    color
    windowId
    groupId
    tabId
    isOpen
    createDate
    updateDate
    deleteDate
  }
`;

export const FULL_TWIG_FIELDS = gql`
  fragment FullTwigFields on Twig {
    ...TwigFields
    user {
      id
      name
      email
      verifyEmailDate
      color
    }
    detail {
      ...FullArrowFields
    }
    sheaf {
      ...FullSheafFields
    }
    parent {
      id
    }
    children {
      id
    }
  }
  ${TWIG_FIELDS}
  ${FULL_ARROW_FIELDS}
  ${FULL_SHEAF_FIELDS}
`;


export const TWIG_WITH_XY = gql`
  fragment TwigWithCoords on Twig {
    id
    x
    y
  }
`;

export const TWIG_WITH_PARENT = gql`
  fragment TwigWithParent on Twig {
    id
    parent {
      id
    }
  }
`;

export const TWIG_WITH_POS = gql`
  fragment TwigWithPositioning on Twig {
    id
    detailId
    displayMode
    i
    x
    y
    degree
    rank
    color
    tabId
    groupId
    windowId
    deleteDate
    parent {
      id
    }
    user {
      id
      name
      color
    }
  }
`;

export const TWIG_WITH_Z = gql`
  fragment TwigWithZ on Twig {
    id
    z
  }
`;

export const TWIG_WITH_BROWSER_DATA = gql`
  fragment TwigWithBrowser on Twig {
    id
    windowId
    groupId
    tabId
  }
`
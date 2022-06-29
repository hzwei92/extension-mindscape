import { gql } from '@apollo/client';
import { SHEAF_FIELDS } from '~features/sheaf/sheafFragments';
import { FULL_ROLE_FIELDS } from '../role/roleFragments';
import { VOTE_FIELDS } from '../vote/voteFragments';


export const ARROW_FIELDS = gql`
  fragment ArrowFields on Arrow {
    id
    routeName
    draft
    text
    title
    url
    color
    userId
    inCount
    outCount
    abstractId
    sourceId
    targetId
    twigN
    twigZ
    rootTwigId
    canEdit
    canPost
    canTalk
    canHear
    canView
    lng
    lat
    city
    state
    country
    clicks
    tokens
    weight
    isOpaque
    saveDate
    commitDate
    removeDate
    createDate
    updateDate
    deleteDate
  }
`;

export const FULL_ARROW_FIELDS = gql`
  fragment FullArrowFields on Arrow {
    ...ArrowFields
    user {
      id
      name
      email
      verifyEmailDate
      color
    }
    sheaf {
      ...SheafFields
    }
    votes {
      ...VoteFields
    }
  }
  ${ARROW_FIELDS}
  ${SHEAF_FIELDS}
  ${VOTE_FIELDS}
`;


export const ABSTRACT_ARROW_FIELDS = gql`
  fragment AbstractArrowFields on Arrow {
    ...FullArrowFields
    roles {
      ...FullRoleFields
    }
  }
  ${FULL_ARROW_FIELDS}
  ${FULL_ROLE_FIELDS}
`;

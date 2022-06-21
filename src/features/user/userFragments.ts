import { gql } from '@apollo/client';
import { ABSTRACT_ARROW_FIELDS } from '../arrow/arrowFragments';
import { LEAD_FIELDS } from '../lead/leadFragments';
import { FULL_ROLE_FIELDS } from '../role/roleFragments';

export const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    frameId
    focusId
    name
    lowercaseName
    routeName
    email
    color
    verifyEmailDate
    mapLng
    mapLat
    mapZoom
    activeDate
    deleteDate
  }
`


export const FULL_USER_FIELDS = gql`
  fragment FullUserFields on User {
    ...UserFields
    frame {
      ...AbstractArrowFields
    }
    focus {
      ...AbstractArrowFields
    }
    roles {
      ...FullRoleFields
    }
    leaders {
      ...LeadFields
      leader {
        id
        name
        routeName
        color
        email
        verifyEmailDate
      }
    }
    followers {
      ...LeadFields
      follower {
        id
        name
        routeName
        color
        email
        verifyEmailDate
      }
    }
  }
  ${USER_FIELDS}
  ${ABSTRACT_ARROW_FIELDS}
  ${LEAD_FIELDS}
  ${FULL_ROLE_FIELDS}
`
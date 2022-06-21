import { gql } from '@apollo/client';

export const SUB_FIELDS = gql`
  fragment SubFields on Sub {
    id
    userId
    postId
    deleteDate
  }
`;



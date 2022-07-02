import { gql } from "@apollo/client";

export const SHEAF_FIELDS = gql`
  fragment SheafFields on Sheaf {
    id
    routeName
    sourceId
    targetId
    inCount
    outCount
    clicks
    tokens
    weight
    createDate
    updateDate
    deleteDate
  }
`;
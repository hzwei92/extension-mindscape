import { gql } from "@apollo/client";
import { FULL_ARROW_FIELDS } from "~features/arrow/arrowFragments";

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
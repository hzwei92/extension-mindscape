import { gql } from "@apollo/client";
import { FULL_ARROW_FIELDS } from "~features/arrow/arrowFragments";

export const SHEAF_FIELDS = gql`
  fragment SheafFields on Sheaf {
    id
    routeName
    sourceId
    targetId
    clicks
    tokens
    weight
    createDate
    updateDate
    deleteDate
  }
`;

export const FULL_SHEAF_FIELDS = gql`
  fragment FullSheafFields on Sheaf {
    ...SheafFields
    links {
      ...FullArrowFields
    }
  }
  ${SHEAF_FIELDS}
  ${FULL_ARROW_FIELDS}
`
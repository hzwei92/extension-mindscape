import { gql, useApolloClient, useMutation } from '@apollo/client';
import { useAppSelector } from '~store';
import { ROLE_FIELDS } from '../role/roleFragments';
import { applyRole } from '../role/useApplyRole';
import { selectSessionId } from '../auth/authSlice';
import type { Twig } from './twig';

const OPEN_TWIG = gql`
  mutation OpenTwig($sessionId: String!, $twigId: String!, $shouldOpen: Boolean!) {
    openTwig(sessionId: $sessionId, twigId: $twigId, shouldOpen: $shouldOpen) {
      twig {
        id
        isOpen
      }
      role {
        ...RoleFields
      }
    }
  }
  ${ROLE_FIELDS}
`;

const useOpenTwig = () => {
  const client = useApolloClient();

  const sessionId = useAppSelector(selectSessionId);

  const [open] = useMutation(OPEN_TWIG, {
    onError: error => {
      console.error(error);
    },
    update: (cache, {data: {openTwig}}) => {
      applyRole(cache, openTwig.role);
    },
    onCompleted: data => {
      console.log(data);
    }
  });

  const openTwig = (twig: Twig, shouldOpen: boolean) => {
    open({
      variables: {
        sessionId,
        twigId: twig.id,
        shouldOpen,
      }
    });

    client.cache.modify({
      id: client.cache.identify(twig),
      fields: {
        isOpen: () => shouldOpen
      },
    });
  }
  return { openTwig }
}

export default useOpenTwig
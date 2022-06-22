import { gql, useApolloClient, useMutation } from '@apollo/client';
import { useSnackbar } from 'notistack';
import { useAppSelector } from '~store';
import { ROLE_FIELDS } from '../role/roleFragments';
import { applyRole } from '../role/useApplyRole';
import type { SpaceType } from '../space/space';
import { selectSessionId } from '../auth/authSlice';
import type { Twig } from './twig';
import { TWIG_WITH_XY } from './twigFragments';

const MOVE_TWIG = gql`
  mutation MoveTwig($sessionId: String!, $twigId: String!, $x: Int!, $y: Int!, $displayMode: String!) {
    moveTwig(sessionId: $sessionId, twigId: $twigId, x: $x, y: $y, displayMode: $displayMode) {
      twigs {
        id
        x
        y
      }
      role {
        ...RoleFields
      }
    }
  }
  ${ROLE_FIELDS}
`;

export default function useMoveTwig(space: SpaceType) {
  const client = useApolloClient();

  const sessionId = useAppSelector(selectSessionId);

  const { enqueueSnackbar } = useSnackbar();
  
  const [move] = useMutation(MOVE_TWIG, {
    onError: error => {
      console.error(error);
      enqueueSnackbar(error.message);
    },
    update: (cache, {data: {moveTwig}}) => {
      applyRole(cache, moveTwig.role);
    },
    onCompleted: data => {
      console.log(data);
    },
  });

  const moveTwig = (twigId: string, displayMode: string) => {
    const twig = client.cache.readFragment({
      id: client.cache.identify({
        id: twigId,
        __typename: 'Twig',
      }),
      fragment: TWIG_WITH_XY,
    }) as Twig;

    move({
      variables: {
        sessionId: sessionId,
        twigId: twig.id,
        x: Math.round(twig.x),
        y: Math.round(twig.y),
        displayMode,
      },
    });
  }

  return { moveTwig };
}
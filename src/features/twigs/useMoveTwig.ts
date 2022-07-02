import { gql, useMutation } from '@apollo/client';
import { useSnackbar } from 'notistack';
import { useAppDispatch, useAppSelector } from '~store';
import { FULL_ROLE_FIELDS } from '../role/roleFragments';
import { applyRole } from '../role/useApplyRole';
import type { SpaceType } from '../space/space';
import { selectSessionId } from '../auth/authSlice';
import { addTwigs } from './twigSlice';

const MOVE_TWIG = gql`
  mutation MoveTwig($sessionId: String!, $twigId: String!, $x: Int!, $y: Int!, $displayMode: String!) {
    moveTwig(sessionId: $sessionId, twigId: $twigId, x: $x, y: $y, displayMode: $displayMode) {
      twigs {
        id
        x
        y
      }
      role {
        ...FullRoleFields
      }
    }
  }
  ${FULL_ROLE_FIELDS}
`;

export default function useMoveTwig(space: SpaceType) {
  const dispatch = useAppDispatch();

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

  const moveTwig = (twigId: string, x: number, y: number, displayMode: string) => {
    move({
      variables: {
        sessionId: sessionId,
        twigId,
        x,
        y,
        displayMode,
      },
    });
  }

  return { moveTwig };
}
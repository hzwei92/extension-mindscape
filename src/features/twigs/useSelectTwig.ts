
import { gql, useApolloClient, useMutation, useReactiveVar } from '@apollo/client';
import { useCallback, useContext } from 'react';
import { useAppDispatch, useAppSelector } from '~store';
import { TWIG_WITH_Z } from './twigFragments';
import type { SpaceType } from '../space/space';
import { setSpace } from '../space/spaceSlice';
import type { Twig } from './twig';
import { useSnackbar } from 'notistack';
import { FULL_ROLE_FIELDS } from '../role/roleFragments';
import { selectIdToDescIdToTrue } from './twigSlice';
import type { Arrow } from '../arrow/arrow';
import { selectSessionId } from '~features/auth/authSlice';
import { SpaceContext } from '~features/space/SpaceComponent';

const SELECT_TWIG = gql`
  mutation Select_Twig($sessionId: String!, $twigId: String!) {
    selectTwig(sessionId: $sessionId, twigId: $twigId) {
      twigs {
        id
        z
      }
      abstract {
        id
        selectTwigId
        twigZ
        updateDate
      }
      role {
        ...FullRoleFields
      }
    }
  }
  ${FULL_ROLE_FIELDS}
`;

export default function useSelectTwig(space: SpaceType, canEdit: boolean) {
  const client = useApolloClient();
  const dispatch = useAppDispatch();

  const { setSelectedTwigId } = useContext(SpaceContext);

  const sessionId = useAppSelector(selectSessionId);

  const idToDescIdToTrue = useAppSelector(selectIdToDescIdToTrue(space));
  
  const { enqueueSnackbar } = useSnackbar();

  const [select] = useMutation(SELECT_TWIG, {
    onError: error => {
      console.error(error);
      enqueueSnackbar(error.message);
    },
    onCompleted: data => {
      console.log(data);
    },
  });

  const selectTwig = useCallback((abstract: Arrow, twigId: string) => {
    if (!twigId) return;
    
    if (canEdit) {
      select({
        variables: {
          sessionId,
          twigId,
        },
      });
    }
    else if (space === 'FOCUS') {
      //dispatch(setFocusIsSynced(false));
    }
    else {
      throw new Error('Cannot edit frame')
    }

    setSelectedTwigId(twigId);

    dispatch(setSpace(space));

    const idToCoords: any = {};
    Object.keys(idToDescIdToTrue[twigId] || {})
      .map(descId => {
        return client.cache.readFragment({
          id: client.cache.identify({
            id: descId,
            __typename: 'Twig',
          }),
          fragment: TWIG_WITH_Z
        }) as Twig;
      })
      .sort((a, b) => a.z < b.z ? -1 : 1)
      .forEach((t, i) => {
        client.cache.modify({
          id: client.cache.identify({
            id: t.id,
            __typename: 'Twig',
          }),
          fields: {
            z: () => abstract.twigZ + i,
          }
        })
      });

    client.cache.modify({
      id: client.cache.identify({
        id: twigId,
        __typename: 'Twig'
      }),
      fields: {
        z: () => abstract.twigZ + Object.keys(idToDescIdToTrue[twigId] || {}).length + 1,
      }
    });
    
    client.cache.modify({
      id: client.cache.identify(abstract),
      fields: {
        twigZ: cachedVal => cachedVal + Object.keys(idToDescIdToTrue[twigId] || {}).length + 1,
      },
    })
  }, [space, canEdit, select, setSelectedTwigId])

  return { selectTwig };
}

import { gql, useApolloClient, useMutation } from '@apollo/client';
import { useCallback, useContext } from 'react';
import { useAppDispatch, useAppSelector } from '~store';
import type { SpaceType } from '../space/space';
import { selectIdToDescIdToTrue, setSpace } from '../space/spaceSlice';
import type { Twig } from './twig';
import { useSnackbar } from 'notistack';
import { FULL_ROLE_FIELDS } from '../role/roleFragments';
import { selectIdToTwig } from './twigSlice';
import type { Arrow } from '../arrow/arrow';
import { selectSessionId } from '~features/auth/authSlice';
import { SpaceContext } from '~features/space/SpaceComponent';
import type { IdToType } from '~types';

const SELECT_TWIG = gql`
  mutation Select_Twig($sessionId: String!, $twigId: String!) {
    selectTwig(sessionId: $sessionId, twigId: $twigId) {
      twigs {
        id
        z
      }
      abstract {
        id
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

  const idToTwig: IdToType<Twig> = useAppSelector(selectIdToTwig(space));
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

    const twigs = [];
    Object.keys(idToDescIdToTrue[twigId] || {})
      .map(descId => idToTwig[descId])
      .sort((a, b) => a.z < b.z ? -1 : 1)
      .forEach((t, i) => {
        t.z = abstract.twigZ + i;
        twigs.push(t);
      });

    const twig = idToTwig[twigId];
    twig.z = abstract.twigZ + Object.keys(idToDescIdToTrue[twigId] || {}).length + 1,
    twigs.push(twig);
    
    client.cache.modify({
      id: client.cache.identify(abstract),
      fields: {
        twigZ: cachedVal => cachedVal + Object.keys(idToDescIdToTrue[twigId] || {}).length + 1,
      },
    });
  }, [space, canEdit, select, setSelectedTwigId])

  return { selectTwig };
}
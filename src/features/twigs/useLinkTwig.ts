import { gql, useMutation } from '@apollo/client';
import { useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { addArrows, selectCreateLink, setCreateLink } from '../arrow/arrowSlice';
import { FULL_TWIG_FIELDS } from './twigFragments';
import { addTwigs } from './twigSlice';
import { ROLE_FIELDS } from '../role/roleFragments';
import { selectSessionId } from '~features/auth/authSlice';
import type { SpaceType } from '~features/space/space';
import type { Arrow } from '~features/arrow/arrow';
import { useAppDispatch, useAppSelector } from '~store';

const LINK_TWIGS = gql`
  mutation LinkTwigs($sessionId: String!, $abstractId: String!, $sourceId: String!, $targetId: String!) {
    linkTwigs(sessionId: $sessionId, abstractId: $abstractId, sourceId: $sourceId, targetId: $targetId) {
      abstract {
        id
        twigN
        twigZ
      }
      twig {
        ...FullTwigFields
      }
      source {
        id
        outCount
      }
      target {
        id
        inCount
      }
      role {
        ...RoleFields
      }
    }
  }
  ${FULL_TWIG_FIELDS}
  ${ROLE_FIELDS}
`
export default function useLinkTwigs(space: SpaceType, abstract: Arrow) {
  const dispatch = useAppDispatch();

  const sessionId = useAppSelector(selectSessionId);

  const createLink = useAppSelector(selectCreateLink);

  const { enqueueSnackbar } = useSnackbar();

  const [link] = useMutation(LINK_TWIGS, {
    onError: error => {
      console.error(error);
      enqueueSnackbar(error.message);
    },
    onCompleted: data => {
      console.log(data);

      dispatch(setCreateLink({
        sourceId: '',
        targetId: '',
      }));

      dispatch(addTwigs({
        space,
        twigs: [data.linkTwigs.twig]
      }));
    }
  });

  const linkTwigs = useCallback((detail?: any) => {
    link({
      variables: {
        sessionId,
        abstractId: abstract.id,
        sourceId: detail?.sourceId || createLink.sourceId,
        targetId: detail?.targetId || createLink.targetId,
      },
    });
  }, [link, abstract.id, createLink.sourceId, createLink.targetId]);

  return { linkTwigs }
}
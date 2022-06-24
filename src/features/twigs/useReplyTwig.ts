import { gql, useApolloClient, useMutation } from '@apollo/client';
import { v4 } from 'uuid';
import type { SpaceType } from '../space/space';
import { useAppDispatch, useAppSelector } from '~store';
import { setSpace } from '../space/spaceSlice';
import type { User } from '../user/user';
import { useSnackbar } from 'notistack';
import { addTwigs, finishNewTwig, startNewTwig } from './twigSlice';
import { getEmptyDraft } from '~utils';
import { FULL_TWIG_FIELDS, TWIG_FIELDS } from './twigFragments';
import { FULL_ROLE_FIELDS } from '../role/roleFragments';
import { applyRole } from '../role/useApplyRole';
import { FULL_ARROW_FIELDS } from '../arrow/arrowFragments';
import { Arrow, createArrow } from '../arrow/arrow';
import { addArrows } from '../arrow/arrowSlice';
import { selectSessionId } from '../auth/authSlice';
import useSelectTwig from './useSelectTwig';
import useCenterTwig from './useCenterTwig';
import { useContext } from 'react';
import { SpaceContext } from '~features/space/SpaceComponent';
import { createTwig, Twig } from './twig';

const REPLY_TWIG = gql`
  mutation ReplyTwig(
    $sessionId: String!, 
    $parentTwigId: String!, 
    $twigId: String!, 
    $postId: String!, 
    $x: Int!, 
    $y: Int!, 
    $draft: String!
  ) {
    replyTwig(
      sessionId: $sessionId, 
      parentTwigId: $parentTwigId, 
      twigId: $twigId, 
      postId: $postId, 
      x: $x, 
      y: $y, 
      draft: $draft
    ) {
      abstract {
        id
        twigZ
        twigN
        updateDate
      }
      twigs {
        ...FullTwigFields
      }
      role {
        ...FullRoleFields
      }
    }
  }
  ${FULL_TWIG_FIELDS}
  ${FULL_ARROW_FIELDS}
  ${FULL_ROLE_FIELDS}
`;

export default function useReplyTwig(user: User | null, space: SpaceType, abstract: Arrow, canEdit: boolean) {
  const client = useApolloClient();
  const dispatch = useAppDispatch();

  const { setSelectedTwigId } = useContext(SpaceContext);

  const sessionId = useAppSelector(selectSessionId);

  const { selectTwig } = useSelectTwig(space, canEdit);
  const { centerTwig } = useCenterTwig(user, space);

  const { enqueueSnackbar } = useSnackbar();
  
  const [reply] = useMutation(REPLY_TWIG, {
    onError: error => {
      console.error(error);
      enqueueSnackbar(error.message);
    },
    update: (cache, {data: {replyTwig}}) => {
      applyRole(cache, replyTwig.role);
    },
    onCompleted: data => {
      console.log(data);

      dispatch(finishNewTwig({
        space,
      }));
      dispatch(addTwigs({
        space,
        twigs: data.replyTwig.twigs
      }));

      dispatch(addArrows({
        space,
        arrows: data.replyTwig.twigs.map((twig: Twig) => twig.detail)
      }));
    }
  });

  const replyTwig = (parentTwig: Twig) => {
    if (!user) return;
    
    const dx = parentTwig.x || Math.random() - 0.5;
    const dy = parentTwig.y || Math.random() - 0.5;
    const dr = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

    const postId = v4();
    const twigId = v4();
    const x = Math.round(500 * (dx / dr) + (500 * (Math.random() - 0.5)) + parentTwig.x);
    const y = Math.round(500 * (dy / dr) + (500 * (Math.random() - 0.5)) + parentTwig.y);

    const draft = getEmptyDraft();

    reply({
      variables: {
        sessionId,
        parentTwigId: parentTwig.id,
        twigId,
        postId,
        x,
        y,
        draft,
      },
    });

    const post = createArrow(user, postId, draft, abstract, null, null);
    const twig = createTwig(user, twigId, abstract, post, parentTwig, x, y, null, false);
    
    client.cache.writeQuery({
      query: gql`
        query WriteReplyTwig {
          twig {
            ...FullTwigFields
          }
        }
        ${FULL_TWIG_FIELDS}
      `,
      data: {
        twig,
      },
    });

    twig.createDate = null;
    twig.updateDate = null;
    post.activeDate = null;
    post.saveDate = null;
    post.createDate = null;
    post.updateDate = null;
    
    const newRef = client.cache.writeFragment({
      id: client.cache.identify(twig),
      fragment: TWIG_FIELDS,
      data: twig,
    });

    client.cache.modify({
      id: client.cache.identify(parentTwig),
      fields: {
        children: (cachedRefs = []) => {
          return [...(cachedRefs || []), newRef];
        }
      }
    });

    dispatch(startNewTwig({
      space,
      newTwigId: twigId,
    }));

    dispatch(addTwigs({
      space,
      twigs: [twig],
    }));

    setSelectedTwigId(twigId)

    dispatch(setSpace(space));

    selectTwig(abstract, twigId);

    centerTwig(twig.id, true, 0, {
      x: twig.x,
      y: twig.y
    });
  }
  return { replyTwig }
}
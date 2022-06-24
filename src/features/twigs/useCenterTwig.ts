import { useApolloClient } from '@apollo/client';
import { VIEW_RADIUS } from '~constants';
import type { SpaceType } from '../space/space';
import type { User } from '../user/user';
import type { Twig } from './twig';
import { TWIG_WITH_XY } from './twigFragments';
import { useContext } from 'react';
import { AppContext } from '~newtab/App';
import { SpaceContext } from '~features/space/SpaceComponent';

export default function useCenterTwig(user: User | null, space: SpaceType, scale?: number) {
  const client = useApolloClient();

  const { frameSpaceEl, focusSpaceEl } = useContext(AppContext);
  
  if (!scale) {
    ({ scale } = useContext(SpaceContext));
  }

  console.log('asdf', scale)
  const spaceEl = space === 'FRAME'
    ? frameSpaceEl
    : focusSpaceEl;

  const centerTwig = (twigId: string, isSmooth: boolean, delay: number, coords?: any) => {
    setTimeout(() => {
      if (!spaceEl?.current) return;
      if (!user) return;
      
      const twig = client.cache.readFragment({
        id: client.cache.identify({
          id: twigId,
          __typename: 'Twig',
        }),
        fragment: TWIG_WITH_XY,
      }) as Twig;

      if (!twig) {
        console.error('Missing twig for twigId ' + twigId);
        return;
      };

      const x1 = (twig.x + VIEW_RADIUS) * scale;
      const y1 = (twig.y + VIEW_RADIUS) * scale;

      console.log('centerTwig', scale);

      spaceEl.current.scrollTo({
        left: (x1 - spaceEl.current.clientWidth / 2),
        top: (y1 - spaceEl.current.clientHeight / 2),
        behavior: isSmooth 
          ? 'smooth'
          : 'auto',
      })
    }, delay);
  }

  return { centerTwig };
} 
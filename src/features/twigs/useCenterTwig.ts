import { useApolloClient } from '@apollo/client';
import { useAppSelector } from '~store';
import { VIEW_RADIUS } from '~constants';
import type { SpaceType } from '../space/space';
import type { User } from '../user/user';
import type { Twig } from './twig';
import { TWIG_WITH_XY } from './twigFragments';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from '~newtab/App';

export default function useCenterTwig(user: User | null, space: SpaceType, scale: number) {
  const client = useApolloClient();

  const { frameSpaceEl, focusSpaceEl } = useContext(AppContext);

  const spaceEl = space === 'FRAME'
    ? frameSpaceEl
    : focusSpaceEl;

  const centerTwig = (twigId: string, isSmooth: boolean, delay: number, coords?: any) => {
    //console.log('centerTwig', twigId);
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

      const x1 = (twig.x + VIEW_RADIUS) * scale;
      const y1 = (twig.y + VIEW_RADIUS) * scale;

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
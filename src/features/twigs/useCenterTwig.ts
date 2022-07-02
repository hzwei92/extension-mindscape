import { VIEW_RADIUS } from '~constants';
import type { SpaceType } from '../space/space';
import type { User } from '../user/user';
import { useContext } from 'react';
import { AppContext } from '~newtab/App';
import { SpaceContext } from '~features/space/SpaceComponent';
import { useAppSelector } from '~store';
import { selectTwigIdToPos } from './twigSlice';

export default function useCenterTwig(user: User | null, space: SpaceType, scale?: number) {
  const twigIdToPos = useAppSelector(selectTwigIdToPos(space));

  const { frameSpaceEl, focusSpaceEl } = useContext(AppContext);
  
  if (!scale) {
    ({ scale } = useContext(SpaceContext));
  }

  const spaceEl = space === 'FRAME'
    ? frameSpaceEl
    : focusSpaceEl;

  const centerTwig = (twigId: string, isSmooth: boolean, delay: number, coords?: any) => {
    setTimeout(() => {
      if (!spaceEl?.current) return;
      if (!user) return;
      
      const pos = twigIdToPos[twigId];

      if (!pos) {
        console.error('Missing pos for twigId ' + twigId);
        return;
      };

      const x1 = (pos.x + VIEW_RADIUS) * scale;
      const y1 = (pos.y + VIEW_RADIUS) * scale;

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
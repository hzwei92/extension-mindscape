import { useApolloClient } from '@apollo/client';
import React, { useContext, useState } from 'react';
import { useAppDispatch, useAppSelector } from '~store';
import { VIEW_RADIUS } from '~constants';
import { getPolylineCoords } from '~utils';
import type { SpaceType } from '../space/space';
import type { User } from '../user/user';
import type { Arrow } from './arrow';
import type { PosType, Twig } from '~features/twigs/twig';
import { SpaceContext } from '~features/space/SpaceComponent';
import useSelectTwig from '~features/twigs/useSelectTwig';
import { FULL_ARROW_FIELDS } from './arrowFragments';

interface LinkMarkerComponentProps {
  user: User;
  abstract: Arrow;
  space: SpaceType;
  twig: Twig;
  sourcePos: PosType;
  targetPos: PosType;
  canEdit: boolean;
}
export default function LinkMarkerComponent(props: LinkMarkerComponentProps) {
  const client = useApolloClient();
  const dispatch = useAppDispatch();

  const [linkI, setLinkI] = useState(0);
  const [clickTimeout, setClickTimeout] = useState(null as ReturnType<typeof setTimeout> | null);

  const { selectTwig } = useSelectTwig(props.space, props.canEdit);

  const { selectedTwigId } = useContext(SpaceContext);
  const isSelected = props.twig.id === selectedTwigId;

  // useEffect(() => {
  //   if (links.length > 1) {
  //     const time = 1000 / Math.log(links.length);
  //     const interval = setInterval(() => {
  //       setLinkI(linkI => (linkI + 1) % (links.length));
  //     }, time);
  //     return () => {
  //       clearInterval(interval);
  //     }
  //   }
  // }, [links.length]);

  const link = client.cache.readFragment({
    id: client.cache.identify(props.twig.detail),
    fragment: FULL_ARROW_FIELDS,
    fragmentName: 'FullArrowFields',
  }) as Arrow;
  
  const handleMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
  }

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if  (!isSelected) {
      selectTwig(props.abstract, props.twig.id);
    }
  }

  const rating = 1;
  return (
    <g onClick={handleClick} onMouseDown={handleMouseDown} style={{
      cursor: 'pointer'
    }}>
      <polyline 
        points={getPolylineCoords(
          10 + (20 * (isSelected ? rating + 1 : rating)),
          props.sourcePos.x + VIEW_RADIUS,
          props.sourcePos.y + VIEW_RADIUS,
          props.targetPos.x + VIEW_RADIUS,
          props.targetPos.y + VIEW_RADIUS,
        )}
        strokeWidth={2 + (isSelected ? 2 : 0) + rating}
        markerMid={`url(#marker-${link.userId})`}
        markerEnd={`url(#marker-${link.userId})`}
      />
      <line 
        style={{
          cursor: 'pointer',
          opacity: isSelected 
            ? .4 
            : .2,
        }}
        x1={props.sourcePos.x + VIEW_RADIUS}
        y1={props.sourcePos.y + VIEW_RADIUS}
        x2={props.targetPos.x + VIEW_RADIUS}
        y2={props.targetPos.y + VIEW_RADIUS}
        strokeWidth={10 * ((isSelected ? 4 : 2) + rating)}
        stroke={link.user.color}
        strokeLinecap={'round'}
      />
    </g>
  )
}
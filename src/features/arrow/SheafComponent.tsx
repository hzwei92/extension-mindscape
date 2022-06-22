import { useApolloClient } from '@apollo/client';
import React, { useContext, useState } from 'react';
import { useAppDispatch, useAppSelector } from '~store';
import { VIEW_RADIUS } from '~constants';
import { getPolylineCoords } from '~utils';
import type { SpaceType } from '../space/space';
import type { User } from '../user/user';
import type { Arrow } from './arrow';
import type { Twig } from '~features/twigs/twig';
import { selectRequiresRerender } from '~features/twigs/twigSlice';
import { FULL_TWIG_FIELDS } from '~features/twigs/twigFragments';
import { SpaceContext } from '~features/space/SpaceComponent';

interface SheafComponentProps {
  user: User;
  abstract: Arrow;
  space: SpaceType;
  twig: Twig;
  canEdit: boolean;
}
export default function SheafComponent(props: SheafComponentProps) {
  const client = useApolloClient();
  const dispatch = useAppDispatch();

  const [linkI, setLinkI] = useState(0);
  const [clickTimeout, setClickTimeout] = useState(null as ReturnType<typeof setTimeout> | null);

  //const { selectTwig } = useSelectTwig(props.space, props.canEdit)
  //const { openTwig } = useOpenTwig();

  const { selectedTwigId } = useContext(SpaceContext);
  const isSelected = props.twig.id === selectedTwigId;

  const sourceTwig = client.cache.readFragment({
    id: client.cache.identify({
      id: props.twig.sourceId,
      __typename: 'Twig',
    }),
    fragment: FULL_TWIG_FIELDS,
    fragmentName: 'FullTwigFields'
  }) as Twig;

  const targetTwig = client.cache.readFragment({
    id: client.cache.identify({
      id: props.twig.targetId,
      __typename: 'Twig',
    }),
    fragment: FULL_TWIG_FIELDS,
    fragmentName: 'FullTwigFields'
  }) as Twig;

  useAppSelector(state => selectRequiresRerender(state, props.space, sourceTwig.id));
  useAppSelector(state => selectRequiresRerender(state, props.space, targetTwig.id));

  if (!sourceTwig || sourceTwig.deleteDate || !targetTwig || targetTwig.deleteDate) return null;

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

  
  const handleMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
  }

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if  (!isSelected) {
      //selectTwig(props.abstract, props.twig);
    }
    if (!props.twig.isOpen) {
      //openTwig(props.twig, true);
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
          sourceTwig.x + VIEW_RADIUS,
          sourceTwig.y + VIEW_RADIUS,
          targetTwig.x + VIEW_RADIUS,
          targetTwig.y + VIEW_RADIUS,
        )}
        strokeWidth={2 + (isSelected ? 2 : 0) + rating}
        markerMid={`url(#marker-${props.twig.detail.userId})`}
        markerEnd={`url(#marker-${props.twig.detail.userId})`}
      />
      <line 
        style={{
          cursor: 'pointer',
          opacity: isSelected 
            ? .2 
            : .05,
        }}
        x1={sourceTwig.x + VIEW_RADIUS}
        y1={sourceTwig.y + VIEW_RADIUS}
        x2={targetTwig.x + VIEW_RADIUS}
        y2={targetTwig.y + VIEW_RADIUS}
        strokeWidth={10 * ((isSelected ? 4 : 2) + rating)}
        stroke={props.twig.detail.user.color}
        strokeLinecap={'round'}
      />
    </g>
  )
}
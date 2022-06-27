import { useApolloClient } from '@apollo/client';
import { Box, Link, Typography } from '@mui/material';
import type React from 'react';
import type { SpaceType } from '../space/space';
import { getTimeString } from '~utils';
import { useAppDispatch, useAppSelector } from '~store';
import { selectSpace } from '../space/spaceSlice';
import UserTag from '../user/UserTag';
import { selectColor } from '../window/windowSlice';
import type { User } from '../user/user';
import { TWIG_WIDTH } from '~constants';
import type { Arrow } from '~features/arrow/arrow';
import { FULL_SHEAF_FIELDS } from './sheafFragments';
import type { Sheaf } from './sheaf';
import ArrowComponent from '~features/arrow/ArrowComponent';
import type { Twig } from '~features/twigs/twig';

interface SheafProps {
  user: User | null;
  space: SpaceType | null;
  abstract: Arrow;
  twig: Twig;
  instanceId: string;
  isWindow: boolean;
  isGroup: boolean;
  isTab: boolean;
}

export default function SheafComponent(props: SheafProps) {
  const client = useApolloClient();
  const dispatch = useAppDispatch();

  const sheaf = client.cache.readFragment({
    id: client.cache.identify({
      id: props.twig.sheafId,
      __typename: 'Sheaf',
    }),
    fragment: FULL_SHEAF_FIELDS,
    fragmentName: 'FullSheafFields',
  }) as Sheaf;

  const link = sheaf.links[0];

  const color = useAppSelector(selectColor(true));

  const handleJamClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  }

  const handleMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
  }


  return (
    <Box sx={{
      margin:1,
    }}>
      <Box sx={{
        fontSize: 14,
        color,
        paddingBottom: '4px',
      }}>
        <ArrowComponent 
          user={props.user}
          space={props.space}
          abstract={props.abstract}
          arrowId={link.id}
          instanceId={props.twig.id}
          isWindow={false}
          isGroup={false}
          isTab={false}
        />
      </Box>
    </Box>
  )

}
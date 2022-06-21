import { useApolloClient } from '@apollo/client';
import { Box, Link, Typography } from '@mui/material';
import type React from 'react';
import type { SpaceType } from '../space/space';
import type { Arrow } from './arrow';
import { getTimeString } from '~utils';
import { useAppDispatch, useAppSelector } from '~store';
import { selectSpace } from '../space/spaceSlice';
import UserTag from '../user/UserTag';
import { selectColor, selectWidth } from '../window/windowSlice';
import type { User } from '../user/user';
import ArrowEditor from './ArrowEditor';
import { TWIG_WIDTH } from '~constants';

interface ArrowProps {
  user: User | null;
  space: SpaceType | null;
  abstract: Arrow;
  arrow: Arrow;
  instanceId: string;
  isWindow: boolean;
  isGroup: boolean;
  isTab: boolean;
}

export default function ArrowComponent(props: ArrowProps) {
  const client = useApolloClient();

  const width = useAppSelector(selectWidth);
  const color = useAppSelector(selectColor(true));
  const space = useAppSelector(selectSpace);
  
  //useAppSelector(state => selectInstanceById(state, props.instanceId)); // rerender on instance change
  const dispatch = useAppDispatch();

  // useEffect(() => {
  //   dispatch(addInstance({
  //     id: props.instanceId,
  //     arrowId: arrow.id,
  //     isNewlySaved: false,
  //     shouldRefreshDraft: false,
  //   }));
  //   return () => {
  //     dispatch(removeInstance(props.instanceId));
  //   };
  // }, []);

  const handleJamClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  }

  const handleMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
  }

  const time = new Date(props.arrow.removeDate || props.arrow.commitDate || props.arrow.saveDate || Date.now()).getTime();
  const timeString = getTimeString(time);

  return (
    <Box sx={{
      margin:1,
    }}>
      <Box sx={{
        fontSize: 14,
        color,
        paddingBottom: '4px',
      }}>
        <UserTag user={props.user} tagUser={props.arrow.user} />
        { ' ' }
        { timeString }
        {
          props.arrow.removeDate
            ? ' (deleted)'
            : props.arrow.commitDate 
              ? ' (committed)'
              : null
        }
        {
          // props.arrow.ownerArrow.id === props.abstract?.id
          //   ? null
          //   : <Box sx={{
          //       marginTop: 1,
          //     }}>
          //       &nbsp;&nbsp;
          //       <Link color={arrow.ownerArrow.color} onMouseDown={handleMouseDown} onClick={handleJamClick}
          //         sx={{
          //           color: arrow.ownerArrow.color,
          //           cursor: 'pointer'
          //         }}
          //       >
          //         {`m/${arrow.ownerArrow.routeName}`}
          //       </Link>
          //     </Box>
        }
      </Box>
      <Box sx={{
        width: TWIG_WIDTH - 32,
      }}>
        {
          props.arrow.draft
            ? <ArrowEditor
                user={props.user}
                space={props.space}
                arrow={props.arrow}
                isReadonly={false}
                instanceId={props.instanceId}
              />
            : props.isTab
              ? <Box>
                  <Typography fontWeight='bold' fontSize={20}>
                    {props.arrow.title}
                  </Typography>
                  <Box>
                    <Link sx={{
                      cursor: 'pointer',
                    }}>
                      {props.arrow.url}
                    </Link>
                  </Box>
                </Box>
              : null
        }

      </Box>
    </Box>
  )

}
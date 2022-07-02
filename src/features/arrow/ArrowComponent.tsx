import { useApolloClient } from '@apollo/client';
import { Box, Link, Typography } from '@mui/material';
import type React from 'react';
import type { SpaceType } from '../space/space';
import type { Arrow } from './arrow';
import { getTimeString } from '~utils';
import { useAppDispatch, useAppSelector } from '~store';
import UserTag from '../user/UserTag';
import { selectColor } from '../window/windowSlice';
import type { User } from '../user/user';
import ArrowEditor from './ArrowEditor';
import { TWIG_WIDTH } from '~constants';
import ArrowVoter from './ArrowVoter';
import { selectArrow } from './arrowSlice';

interface ArrowProps {
  user: User | null;
  space: SpaceType | null;
  abstract: Arrow;
  arrowId: string;
  instanceId: string;
  isWindow: boolean;
  isGroup: boolean;
  isTab: boolean;
}

export default function ArrowComponent(props: ArrowProps) {
  const arrow = useAppSelector(state => selectArrow(state, props.arrowId));

  const color = useAppSelector(selectColor(true));
  
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

  if (!arrow) return null;

  const time = new Date(arrow.removeDate || arrow.commitDate || arrow.saveDate || Date.now()).getTime();
  const timeString = getTimeString(time);

  return (
    <Box sx={{
      margin:1,
      position: 'relative',
    }}>
      <Box sx={{
        position: 'absolute',
        left: -35,
        top: -10,
      }}>
        <ArrowVoter 
          user={props.user}
          space={props.space}
          arrow={arrow}
        />
      </Box>
      <Box sx={{
        fontSize: 14,
        color,
        paddingBottom: '4px',
      }}>
        <UserTag user={props.user} tagUser={arrow.user} />
        { ' ' }
        { timeString }
        {
          arrow.removeDate
            ? ' (deleted)'
            : arrow.commitDate 
              ? ' (committed)'
              : null
        }
        {
          // arrow.ownerArrow.id === props.abstract?.id
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
        width: TWIG_WIDTH - 60,
      }}>
        {
          !arrow.url && !arrow.title
            ? <ArrowEditor
                user={props.user}
                space={props.space}
                arrow={arrow}
                isReadonly={false}
                instanceId={props.instanceId}
              />
            : <Box sx={{
                paddingTop: '5px',
              }}>
                <Typography fontWeight='bold' fontSize={20}>
                  {arrow.title}
                </Typography>
                {
                  arrow.url
                    ? <Box>
                        <Link component='button' sx={{
                          cursor: 'pointer',
                          whiteSpace: 'pre-wrap',
                          width: '100%',
                          wordWrap: 'break-word',
                          textAlign: 'left',
                        }}>
                          {arrow.url}
                        </Link>
                      </Box>
                    : null
                }
              </Box>
        }

      </Box>
    </Box>
  )

}
import { Box, Button, Card, Fab } from '@mui/material';
import { useAppDispatch, useAppSelector } from '~store';
import { MAX_Z_INDEX, MOBILE_WIDTH, NOT_FOUND } from '~constants';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import SyncIcon from '@mui/icons-material/Sync';
import { Dispatch, SetStateAction, useContext } from 'react';
import { scaleDown, scaleUp } from '~utils';
import { SpaceType } from './space';
import { selectIsOpen, selectSpace } from './spaceSlice';
import { selectMenuMode } from '../menu/menuSlice';
import { AppContext } from '~newtab/App';

interface SpaceControlsProps {
  space: SpaceType;
  setShowSettings: Dispatch<SetStateAction<boolean>>;
  setShowRoles: Dispatch<SetStateAction<boolean>>;
  scale: number;
  setScale: Dispatch<SetStateAction<number>>;
}
export default function SpaceControls(props: SpaceControlsProps) {
  const dispatch = useAppDispatch();

  const { width } = useContext(AppContext);

  const menuMode = useAppSelector(selectMenuMode);

  const space = useAppSelector(selectSpace);

  const frameIsOpen = useAppSelector(selectIsOpen(SpaceType.FRAME));
  const focusIsOpen = useAppSelector(selectIsOpen(SpaceType.FOCUS));
  const isSynced = true //useAppSelector(selectFocusIsSynced);

  const { frameSpaceEl, focusSpaceEl } = useContext(AppContext);

  const spaceEl = props.space === 'FRAME'
    ? frameSpaceEl
    : focusSpaceEl;

  const handleScaleDownClick = (event: React.MouseEvent) => {
    event.stopPropagation();

    if (!spaceEl?.current) return;

    const center = {
      x: (spaceEl.current.scrollLeft + (spaceEl.current.clientWidth / 2)) / props.scale,
      y: (spaceEl.current.scrollTop + (spaceEl.current.clientHeight / 2)) / props.scale,
    }
    const scale1 = scaleDown(props.scale);

    props.setScale(scale1);

    const left = (center.x * scale1) - (spaceEl.current.clientWidth / 2);
    const top = (center.y * scale1) - (spaceEl.current.clientHeight / 2);

    spaceEl.current.scrollTo({
      left,
      top,
    })
  };

  const handleScaleUpClick = (event: React.MouseEvent) => {
    event.stopPropagation();

    if (!spaceEl?.current) return;

    const center = {
      x: (spaceEl.current.scrollLeft + (spaceEl.current.clientWidth / 2)) / props.scale,
      y: (spaceEl.current.scrollTop + (spaceEl.current.clientHeight / 2)) / props.scale,
    };
    const scale1 = scaleUp(props.scale);

    props.setScale(scale1);

    const left = (center.x * scale1) - (spaceEl.current.clientWidth / 2);
    const top = (center.y * scale1) - (spaceEl.current.clientHeight / 2);
    setTimeout(() => {
      spaceEl.current?.scrollTo({
        left,
        top,
      });
    }, 5)
  };

  const handleSettingsClick = () => {
    props.setShowSettings(show => !show)
  };

  const handleRolesClick = () => {
    props.setShowRoles(show => !show)
  }

  const handleSyncClick = () => {
    //dispatch(setFocusIsSynced(true));
    //dispatch(setFocusShouldSync(true));
  };

  if (
    props.space === 'FOCUS' && 
    (!focusIsOpen ||
    (width < MOBILE_WIDTH && (space === 'FRAME' || menuMode)))
  ) return null;


  if (
    props.space === 'FRAME' &&
    (!frameIsOpen ||
    (width < MOBILE_WIDTH && (space === 'FOCUS' || menuMode)))
  ) return null;

  return (
    <Box sx={{
      position: 'absolute',
      right: 190,
      top: 5,
    }}>
      <Box sx={{
        position: 'fixed',
        flexDirection: 'row',
        zIndex: MAX_Z_INDEX,
        display: 'flex',
      }}>
        <Box sx={{
          verticalAlign:'top',
        }}>
          <Card variant='outlined' sx={{
            margin: 'auto',
            padding: 1,
            whiteSpace: 'nowrap',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}>
            <Button disabled={props.scale === .03125} variant='contained' onClick={handleScaleDownClick} sx={{
              minWidth: 0,
              minHeight: 0,
              width: '20px',
              height: '20px',
            }}>
              <RemoveIcon />
            </Button>
            <Box component='span' sx={{
              width: '50px',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
            }}>
              { Math.round(props.scale * 100) }%
            </Box>
            <Button disabled={props.scale === 4} variant='contained' onClick={handleScaleUpClick} sx={{
              minWidth: 0,
              minHeight: 0,
              width: '20px',
              height: '20px'
            }}>
              <AddIcon />
            </Button>
          </Card>
        </Box>
        &nbsp;&nbsp;
        <Box sx={{
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Fab title='Settings' size='small' color='primary' onClick={handleSettingsClick} sx={{
            fontSize: 20,
          }}>
            <SettingsIcon fontSize='inherit'/>
          </Fab> 
          <Fab title='Members' size='small' color='primary' onClick={handleRolesClick} sx={{
            fontSize: 20,
            marginTop: 1,
          }}>
            <PeopleIcon fontSize='inherit'/>
          </Fab> 
          <Box sx={{
            display: isSynced || props.space === 'FRAME'
              ? 'none'
              : 'block'
          }}>
            <Fab title='Sync' size='small' color='primary' onClick={handleSyncClick} sx={{
              marginTop: 1,
              fontSize: 20,
            }}>
              <SyncIcon fontSize='inherit'/>
            </Fab>  
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
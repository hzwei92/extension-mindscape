import { Box, Card, createTheme, IconButton, Link, Theme, ThemeProvider } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '~store';
import { MAX_Z_INDEX, MOBILE_WIDTH, SPACE_BAR_HEIGHT } from '~constants';
import { selectHeight, selectPalette, selectWidth } from '../window/windowSlice';
import type { User } from '../user/user';
import { selectFrameWidth, selectIsResizing, selectSpace, setFrameWidth, setIsResizing } from '../space/spaceSlice';
import { selectActualMenuWidth, selectMenuIsResizing, selectMenuMode } from '../menu/menuSlice';
import SpaceComponent from '../space/SpaceComponent';
import CloseIcon from '@mui/icons-material/Close';
import { getAppBarWidth, getColor } from '~utils';
import { SpaceType } from '~features/space/space';

interface FrameComponentProps {
  user: User | null;
}

export default function FrameComponent(props: FrameComponentProps) {
  const dispatch = useAppDispatch();

  const palette = useAppSelector(selectPalette);
  const width = useAppSelector(selectWidth);
  const height = useAppSelector(selectHeight)
  const menuMode = useAppSelector(selectMenuMode);
  const menuIsResizing = useAppSelector(selectMenuIsResizing);
  const menuWidth = useAppSelector(selectActualMenuWidth);

  const spaceIsResizing = useAppSelector(selectIsResizing);
  const frameWidth = useAppSelector(selectFrameWidth);
  const space = useAppSelector(selectSpace);

  const focusIsOpen = false //useAppSelector(selectIsOpen('FOCUS'));

  const [theme, setTheme] = useState(createTheme({
    palette: {
      primary: {
        main: palette === 'dark'
          ? '#000000'
          : '#ffffff',
      },
      mode: palette,
    },
    zIndex: {
      modal: MAX_Z_INDEX + 1000,
      snackbar: MAX_Z_INDEX + 10000
    },
  }));
  const [showResizer, setShowResizer] = useState(false);

  useEffect(() => {
    if (!props.user?.frame) return;
    setTheme(createTheme({
      palette: {
        primary: {
          main: props.user?.frame?.color,
        },
        mode: palette,
      },
      zIndex: {
        modal: MAX_Z_INDEX + 1000,
        snackbar: MAX_Z_INDEX + 10000
      },
    }));
  }, [props.user?.frame?.color, palette]);

  useEffect(() => {
    if (focusIsOpen) return;
    dispatch(setFrameWidth(width - getAppBarWidth(width) - menuWidth));
  }, [focusIsOpen, width, menuWidth])

  if (!theme) return null;
  
  const handleClick = () => {
    console.log('frame');
  }

  const handleResizeMouseEnter = (event: React.MouseEvent) => {
    setShowResizer(true);
  };

  const handleResizeMouseLeave = (event: React.MouseEvent) => {
    setShowResizer(false);
  };

  const handleResizeMouseDown = (event: React.MouseEvent) => {
    dispatch(setIsResizing(true));
  };

  const handleCloseClick = (event: React.MouseEvent) => {
    
  };

  return (
    <ThemeProvider theme={theme}>
      <Box onClick={handleClick} sx={{
        position: 'relative',
        width: width < MOBILE_WIDTH && (space === 'FOCUS' || menuMode)
          ? 0
          : frameWidth,
        height: height,
        transition: menuIsResizing || spaceIsResizing
          ? 'none'
          : 'width 0.5s',
        display: 'flex',
        flexDirection: 'row',
      }}>
        <Box sx={{
          position: 'absolute',
          left: 0,
          top: 0,
        }}>
          <Card elevation={5} sx={{
            position: 'fixed',
            zIndex: MAX_Z_INDEX,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            width: frameWidth,
            height: `${SPACE_BAR_HEIGHT - 2}px`,
            transition: menuIsResizing || spaceIsResizing
              ? 'none'
              : 'width 0.5s',
          }}>
            <Box sx={{
              whiteSpace: 'nowrap',
              flexDirection: 'column',
              justifyContent: 'center',
              margin: 2,
              fontSize: 14,
            }}>
              <Box sx={{
                display: props.user
                  ? 'block'
                  : 'none'
              }}>
                Logged in as&nbsp;
                <Link
                  component='span'
                  sx={{
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  u/{props.user?.name}
                </Link>
              </Box>
            </Box>
            <Box sx={{
              whiteSpace: 'nowrap',
              flexDirection: 'column',
              justifyContent: 'center',
              margin: 1,
              display: focusIsOpen
                ? 'flex'
                : 'none',
            }}>
              <IconButton onClick={handleCloseClick} sx={{
                fontSize: 16,
              }}> 
                <CloseIcon fontSize='inherit'/>
              </IconButton>
            </Box>
          </Card>
        </Box>
        <SpaceComponent user={props.user} space={SpaceType.FRAME}/>
        <Box 
          onMouseDown={handleResizeMouseDown}
          onMouseEnter={handleResizeMouseEnter}
          onMouseLeave={handleResizeMouseLeave} 
          sx={{
            height: '100%',
            width: 4,
            backgroundColor: showResizer
              ? 'primary.main'
              : getColor(palette, true),
            cursor: 'col-resize',
            display: focusIsOpen
              ? 'block'
              : 'none'
          }}
        />
      </Box>
    </ThemeProvider>
  );
}
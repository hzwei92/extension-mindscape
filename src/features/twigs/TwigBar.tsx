import { Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import React, { Dispatch, SetStateAction } from 'react';
import type { Twig } from './twig';
import type { DragState, SpaceType } from '../space/space';
import { persistor, useAppDispatch, useAppSelector } from '~store';
import type { Arrow } from '../arrow/arrow';
import { selectPalette } from '../window/windowSlice';
import { selectCreateLink } from '../arrow/arrowSlice';
import AdjustIcon from '@mui/icons-material/Adjust';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import { getTwigColor } from '~utils';
import { useApolloClient } from '@apollo/client';
import { DisplayMode } from '~constants';
import { addTwigs } from './twigSlice';

interface TwigBarProps {
  space: SpaceType;
  abstract: Arrow;
  twig: Twig;
  canEdit: boolean;
  isSelected: boolean;
  setTouches: Dispatch<SetStateAction<React.TouchList | null>>;
  drag: DragState;
  setDrag: Dispatch<SetStateAction<DragState>>;
}

function TwigBar(props: TwigBarProps) {
  const client = useApolloClient();
  const dispatch = useAppDispatch();

  const palette = useAppSelector(selectPalette);
  const color = palette === 'dark'
    ? 'black'
    : 'white';
  const createLink = useAppSelector(selectCreateLink);

  const beginDrag = () => {
    if (!props.twig.parent) return;
    if (props.twig.displayMode !== DisplayMode.SCATTERED) {

      const twig = Object.assign({}, props.twig, {
        displayMode: DisplayMode.SCATTERED,
      });

      dispatch(addTwigs({
        space: props.space,
        twigs: [twig]
      }));
    }
    props.setDrag({
      isScreen: false,
      twigId: props.twig.id,
      dx: 0,
      dy: 0,
      targetTwigId: '',
    });
  }

  const dontDrag = (event: React.MouseEvent) => {
    event.stopPropagation();
  }

  const handleRemoveClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    /*
    dispatch(setRemove({
      twig: props.twig,
      showDialog: true,
    }));*/
  }

  const handleMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    beginDrag();
  }

  const handleTouchStart = (event: React.TouchEvent) => {
    event.stopPropagation();
    props.setTouches(event.touches);
    beginDrag();
  }

  return (
    <Box
      title={props.twig.id}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      sx={{
        backgroundColor: getTwigColor(props.twig.color) || props.twig.user.color,
        textAlign: 'left',
        cursor: props.abstract.id === props.twig.detailId
          ? createLink.sourceId
            ? 'crosshair'
            : 'default'
          : createLink.sourceId
            ? 'crosshair'
            : props.drag.twigId
              ? 'grabbing'
              : 'grab',
        touchAction: 'none',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
      }}
    >
      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: '3px',
        paddingRight: '5px',
        width: '100%',
      }}>
        <Box sx={{
          display: 'flex',
        }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontSize: 14,
        }}>
        </Box>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <Typography component='span' sx={{
            marginLeft: '3px',
            fontSize: 12,
            color,
          }}>
            {props.twig.id}
            <br/>
            {props.twig.i}...
            {props.twig.degree}:{props.twig.rank}...
            {props.twig.displayMode}...
            {props.twig.tabId || props.twig.groupId || props.twig.windowId}
          </Typography>
        </Box>
        </Box>
        <Box>
          <IconButton
            disabled={props.abstract.id === props.twig.detailId || !props.canEdit || !!createLink.sourceId} 
            size='small'
            color='inherit'
            onMouseDown={dontDrag}
            onClick={handleRemoveClick}
            sx={{
              fontSize: 10,
              color,
            }}
          >
            <CloseIcon fontSize='inherit'/>
          </IconButton>
        </Box>
      </Box>
    </Box>
  )
}

export default React.memo(TwigBar)
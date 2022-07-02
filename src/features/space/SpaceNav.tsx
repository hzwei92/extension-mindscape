import { useApolloClient } from '@apollo/client';
import React, { useContext, useEffect, useState } from 'react';
import { Box, Fab } from '@mui/material';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import FastForwardIcon from '@mui/icons-material/FastForward';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import { SpaceType } from './space';
import { useAppDispatch, useAppSelector } from '~store';
import { MAX_Z_INDEX, MOBILE_WIDTH } from '~constants';
import { selectIsOpen, selectSpace, setSpace } from './spaceSlice';
import { selectMenuMode } from '../menu/menuSlice';
import type { Arrow } from '../arrow/arrow';
import type { User } from '../user/user';
import { selectIdToTwig } from '~features/twigs/twigSlice';
import type { Twig } from '~features/twigs/twig';
import useCenterTwig from '~features/twigs/useCenterTwig';
import useSelectTwig from '~features/twigs/useSelectTwig';
import { AppContext } from '~newtab/App';
import { SpaceContext } from './SpaceComponent';
import { getTwigColor } from '~utils';

interface SpaceNavProps {
  user: User | null;
  space: SpaceType;
  abstract: Arrow;
  canEdit: boolean;
}

export default function SpaceNav(props: SpaceNavProps) {
  const client = useApolloClient();
  const dispatch = useAppDispatch();

  const { width } = useContext(AppContext);
  const { selectedTwigId } = useContext(SpaceContext);

  const menuMode = useAppSelector(selectMenuMode);

  const space = useAppSelector(selectSpace);
  const frameIsOpen = useAppSelector(selectIsOpen(SpaceType.FRAME));
  const focusIsOpen = useAppSelector(selectIsOpen(SpaceType.FOCUS));

  const idToTwig = useAppSelector(selectIdToTwig(props.space))

  const [twigs, setTwigs] = useState([] as Twig[]);
  const [index, setIndex] = useState(0);
  const [isInit, setIsInit] = useState(false);
  const hasEarlier = index > 0;
  const hasLater = index < twigs.length - 1;

  const { centerTwig } = useCenterTwig(props.user, props.space);
  const { selectTwig } = useSelectTwig(props.space, props.canEdit)

  useEffect(() => {
    const sortedTwigs = Object.keys(idToTwig).map(id => idToTwig[id])
      .filter(twig => twig && !twig.deleteDate)
      .sort((a, b) => a.i < b.i ? -1 : 1);
      
    setTwigs(sortedTwigs);
  }, [idToTwig]);

  useEffect(() => {
    if (!selectedTwigId) return;

    twigs.some((twig, i) => {
      if (twig.id === selectedTwigId) {
        setIndex(i);
        return true;
      }
      return false;
    });
  }, [selectedTwigId]);

  useEffect(() => {
    if (isInit || !twigs.length) return;
    centerTwig(selectedTwigId, false, 0)
    setIsInit(true);
  }, [isInit, twigs])

  useEffect(() => {
    setIsInit(false);
  }, [props.abstract.id])

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


  const select = (twig: Twig, isInstant?: boolean) => {
    if (selectedTwigId !== twig.id) {
      selectTwig(props.abstract, twig.id);
    }
    centerTwig(twig.id, !isInstant, 0);
    setIndex(twig.i);
  }

  const handleNavEarliest = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const twig = twigs[0];
    select(twig);
  }

  const handleNavPrev = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const twig = twigs[index - 1];
    select(twig);
  }

  const handleNavNext = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const twig = twigs[index + 1];
    select(twig);
  }

  const handleNavLatest = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const twig = twigs[twigs.length - 1];
    select(twig);
  }

  const handleNavFocus = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    const twig = twigs[index];
    if (space !== props.space) {
      dispatch(setSpace(props.space));
    }
    centerTwig(twig.id, true, 0);
  }
  
  return (
    <Box sx={{
      position: 'absolute',
      marginLeft: '-140px',
      left: '50%',
      bottom: 70,
      zIndex: MAX_Z_INDEX + 100,
    }}>
    <Box sx={{
      position: 'fixed',
      whiteSpace: 'nowrap',
    }}>
      <Fab title='Earliest' size='small' disabled={!hasEarlier} onClick={handleNavEarliest}  sx={{
        margin: 1,
        color: hasEarlier 
          ? (getTwigColor(twigs[0]?.color) || twigs[0]?.user?.color || 'dimgrey') 
          : 'dimgrey',
      }}>
        <SkipPreviousIcon color='inherit' />
      </Fab>
      <Fab title='Previous' size='small' disabled={!hasEarlier} onClick={handleNavPrev} sx={{
        margin: 1,
        color: hasEarlier 
          ? (getTwigColor(twigs[index - 1]?.color) || twigs[index - 1]?.user?.color || 'dimgrey') 
          : 'dimgrey',
      }}>
        <FastRewindIcon color='inherit' />
      </Fab>
      <Fab title='Selected' size='small' disabled={!selectedTwigId} onClick={handleNavFocus} sx={{
        margin: 1,
        color:  getTwigColor(twigs[index]?.color) || twigs[index]?.user?.color || 'dimgrey',
        border: space === props.space
          ? '3px solid'
          : 'none'
      }}>
        <CenterFocusStrongIcon color='inherit' />
      </Fab>
      <Fab title='Next' size='small' disabled={!hasLater} onClick={handleNavNext} sx={{
        margin: 1,
        color: hasLater 
          ? (getTwigColor(twigs[index + 1]?.color) || twigs[index + 1]?.user?.color || 'dimgrey') 
          : 'dimgrey',
      }}>
        <FastForwardIcon color='inherit' />
      </Fab>
      <Fab title='Latest' size='small' disabled={!hasLater} onClick={handleNavLatest} sx={{
        margin: 1,
        color: hasLater 
          ? (getTwigColor(twigs[twigs.length - 1]?.color )|| twigs[twigs.length - 1]?.user?.color  || 'dimgrey') 
          : 'dimgrey',
      }}>
        <SkipNextIcon color='inherit' />
      </Fab>
    </Box>
    </Box>
  );
}
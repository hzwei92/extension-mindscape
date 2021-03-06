import { gql, useApolloClient } from '@apollo/client';
import { Box, Card, IconButton } from '@mui/material';
import React, { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '~store';
import { DisplayMode, TWIG_WIDTH } from '~constants';
import type { Role } from '../role/role';
import type { DragState, SpaceType } from '../space/space';
import type { User } from '../user/user';
import { selectPalette } from '../window/windowSlice';
import type { Twig } from './twig';
import { selectIdToTwig } from './twigSlice';
import { selectCreateLink, setCreateLink } from '../arrow/arrowSlice';
import type { Arrow } from '../arrow/arrow';
import RemoveIcon from '@mui/icons-material/Remove';
import { getTwigColor } from '~utils';
import TwigPostComponent from './TwigPostComponent';
import { SpaceContext } from '~features/space/SpaceComponent';
import useOpenTwig from './useOpenTwig';
import useSelectTwig from './useSelectTwig';
import useLinkTwigs from './useLinkTwig';
import ArrowComponent from '~features/arrow/ArrowComponent';
import { selectChildIdToTrue } from '~features/space/spaceSlice';

interface TwigLinkComponentProps {
  user: User | null;
  space: SpaceType;
  role: Role | null;
  abstract: Arrow;
  twig: Twig;
  canEdit: boolean;
  canPost: boolean;
  canView: boolean;
  setTouches: Dispatch<SetStateAction<React.TouchList | null>>;
  drag: DragState;
  setDrag: Dispatch<SetStateAction<DragState>>;
}

function TwigLinkComponent(props: TwigLinkComponentProps) {
  //console.log('twig link', props.twig.id);

  const dispatch = useAppDispatch();

  //useAppSelector(state => selectInstanceById(state, props.twigId)); // rerender on instance change

  const palette = useAppSelector(selectPalette);
  const createLink = useAppSelector(selectCreateLink);
  
  const { selectedTwigId } = useContext(SpaceContext);
  const isSelected = props.twig.id === selectedTwigId;
  
  const idToTwig = useAppSelector(selectIdToTwig(props.space));
  const childIdToTrue = useAppSelector(state => selectChildIdToTrue(state, props.space, props.twig.id));
  const verticalChildren = [];
  const horizontalChildren = [];

  Object.keys(childIdToTrue || {}).forEach(id => {
    const twig = idToTwig[id];

    if (twig && !twig.deleteDate) {
      if (twig.displayMode === DisplayMode.VERTICAL) {
        verticalChildren.push(twig);
      }
      else if (twig.displayMode === DisplayMode.HORIZONTAL) {
        horizontalChildren.push(twig);
      }
    }
  });

  const twigEl = useRef<HTMLDivElement | undefined>();

  const { openTwig } = useOpenTwig();
  const { selectTwig } = useSelectTwig(props.space, props.canEdit);
  const { linkTwigs } = useLinkTwigs(props.space, props.abstract);

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();

    if (createLink.sourceId === props.twig.detailId) {
      dispatch(setCreateLink({
        sourceId: '',
        targetId: '',
      }));
    }
    if (createLink.sourceId && createLink.targetId === props.twig.detailId) {
      linkTwigs();
    }
  }

  const handleMouseMove = (event: React.MouseEvent) => {

  }
  const handleMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!isSelected) {
      selectTwig(props.abstract, props.twig.id);
    }
  }

  const handleMouseEnter = (event: React.MouseEvent) => {
    if (createLink.sourceId && createLink.sourceId !== props.twig.detailId) {
      dispatch(setCreateLink({
        sourceId: createLink.sourceId,
        targetId: props.twig.detailId,
      }))
    }
  }

  const handleMouseLeave = (event: React.MouseEvent) => {
    if (createLink.sourceId && createLink.sourceId !== props.twig.detailId) {
      dispatch(setCreateLink({
        sourceId: createLink.sourceId,
        targetId: '',
      }));
    }
  }

  const handleOpenClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!isSelected) {
      selectTwig(props.abstract, props.twig.id);
    }
    openTwig(props.twig, !props.twig.isOpen);
  }

  const isLinking = (
    createLink.sourceId === props.twig.detailId || 
    createLink.targetId === props.twig.detailId
  );

  if (!props.twig.isOpen) {
    return (
      <Box>
        <Card elevation={5} onClick={handleOpenClick} sx={{
          width: 30,
          height: 30,
          outline: isSelected
            ? `5px solid ${getTwigColor(props.twig.color) || props.twig.user?.color}`
            : `1px solid ${getTwigColor(props.twig.color) || props.twig.user?.color}`,
          borderRadius: 2,
          borderTopLeftRadius: 0,
          display: 'flex',
          justifyContent: 'center',
          cursor: 'pointer',
          pointerEvents: 'auto',
          opacity: .8,
        }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
              {props.twig.detail.weight}
          </Box>
        </Card>
      </Box>
    );
  }

  return (
    <Box ref={twigEl} sx={{
      display: 'flex',
      flexDirection: 'row',
      position: 'relative',
      pointerEvents: 'none',
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        pointerEvents: 'none',
      }}>
        <Card 
          elevation={isSelected? 15 : 5}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: TWIG_WIDTH - 50,
            opacity: .8,
            outline: isSelected
              ? `10px solid ${getTwigColor(props.twig.color) || props.twig.user?.color}`
              : `1px solid ${getTwigColor(props.twig.color) || props.twig.user?.color}`,
            borderRadius: 5,
            borderTopLeftRadius: 0,
            backgroundColor: isLinking
              ? palette === 'dark'
                ? 'dimgrey'
                : 'darkgrey'
              : null,
            cursor: createLink.sourceId
              ? 'crosshair'
              : 'default', 
            pointerEvents: 'auto',
          }}
        >
          <Box sx={{
            display: 'flex',
          }}>
            <Box sx={{
              padding: 0.5,
              paddingLeft: 0,
            }}>
              <Box sx={{
                marginLeft: 0.5,
                marginRight: 0.5,
                position: 'relative',
              }}>
                <ArrowComponent
                  user={props.user}
                  abstract={props.abstract}
                  space={props.space}
                  arrowId={props.twig.detailId}
                  instanceId={props.twig.id}
                  isTab={!!props.twig.tabId}
                  isGroup={!props.twig.tabId && !!props.twig.groupId}
                  isWindow={!props.twig.tabId && !props.twig.groupId && !!props.twig.windowId}
                />
                <Box sx={{
                  position: 'absolute',
                  left: TWIG_WIDTH - 85,
                  top: -6,
                }}>
                  <IconButton onClick={handleOpenClick} sx={{
                    color: palette === 'dark'
                      ? 'white'
                      : 'black'
                  }}>
                    <RemoveIcon color='inherit' sx={{
                      fontSize: 12,
                    }}/>
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </Box>
        </Card>
        {
          verticalChildren
            .sort((a, b) => a.rank < b.rank ? -1 : 1)
            .map(twig => {
              return (
                <Box key={`twig-${twig.id}`} sx={{
                  marginTop: 3,
                  marginLeft: 5,
                }}>
                  <TwigPostComponent 
                    user={props.user}
                    space={props.space}
                    role={props.role}
                    abstract={props.abstract}
                    twig={twig}
                    canEdit={props.canEdit}
                    canPost={props.canPost}
                    canView={props.canView}
                    setTouches={props.setTouches}
                    drag={props.drag}
                    setDrag={props.setDrag}
                  />
                </Box>
              )
            })
        }
      </Box>
      {
        horizontalChildren
          .sort((a, b) => a.rank < b.rank ? -1 : 1)
          .map(twig => {
            return (
              <Box key={`twig-${twig.id}`} sx={{
                marginTop: 5,
                marginLeft: 3,
              }}>
                <TwigPostComponent
                  user={props.user}
                  space={props.space}
                  role={props.role}
                  abstract={props.abstract}
                  twig={twig}
                  canEdit={props.canEdit}
                  canPost={props.canPost}
                  canView={props.canView}
                  setTouches={props.setTouches}
                  drag={props.drag}
                  setDrag={props.setDrag}
                />
              </Box>
            )
          })
      }
    </Box>
  );
}

export default React.memo(TwigLinkComponent)
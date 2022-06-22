import { useApolloClient } from '@apollo/client';
import { Box, Card, IconButton } from '@mui/material';
import React, { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '~store';
import { DisplayMode, TWIG_WIDTH } from '~constants';
import type { Role } from '../role/role';
import type { DragState, SpaceType } from '../space/space';
import type { User } from '../user/user';
import { selectPalette } from '../window/windowSlice';
import type { Twig } from './twig';
import { selectChildIdToTrue, selectRequiresRerender, setRequiresRerender } from './twigSlice';
import type { Arrow } from '../arrow/arrow';
import RemoveIcon from '@mui/icons-material/Remove';
import { getColor, getTwigColor } from '~utils';
import { FULL_TWIG_FIELDS } from './twigFragments';
import { selectCreateLink, setCreateLink } from '~features/arrow/arrowSlice';
import ArrowComponent from '~features/arrow/ArrowComponent';
import TwigControls from './TwigControls';
import TwigBar from './TwigBar';
import TwigVoter from './TwigVoter';
import { SpaceContext } from '~features/space/SpaceComponent';
import useSelectTwig from './useSelectTwig';
import useMoveTwig from './useMoveTwig';
import { AppContext } from '~newtab/App';
import useLinkTwigs from './useLinkTwig';

interface TwigPostComponentProps {
  user: User | null;
  space: SpaceType;
  role: Role | null;
  abstract: Arrow;
  twig: Twig;
  canEdit: boolean;
  canPost: boolean;
  canView: boolean;
  setTouches: Dispatch<SetStateAction<React.TouchList | null>>;
  coordsReady: boolean;
  drag: DragState;
  setDrag: Dispatch<SetStateAction<DragState>>;
}
function TwigPostComponent(props: TwigPostComponentProps) {
  //console.log('twig post', props.twig.id);

  const client = useApolloClient();
  const dispatch = useAppDispatch();

  const { cachePersistor } = useContext(AppContext);

  //useAppSelector(state => selectInstanceById(state, props.twigId)); // rerender on instance change
  const requiresRerender = useAppSelector(state => selectRequiresRerender(state, props.space, props.twig.id));

  const palette = useAppSelector(selectPalette);
  const createLink = useAppSelector(selectCreateLink);

  const { selectedTwigId } = useContext(SpaceContext);
  const isSelected = props.twig.id === selectedTwigId;

  const childIdToTrue = useAppSelector(state => selectChildIdToTrue(state, props.space, props.twig.id));
  const verticalChildren = [];
  const horizontalChildren = [];

  Object.keys(childIdToTrue || {}).forEach(id => {
    const twig = client.cache.readFragment({
      id: client.cache.identify({
        id,
        __typename: 'Twig',
      }),
      fragment: FULL_TWIG_FIELDS,
      fragmentName: 'FullTwigFields'
    }) as Twig;
    if (twig && !twig.deleteDate) {
      if (twig.displayMode === DisplayMode.VERTICAL) {
        verticalChildren.push(twig);
      }
      else if (twig.displayMode === DisplayMode.HORIZONTAL) {
        horizontalChildren.push(twig);
      }
    }
  });

  //console.log(props.twig.id, verticalChildren, horizontalChildren)

  const [isLoading, setIsLoading] = useState(false);
  const twigEl = useRef<HTMLDivElement | undefined>();

  const { moveTwig } = useMoveTwig(props.space);

  useEffect(() => {
    if (props.twig.displayMode === DisplayMode.SCATTERED) return;
    if (props.twig.isPositionReady) return;
    if (!props.coordsReady) return;
    if (!twigEl.current) return;

    const { offsetLeft, offsetTop } = twigEl.current;

    const x = props.twig.parent.x + offsetLeft;
    const y = props.twig.parent.y + offsetTop 
    if (x !== props.twig.x || y !== props.twig.y) {
      client.cache.modify({
        id: client.cache.identify(props.twig),
        fields: {
          x: () => x,
          y: () => y,
        },
      });
      cachePersistor.persist()
      moveTwig(props.twig.id, props.twig.displayMode);

      dispatch(setRequiresRerender({
        space: props.space,
        twigId: props.twig.id,
        requiresRerender: true,
      }));
    }

  }, [
    props.coordsReady, 
    props.twig.displayMode, 
    props.twig.isPositionReady,
    props.twig.parent?.x, 
    props.twig.parent?.y, 
    twigEl.current?.offsetLeft, 
    twigEl.current?.offsetTop
  ])
  
  useEffect(() => {
    if (requiresRerender) {
      dispatch(setRequiresRerender({
        space: props.space,
        twigId: props.twig.id,
        requiresRerender: false,
      }))
    }
  }, [requiresRerender])
  
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

  const isLinking = (
    createLink.sourceId === props.twig.detailId || 
    createLink.targetId === props.twig.detailId
  );

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
            width: TWIG_WIDTH,
            opacity: .8,
            outline: isSelected
              ? `10px solid ${getTwigColor(props.twig.color) || props.twig.user?.color}`
              : `1px solid ${getTwigColor(props.twig.color) || props.twig.user?.color}`,
            borderRadius: 2,
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
          <TwigBar
            space={props.space} 
            abstract={props.abstract} 
            twig={props.twig}
            canEdit={props.canEdit}
            setTouches={props.setTouches}
            isSelected={isSelected}
            drag={props.drag}
            setDrag={props.setDrag}
          />
          <Box sx={{
            display: 'flex',
          }}>
            <TwigVoter
              user={props.user}
              space={props.space}
              twig={props.twig}
            />
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
                  arrow={props.twig.detail}
                  instanceId={props.twig.id}
                  isTab={!!props.twig.tabId}
                  isGroup={!props.twig.tabId && !!props.twig.groupId}
                  isWindow={!props.twig.tabId && !props.twig.groupId && !!props.twig.windowId}
                />
              </Box>
              <TwigControls
                user={props.user}
                space={props.space}
                twig={props.twig}
                abstract={props.abstract}
                role={props.role}
                canPost={props.canPost}
                canView={props.canView}
                isPost={true}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                canEdit={props.canEdit}
              />
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
                    coordsReady={props.twig.isPositionReady && !requiresRerender}
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
                  coordsReady={props.twig.isPositionReady && !requiresRerender}
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

export default React.memo(TwigPostComponent)
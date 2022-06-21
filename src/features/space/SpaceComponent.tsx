import { gql, useApolloClient, useReactiveVar } from '@apollo/client';
import { Box } from '@mui/material';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '~store';
import { VIEW_RADIUS, SPACE_BAR_HEIGHT, DisplayMode } from '~constants';
import { checkPermit, getAppBarWidth } from '~utils';
import { selectActualMenuWidth } from '../menu/menuSlice';
import type { User } from '../user/user';
import { selectPalette, selectWidth } from '../window/windowSlice';
import { SpaceType } from './space';
import { selectDrag, selectFrameWidth, selectIsOpen, selectScale, selectScroll, setDrag, setScale, setScroll } from './spaceSlice';

import { selectSourceIdToTargetIdToLinkIdToTrue } from '../arrow/arrowSlice';
import { ABSTRACT_ARROW_FIELDS } from '../arrow/arrowFragments';
import type { Arrow } from '../arrow/arrow';
import type { Role } from '../role/role';
import SheafComponent from '../arrow/SheafComponent';
import { AppContext } from '~newtab/App';
import { selectIdToDescIdToTrue, selectTwigIdToTrue } from '~features/twigs/twigSlice';
import useTwigTree from '~features/twigs/useTwigTree';
import { FULL_TWIG_FIELDS, TWIG_FIELDS, TWIG_WITH_POS, TWIG_WITH_XY } from '~features/twigs/twigFragments';
import type { Twig } from '~features/twigs/twig';
import TwigLinkComponent from '~features/twigs/TwigLinkComponent';
import TwigPostComponent from '~features/twigs/TwigPostComponent';
import SpaceControls from './SpaceControls';
import SpaceNav from './SpaceNav';
import useCenterTwig from '~features/twigs/useCenterTwig';
//import useAdjustTwigs from '../twig/useAdjustTwigs';

interface SpaceComponentProps {
  user: User | null;
  space: SpaceType;
}
export default function SpaceComponent(props: SpaceComponentProps) {
  //console.log('space');
  const client = useApolloClient();
  const dispatch = useAppDispatch();
  const { port } = useContext(AppContext);

  const width = useAppSelector(selectWidth);
  const palette = useAppSelector(selectPalette);

  const menuWidth = useAppSelector(selectActualMenuWidth);

  const frameIsOpen = useAppSelector(selectIsOpen(SpaceType.FRAME));
  const frameWidth = useAppSelector(selectFrameWidth);
  const frameWidth1 = frameIsOpen
    ? frameWidth
    : 0;
  
  const offsetLeft = props.space === 'FRAME'
    ? getAppBarWidth(width) + menuWidth
    : getAppBarWidth(width) + menuWidth + frameWidth1;

  const offsetTop = SPACE_BAR_HEIGHT;

  const scale = useAppSelector(selectScale(props.space));
  const scroll = useAppSelector(selectScroll(props.space));
  const drag = useAppSelector(selectDrag(props.space));


  const twigIdToTrue = useAppSelector(selectTwigIdToTrue(props.space));
  const idToDescIdToTrue = useAppSelector(selectIdToDescIdToTrue(props.space));

  const sourceIdToTargetIdToLinkIdToTrue = useAppSelector(selectSourceIdToTargetIdToLinkIdToTrue(props.space));

  const abstract = client.cache.readFragment({
    id: client.cache.identify({
      id: props.space === 'FRAME'
        ? props.user?.frameId
        : props.user?.focusId,
      __typename: 'Arrow',
    }),
    fragment: ABSTRACT_ARROW_FIELDS,
    fragmentName: 'AbstractArrowFields',
  }) as Arrow;

  let role = null as Role | null;
  (abstract?.roles || []).some(role_i => {
    if (role_i.userId === props.user?.id && !role_i.deleteDate) {
      role = role_i;
      return true;
    }
    return false;
  });

  const canEdit = checkPermit(abstract?.canEdit, role?.type)
  const canPost = checkPermit(abstract?.canPost, role?.type)
  const canView = checkPermit(abstract?.canView, role?.type)

  const [cursor, setCursor] = useState({
    x: 0,
    y: 0,
  });

  const [touches, setTouches] = useState(null as React.TouchList | null);

  const [scaleEvent, setScaleEvent] = useState(null as React.WheelEvent | null);
  const [isScaling, setIsScaling] = useState(false);
  const [scaleScroll, setScaleScroll] = useState(null as any);
  const [canScale, setCanScale] = useState(true);

  const [moveEvent, setMoveEvent] = useState(null as React.MouseEvent | null);

  const [showSettings, setShowSettings] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  
  const spaceEl = useRef<HTMLElement>();

  const { setFrameSpaceEl, setFocusSpaceEl } = useContext(AppContext);

  useTwigTree(props.space)
  //useAddTwigSub(props.user, props.space, abstract);

  //const { moveTwig } = useMoveTwig(props.space);
  //const { adjustTwigs} = useAdjustTwigs(abstract)

  useEffect(() => {
    if (!spaceEl.current) return;

    if (props.space === 'FRAME') {
      setFrameSpaceEl(spaceEl);
    }
    else {
      setFocusSpaceEl(spaceEl);
    }

    const preventWheelDefault = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    }

    spaceEl.current.addEventListener('wheel', preventWheelDefault);

    return () => {
      spaceEl.current?.removeEventListener('wheel', preventWheelDefault);
    }
  }, [spaceEl.current]);

  useEffect(() => {
    if (!scaleScroll || !spaceEl.current) return;
    spaceEl.current.scrollTo({
      left: scaleScroll.left,
      top: scaleScroll.top,
    });
    setScaleScroll(null);
  }, [scaleScroll, spaceEl.current])


  useEffect(() => {
    if (!moveEvent || !spaceEl.current) return;

    const x = spaceEl.current.scrollLeft + moveEvent.clientX - offsetLeft;
    const y = spaceEl.current.scrollTop + moveEvent.clientY - offsetTop;

    const dx = x - cursor.x;
    const dy = y - cursor.y;

    if (dx !== 0 || dy !== 0){
      moveDrag(dx, dy);
    }

    setCursor({
      x,
      y,
    });

    //publishCursor(x, y); TODO

    setMoveEvent(null);
  }, [moveEvent]);

  // useEffect(() => {
  //   if (Object.keys(adjustTwigDetail.idToCoords).length && !drag.twigId) {
  //     console.log('adjustment', adjustTwigDetail.idToCoords);
  //     //adjustTwigs(adjustTwigDetail.idToCoords);
  //     adjustTwigVar({
  //       idToCoords: {},
  //     });
  //   }
  // }, [adjustTwigDetail.idToCoords, drag.twigId]);

  if (!abstract) return null;

  const handleWheel = (event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      if (scaleScroll) return;
      if (!canScale) return;
      
      const center = {
        x: cursor.x / scale,
        y: cursor.y / scale,
      };
  
      const scale1 = Math.min(Math.max(.03125, scale + event.deltaY * -0.04), 4)
  
      const center1 = {
        x: center.x * scale1,
        y: center.y * scale1,
      }
  
      setCursor(center1);
  
      const left = center1.x - (event.clientX - offsetLeft);
      const top = center1.y - (event.clientY - offsetTop);
      
      // scroll on next rerender, bc the space may not have the right dimensions yet
      // when the space is scaled, it changes width/height to keep the scrollbar centered
      setScaleScroll({
        left,
        top,
      }); 
  
      dispatch(setScale({
        space: props.space,
        scale: scale1
      }));
  
      setIsScaling(true);
      setCanScale(false);
      setTimeout(() => {
        setCanScale(true);
      }, 80);
    }
  };

  const moveDrag = (dx: number, dy: number, targetTwigId?: string) => {
    if (drag.isScreen) {
      if (!spaceEl.current) return;
      spaceEl.current.scrollBy(-1 * dx, -1 * dy)
      return;
    }

    if (!drag.twigId) return;

    const dx1 = dx / scale;
    const dy1 = dy / scale;

    dispatch(setDrag({
      space: props.space,
      drag: {
        ...drag,
        targetTwigId: targetTwigId || drag.targetTwigId,
        dx: drag.dx + dx1,
        dy: drag.dy + dy1,
      }
    }));

    [drag.twigId, ...Object.keys(idToDescIdToTrue[drag.twigId] || {})].forEach(twigId => {
      client.cache.modify({
        id: client.cache.identify({
          id: twigId,
          __typename: 'Twig',
        }),
        fields: {
          x: cachedVal => cachedVal + dx1,
          y: cachedVal => cachedVal + dy1,
        }
      });
    })

    if (canEdit) {
      //dragTwig(drag.twigId, dx1, dy1);
    }
  };

  const endDrag = () => {
    dispatch(setDrag({
      space: props.space,
      drag: {
        isScreen: false,
        twigId: '',
        dx: 0,
        dy: 0,
        targetTwigId: '',
      }
    }));

    if (!drag.twigId || (drag.dx === 0 && drag.dy === 0)) return;

    if (canEdit) {
      if (drag.targetTwigId) {
        //graftTwig(drag.twigId, drag.targetTwigId);
      }
      else {
        //moveTwig(drag.twigId, DisplayMode.SCATTERED);
      }
    }
    else {
      //dispatch(setFocusIsSynced(false));
    }
  };

  const handleMouseMove = (event: React.MouseEvent, targetId?: string) => {
    if (drag.isScreen || drag.twigId) {
      event.preventDefault();
    }
    if (!targetId && drag.targetTwigId && !drag.isScreen) {
      dispatch(setDrag({
        space: props.space,
        drag: {
          ...drag,
          targetTwigId: '',
        },
      }));
    }

    if (!moveEvent) {
      setMoveEvent(event);
    }

  }

  const handleMouseUp = (event: React.MouseEvent) => {
    endDrag()
  }

  const handleTouchEnd = (event: React.TouchEvent) => {
    endDrag();
  }

  const updateScroll = (left: number, top: number) => {
    dispatch(setScroll({
      space: props.space,
      scroll: {
        left,
        top,
      },
    }));

    if (isScaling) {
      setIsScaling(false);
    }
    else if (!scaleEvent) {
      const dx = left - scroll.left;
      const dy = top - scroll.top;

      setCursor({
        x: cursor.x + dx,
        y: cursor.y + dy,
      });
    }

  }

  const handleScroll = (event: React.UIEvent) => {
    updateScroll(event.currentTarget.scrollLeft, event.currentTarget.scrollTop);
  }

  const handleMouseDown = (event: React.MouseEvent) => {
    dispatch(setDrag({
      space: props.space,
      drag: {
        isScreen: true,
        twigId: '',
        dx: 0,
        dy: 0,
        targetTwigId: '',
      }
    }));
  }

  const handleTargetMouseMove = (targetId: string) => (event: React.MouseEvent) => {
    event.stopPropagation();
    if (drag.targetTwigId !== targetId) {
      dispatch(setDrag({
        space: props.space,
        drag: {
          ...drag,
          targetTwigId: targetId,
        },
      }));
    }
    handleMouseMove(event, targetId);
  }

  const sheafs: JSX.Element[] = [];
  // const adjusted: IdToCoordsType = {};
  const twigs: JSX.Element[] = [];
  Object.keys(twigIdToTrue).forEach(twigId => {
    const twig = client.cache.readFragment({
      id: client.cache.identify({
        id: twigId,
        __typename: 'Twig',
      }),
      fragment: FULL_TWIG_FIELDS,
      fragmentName: 'FullTwigFields'
    }) as Twig;

    //console.log(twigId, twig);

    if (!twig || twig.deleteDate || twig.displayMode !== DisplayMode.SCATTERED) {
      return;
    }

    if (twig.sourceId !== twig.targetId) {
      const sourceTwig = client.cache.readFragment({
        id: client.cache.identify({
          id: twig.sourceId,
          __typename: 'Twig',
        }),
        fragment: FULL_TWIG_FIELDS,
        fragmentName: 'FullTwigFields'
      }) as Twig;
      const targetTwig = client.cache.readFragment({
        id: client.cache.identify({
          id: twig.targetId,
          __typename: 'Twig',
        }),
        fragment: FULL_TWIG_FIELDS,
        fragmentName: 'FullTwigFields'
      }) as Twig;

      if (!sourceTwig || sourceTwig.deleteDate || !targetTwig || targetTwig.deleteDate) {
        return;
      }
      const x = Math.round((sourceTwig.x + targetTwig.x) / 2);
      const y = Math.round((sourceTwig.y + targetTwig.y) / 2);

      if (x !== twig.x || y !== twig.y) {
        const dx = x - twig.x;
        const dy = y - twig.y;
        [twig.id, ...Object.keys(idToDescIdToTrue[twig.id] || {})].forEach(descId => {
          const id = client.cache.identify({
            id: descId,
            __typename: 'Twig',
          });
          client.cache.modify({
            id,
            fields: {
              x: cachedVal => cachedVal + dx,
              y: cachedVal => cachedVal + dy,
            }
          });
          // const desc = client.cache.readFragment({
          //   id,
          //   fragment: TWIG_WITH_XY,
          // }) as Twig;
          // adjusted[descId] = {
          //   x: desc.x,
          //   y: desc.y,
          // };
        })
      }
      twigs.push(
        <Box key={`twig-${twigId}`} sx={{
          position: 'absolute',
          left: x + VIEW_RADIUS,
          top: y + VIEW_RADIUS,
          zIndex: twig.z,
          pointerEvents: 'none',
        }}>
          <TwigLinkComponent
            user={props.user}
            space={props.space}
            role={role}
            abstract={abstract}
            twig={twig}
            canEdit={canEdit}
            canPost={canPost}
            canView={canView}
            setTouches={setTouches}
            coordsReady={true}
          />
        </Box>
      )
      sheafs.push(
        <SheafComponent
          key={`sheaf-${twigId}`}
          user={props.user}
          abstract={abstract}
          space={props.space}
          twig={twig}
          canEdit={canEdit}
        />
      )
    }
    else {
      twigs.push(
        <Box key={`twig-${twigId}`} sx={{
          position: 'absolute',
          left: twig.x + VIEW_RADIUS,
          top: twig.y + VIEW_RADIUS,
          zIndex: twig.z,
          pointerEvents: 'none',
        }}>
          <TwigPostComponent
            user={props.user}
            space={props.space}
            role={role}
            abstract={abstract}
            twig={twig}
            canEdit={canEdit}
            canPost={canPost}
            canView={canView}
            setTouches={setTouches}
            coordsReady={true}
          />
        </Box>
      )
    }
  });

  // if (Object.keys(adjusted).length) {
  //   adjustTwigVar({
  //     idToCoords: {
  //       ...adjustTwigDetail.idToCoords,
  //       ...adjusted,
  //     }
  //   })
  // }

  const w = 2 * VIEW_RADIUS;
  const h = 2 * VIEW_RADIUS;
  return (
    <Box 
      ref={spaceEl}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onScroll={handleScroll}
      onWheel={handleWheel}
      onTouchEnd={handleTouchEnd}
      sx={{
        position: 'relative',
        top: `${SPACE_BAR_HEIGHT}px`,
        height: `calc(100% - ${SPACE_BAR_HEIGHT}px)`,
        width: '100%',
        overflow: 'scroll',
      }}
    >
      <Box 
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        sx={{
          width: w * (scale < 1 ? scale : 1),
          height: h * (scale < 1 ? scale : 1),
          position: 'relative',
          cursor: drag.isScreen || drag.twigId
            ? 'grabbing'
            : 'grab',
          transform: `scale(${scale})`,
          transformOrigin: '0 0'
        }}
      >
        <svg viewBox={`0 0 ${w} ${h}`} style={{
          width: w,
          height: h,
        }}>
          <defs>
            {
              // Object.keys(userIdToTrue).map(userId => {
              //   const user = client.cache.readFragment({
              //     id: client.cache.identify({
              //       id: userId,
              //       __typename: 'User',
              //     }),
              //     fragment: gql`
              //       fragment UserWithColor on User {
              //         id
              //         color
              //       }
              //     `,
              //   }) as User;
              //   return (
              //     <marker 
              //       key={`marker-${userId}`}
              //       id={`marker-${userId}`} 
              //       markerWidth='6'
              //       markerHeight='10'
              //       refX='7'
              //       refY='5'
              //       orient='auto'
              //     >
              //       <polyline 
              //         points='0,0 5,5 0,10'
              //         fill='none'
              //         stroke={user?.color}
              //       />
              //     </marker>
              //   )
              // })
            }
          </defs>
          {
            Object.keys(twigIdToTrue).map(twigId => {
              const twig = client.cache.readFragment({
                id: client.cache.identify({
                  id: twigId,
                  __typename: 'Twig',
                }),
                fragment: TWIG_WITH_POS,
              }) as Twig;
              if (!twig || twig.deleteDate || !twig.parent || twig.id === abstract.rootTwigId) return null;
              if (twig.displayMode === DisplayMode.SCATTERED) {
                return (
                  <line 
                    key={`twig-line-${twigId}`}
                    x1={twig.parent.x + VIEW_RADIUS}
                    y1={twig.parent.y + VIEW_RADIUS}
                    x2={twig.x + VIEW_RADIUS}
                    y2={twig.y + VIEW_RADIUS}
                    stroke={palette === 'dark' ? 'white' : 'black'}
                    strokeLinecap={'round'}
                    strokeWidth={4}
                  />
                )
              }
              else if (twig.displayMode === DisplayMode.HORIZONTAL) {
                // return (
                //   <polyline
                //     key={`twig-line-${twigId}`}
                //     points={`
                //       ${twig.parent.x + VIEW_RADIUS},${twig.parent.y + VIEW_RADIUS} 
                //       ${twig.x + VIEW_RADIUS},${twig.parent.y + VIEW_RADIUS} 
                //       ${twig.x + VIEW_RADIUS},${twig.y + VIEW_RADIUS}
                //     `}
                //     stroke={palette === 'dark' ? 'white' : 'black'}
                //     strokeWidth={2}
                //     strokeLinecap={'round'}
                //     fill={'none'}
                //   />
                // )
              }
              else if (twig.displayMode === DisplayMode.VERTICAL) {
                // return (
                //   <polyline
                //     key={`twig-line-${twigId}`}
                //     points={`
                //       ${twig.parent.x + VIEW_RADIUS},${twig.parent.y + VIEW_RADIUS} 
                //       ${twig.parent.x + VIEW_RADIUS},${twig.y + VIEW_RADIUS} 
                //       ${twig.x + VIEW_RADIUS},${twig.y + VIEW_RADIUS}
                //     `}
                //     stroke={palette === 'dark' ? 'white' : 'black'}
                //     strokeWidth={2}
                //     strokeLinecap={'round'}
                //     fill={'none'}
                //   />
                // )
              }
              return null;
            })
          }
          { sheafs }
        </svg>
        { twigs }
      </Box>
      <SpaceControls
        space={props.space}
        setShowSettings={setShowSettings}
        setShowRoles={setShowRoles}
      />
      <SpaceNav
        user={props.user}
        space={props.space}
        abstract={abstract}
        canEdit={canEdit}
      />
    </Box>
  );
}
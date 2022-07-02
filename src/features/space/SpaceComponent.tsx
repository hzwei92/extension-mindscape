import { gql, useApolloClient } from "@apollo/client";
import { Box } from "@mui/material";
import React, { Dispatch, SetStateAction, useContext, useEffect, useReducer, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "~store";
import { VIEW_RADIUS, SPACE_BAR_HEIGHT, DisplayMode, TWIG_WIDTH } from "~constants";
import { checkPermit, getAppBarWidth, getTwigColor } from "~utils";
import { selectActualMenuWidth } from "../menu/menuSlice";
import type { User } from "../user/user";
import { DragState, ScrollState, SpaceType } from "./space";
import { selectIdToDescIdToTrue, selectIsOpen } from "./spaceSlice";
import type { Role } from "../role/role";
import LinkMarkerComponent from "../arrow/LinkMarkerComponent";
import { AppContext } from "~newtab/App";
import { selectIdToTwig, selectTabIdToTwigIdToTrue, selectTwigIdToHeight } from "~features/twigs/twigSlice";
import TwigLinkComponent from "~features/twigs/TwigLinkComponent";
import TwigPostComponent from "~features/twigs/TwigPostComponent";
import SpaceControls from "./SpaceControls";
import SpaceNav from "./SpaceNav";
import useCenterTwig from "~features/twigs/useCenterTwig";
import TwigLine from "~features/twigs/TwigLine";
import useMoveTwig from "~features/twigs/useMoveTwig";
import { selectArrow } from "~features/arrow/arrowSlice";
import { selectIdToUser } from "~features/user/userSlice";
import type { IdToType } from "~types";
import type { PosType } from "~features/twigs/twig";
//import useAdjustTwigs from "../twig/useAdjustTwigs";


export const SpaceContext = React.createContext({} as {
  selectedTwigId: string;
  setSelectedTwigId: Dispatch<SetStateAction<string>>;
  scale: number;
  setScale: Dispatch<SetStateAction<number>>;
  posState: IdToType<PosType>;
  posDispatch: Dispatch<any>;
});

interface SpaceComponentProps {
  user: User | null;
  space: SpaceType;
}
export default function SpaceComponent(props: SpaceComponentProps) {
  //console.log('space');
  const client = useApolloClient();
  const dispatch = useAppDispatch();

  const { tabId, width } = useContext(AppContext);

  const menuWidth = useAppSelector(selectActualMenuWidth);

  const frameIsOpen = useAppSelector(selectIsOpen(SpaceType.FRAME));
  const frameWidth = width;
  const frameWidth1 = frameIsOpen
    ? frameWidth
    : 0;
  
  const offsetLeft = props.space === 'FRAME'
    ? getAppBarWidth(width) + menuWidth
    : getAppBarWidth(width) + menuWidth + frameWidth1;

  const offsetTop = SPACE_BAR_HEIGHT;

  const [scale, setScale] = useState(0.75);
  const [scroll, setScroll] = useState({
    left: 0,
    top: 0,
  } as ScrollState)
  const [drag, setDrag] = useState({
    isScreen: false,
    twigId: '',
    dx: 0,
    dy: 0,
    targetTwigId: '',
  } as DragState);
  

  const idToUser = useAppSelector(selectIdToUser(props.space));

  const idToTwig = useAppSelector(selectIdToTwig(props.space));
  const twigIdToHeight = useAppSelector(selectTwigIdToHeight(props.space));
  const idToDescIdToTrue = useAppSelector(selectIdToDescIdToTrue(props.space));

  const tabIdToTwigIdToTrue = useAppSelector(selectTabIdToTwigIdToTrue(props.space));

  const tabTwigs = [];
  Object.keys(tabIdToTwigIdToTrue[tabId] || {}).forEach(twigId => {
    const twig = idToTwig[twigId];
    if (twig?.userId === props.user?.id) {
      tabTwigs.push(twig);
    }
  })
  const tabTwig = tabTwigs[0];

  const abstractId = props.space === SpaceType.FRAME
    ? props.user?.frameId
    : props.user?.focusId;

  const abstract = useAppSelector(state => selectArrow(state, abstractId));

  const [selectedTwigId, setSelectedTwigId] = useState(abstract?.rootTwigId);

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

  const [isScaling, setIsScaling] = useState(false);
  const [scaleScroll, setScaleScroll] = useState(null as any);
  const [canScale, setCanScale] = useState(true);



  const posReducer = (state, action) => {
    switch (action.type) {
      case 'setPos':
        return {
          ...state,
          [action.twigId]: action.pos,
        };
      case 'setIdToPos': {
        console.log(action);
        return {
          ...state,
          ...action.idToPos,
        }
      }
      default: 
        throw new Error('Unsupported action type')
    }
  }
  const posInitState: IdToType<PosType> = {};
  const [posState, posDispatch] = useReducer(posReducer, posInitState);

  const [moveEvent, setMoveEvent] = useState(null as React.MouseEvent | null);
  const [showSettings, setShowSettings] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  
  const spaceEl = useRef<HTMLElement>();

  const { setFrameSpaceEl, setFocusSpaceEl } = useContext(AppContext);

  //useAddTwigSub(props.user, props.space, abstract);

  const { moveTwig } = useMoveTwig(props.space);
  //const { adjustTwigs } = useAdjustTwigs(abstract)

  const { centerTwig } = useCenterTwig(props.user, props.space, scale);

  useEffect(() => {
    const idToPos: IdToType<PosType> = Object.keys(idToTwig).reduce((acc, twigId) => {
      const pos = posState[twigId];

      if (!pos) {
        const twig = idToTwig[twigId];
        acc[twigId] = {
          x: twig.x,
          y: twig.y,
        };
      }
      return acc;
    }, {});

    posDispatch({
      type: 'setIdToPos',
      idToPos,
    });
  }, [idToTwig]);

  useEffect(() => {
    if (!tabTwig || drag.twigId) return;

    setSelectedTwigId(tabTwig.id);
    console.log('scale', scale)
    centerTwig(tabTwig.id, true, 0);

  }, [tabTwig?.id]);
  
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
  
      setScale(scale1);
  
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

    const dx1 = Math.round(dx / scale);
    const dy1 = Math.round(dy / scale);

    setDrag({
      ...drag,
      targetTwigId: targetTwigId || drag.targetTwigId,
      dx: drag.dx + dx1,
      dy: drag.dy + dy1,
    });

    const idToPos = [drag.twigId, ...Object.keys(idToDescIdToTrue[drag.twigId] || {})].reduce((acc, twigId) => {
      acc[twigId] = {
        x: posState[twigId].x + dx1,
        y: posState[twigId].y + dy1,
      };
      return acc;
    }, {});

    console.log('idToPos', idToPos)
    posDispatch({
      type: 'setIdToPos',
      idToPos,
    });

    if (canEdit) {
      //dragTwig(drag.twigId, dx1, dy1);
    }
  };

  const endDrag = () => {
    setDrag({
      isScreen: false,
      twigId: '',
      dx: 0,
      dy: 0,
      targetTwigId: '',
    });

    if (!drag.twigId || (drag.dx === 0 && drag.dy === 0)) return;
    
    if (canEdit) {
      if (drag.targetTwigId) {
        //graftTwig(drag.twigId, drag.targetTwigId);
      }
      else {
        const pos = posState[drag.twigId]
        moveTwig(drag.twigId, pos.x, pos.y, DisplayMode.SCATTERED);
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
      setDrag({
        ...drag,
        targetTwigId: '',
      });
    }

    if (!moveEvent) {
      setMoveEvent(event);
    }
    else {
      setMoveEvent(null);
    }
  }

  const handleMouseUp = (event: React.MouseEvent) => {
    endDrag()
  }

  const handleTouchEnd = (event: React.TouchEvent) => {
    endDrag();
  }

  const updateScroll = (left: number, top: number) => {
    setScroll({
      left,
      top,
    });

    if (isScaling) {
      setIsScaling(false);
    }
    else {
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
    setDrag({
      isScreen: true,
      twigId: '',
      dx: 0,
      dy: 0,
      targetTwigId: '',
    });
  }

  const handleTargetMouseMove = (targetId: string) => (event: React.MouseEvent) => {
    event.stopPropagation();
    if (drag.targetTwigId !== targetId) {
      setDrag({
        ...drag,
        targetTwigId: targetId,
      });
    }
    handleMouseMove(event, targetId);
  }

  // const adjusted: IdToCoordsType = {};
  const sheafs: JSX.Element[] = [];
  const twigs: JSX.Element[] = [];
  const dropTargets: JSX.Element[] = [];
  const idToPos: IdToType<PosType> = {};
  Object.keys(posState).forEach(twigId => {
    const twig = idToTwig[twigId];
    //console.log(twigId, twig);

    const pos = posState[twigId];

    if (!twig || twig.deleteDate || !pos) {
      return;
    }

    if (
      drag.twigId &&
      twig.id !== drag.twigId && 
      !Object.keys(idToDescIdToTrue[drag.twigId] || {}).some(descId => descId === twig.id)
    ) {
      dropTargets.push(
        <Box key={'twig-bottom-droptarget-' + twig.id} sx={{
          position: 'absolute',
          left: pos.x + VIEW_RADIUS,
          top: pos.y + VIEW_RADIUS + twigIdToHeight[twig.id] - 50,
          zIndex: twig.z + 1,
          width: TWIG_WIDTH,
          height: 100,
          backgroundColor: getTwigColor(twig.color || twig.user?.color),
          opacity: 0.4
        }} />
      );
    }

    if (twig.displayMode !== DisplayMode.SCATTERED) {
      return;
    }

    if (twig.sourceId !== twig.targetId) {
      const sourceTwig = idToTwig[twig.sourceId];
      const targetTwig = idToTwig[twig.targetId]

      if (!sourceTwig || sourceTwig.deleteDate || !targetTwig || targetTwig.deleteDate) {
        return;
      }
      const sourcePos = posState[twig.sourceId];
      const targetPos = posState[twig.targetId]
      const x = Math.round((sourcePos.x + targetPos.x) / 2);
      const y = Math.round((sourcePos.y + targetPos.y) / 2);

      if (x !== pos.x || y !== pos.y) {
        const dx = x - pos.x;
        const dy = y - pos.y;
        [twigId, ...Object.keys(idToDescIdToTrue[twigId] || {})].forEach(descId => {
          const descPos = posState[descId];

          idToPos[descId] = {
            x: descPos.x + dx,
            y: descPos.y + dy,
          }
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
            drag={drag}
            setDrag={setDrag}
          />
        </Box>
      )
      sheafs.push(
        <LinkMarkerComponent
          key={`sheaf-line-${twigId}`}
          user={props.user}
          abstract={abstract}
          space={props.space}
          twig={twig}
          sourcePos={sourcePos}
          targetPos={targetPos}
          canEdit={canEdit}
        />
      )
    }
    else {
      twigs.push(
        <Box key={`twig-${twigId}`} sx={{
          position: 'absolute',
          left: pos.x + VIEW_RADIUS,
          top: pos.y + VIEW_RADIUS,
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
            drag={drag}
            setDrag={setDrag}
          />
        </Box>
      )
    }
  });

  if (Object.keys(idToPos).length) {
    posDispatch({
      type: 'setIdToPos',
      idToPos,
    });
  }

  const w = 2 * VIEW_RADIUS;
  const h = 2 * VIEW_RADIUS;
  return (
    <SpaceContext.Provider value={{
      selectedTwigId,
      setSelectedTwigId,
      scale,
      setScale,
      posState,
      posDispatch,
    }}>
      <Box 
        ref={spaceEl}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
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
                Object.keys(idToUser).map(userId => {
                  const user = idToUser[userId];
                  return (
                    <marker 
                      key={`marker-${userId}`}
                      id={`marker-${userId}`} 
                      markerWidth='6'
                      markerHeight='10'
                      refX='7'
                      refY='5'
                      orient='auto'
                    >
                      <polyline 
                        points='0,0 5,5 0,10'
                        fill='none'
                        stroke={user?.color}
                      />
                    </marker>
                  )
                })
              }
            </defs>
            {
              Object.keys(posState).map(twigId => {
                const twig = idToTwig[twigId];
                if (!twig || twig.deleteDate) return null;
                  
                const parentTwig = idToTwig[twig.parent?.id];
                if (!twig.parent?.id || parentTwig.deleteDate) return null;

                const pos = posState[twigId];
                const parentPos = posState[twig.parent.id];

                if (
                  !pos || 
                  !parentPos || 
                  (twig.displayMode !== DisplayMode.SCATTERED && pos.x === 0 && pos.y === 0)
                ) return null;

                return (
                  <TwigLine 
                    key={`twig-line-${twigId}`}
                    space={props.space}
                    abstract={abstract} 
                    twig={twig}
                    pos={pos}
                    parentPos={parentPos}
                  />
                );
              })
            }
            { sheafs }
          </svg>
          { twigs }
          { dropTargets }
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
    </SpaceContext.Provider>
  );
}
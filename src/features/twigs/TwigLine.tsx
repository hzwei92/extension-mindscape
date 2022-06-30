import { useApolloClient } from "@apollo/client";
import { DisplayMode, VIEW_RADIUS } from "~constants";
import type { Arrow } from "~features/arrow/arrow";
import type { SpaceType } from "~features/space/space";
import { selectPalette } from "~features/window/windowSlice";
import { useAppSelector } from "~store";
import type { PosType, Twig } from "./twig";

interface TwigLineProps {
  space: SpaceType;
  abstract: Arrow;
  twig: Twig;
  pos: PosType;
  parentPos: PosType;
}

export default function TwigLine(props: TwigLineProps) {
  const client = useApolloClient();

  const palette = useAppSelector(selectPalette);

  if (
    !props.pos || 
    props.twig.deleteDate || 
    !props.parentPos || 
    props.twig.id === props.abstract.rootTwigId
  ) return null;

  if (props.twig.displayMode === DisplayMode.SCATTERED) {
    return (
      <line 
        x1={props.parentPos.x + VIEW_RADIUS}
        y1={props.parentPos.y + VIEW_RADIUS}
        x2={props.pos.x + VIEW_RADIUS}
        y2={props.pos.y + VIEW_RADIUS}
        stroke={palette === 'dark' ? 'white' : 'black'}
        strokeLinecap={'round'}
        strokeWidth={4}
      />
    )
  }
  else if (props.twig.displayMode === DisplayMode.HORIZONTAL) {
    return (
      <path
        d={`
          M ${props.parentPos.x + VIEW_RADIUS} ${props.parentPos.y + VIEW_RADIUS} 
          L ${props.pos.x + VIEW_RADIUS - 10} ${props.parentPos.y + VIEW_RADIUS}
          Q ${props.pos.x + VIEW_RADIUS}  ${props.parentPos.y + VIEW_RADIUS} 
            ${props.pos.x + VIEW_RADIUS} ${props.parentPos.y + VIEW_RADIUS + 10}
          L ${props.pos.x + VIEW_RADIUS} ${props.pos.y + VIEW_RADIUS}
        `}
        stroke={palette === 'dark' ? 'white' : 'black'}
        strokeWidth={3}
        strokeLinecap={'round'}
        fill={'none'}
      />
    )
  }
  else if (props.twig.displayMode === DisplayMode.VERTICAL) {
    return (
      <path
        d={`
          M ${props.parentPos.x + VIEW_RADIUS} ${props.parentPos.y + VIEW_RADIUS} 
          L ${props.parentPos.x + VIEW_RADIUS} ${props.pos.y + VIEW_RADIUS - 10} 
          Q ${props.parentPos.x + VIEW_RADIUS} ${props.pos.y + VIEW_RADIUS} 
            ${props.parentPos.x + VIEW_RADIUS + 10} ${props.pos.y + VIEW_RADIUS} 
          L ${props.pos.x + VIEW_RADIUS} ${props.pos.y + VIEW_RADIUS}
        `}
        stroke={palette === 'dark' ? 'white' : 'black'}
        strokeWidth={3}
        strokeLinecap={'round'}
        fill={'none'}
      />
    )
  }
  return null;
}
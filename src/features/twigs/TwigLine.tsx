import { DisplayMode, VIEW_RADIUS } from "~constants";
import type { Arrow } from "~features/arrow/arrow";
import { selectPalette } from "~features/window/windowSlice";
import { useAppSelector } from "~store";
import type { Twig } from "./twig";

interface TwigLineProps {
  abstract: Arrow;
  twig: Twig;
}

export default function TwigLine(props: TwigLineProps) {
  const palette = useAppSelector(selectPalette);
  if (
    !props.twig || 
    props.twig.deleteDate || 
    !props.twig.parent || 
    (!props.twig.isPositionReady && props.twig.displayMode !== DisplayMode.SCATTERED)|| 
    props.twig.id === props.abstract.rootTwigId
  ) return null;

  if (props.twig.displayMode === DisplayMode.SCATTERED) {
    return (
      <line 
        x1={props.twig.parent.x + VIEW_RADIUS}
        y1={props.twig.parent.y + VIEW_RADIUS}
        x2={props.twig.x + VIEW_RADIUS}
        y2={props.twig.y + VIEW_RADIUS}
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
          M ${props.twig.parent.x + VIEW_RADIUS} ${props.twig.parent.y + VIEW_RADIUS} 
          L ${props.twig.x + VIEW_RADIUS - 10} ${props.twig.parent.y + VIEW_RADIUS}
          Q ${props.twig.x + VIEW_RADIUS}  ${props.twig.parent.y + VIEW_RADIUS} 
            ${props.twig.x + VIEW_RADIUS} ${props.twig.parent.y + VIEW_RADIUS + 10}
          L ${props.twig.x + VIEW_RADIUS} ${props.twig.y + VIEW_RADIUS}
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
          M ${props.twig.parent.x + VIEW_RADIUS} ${props.twig.parent.y + VIEW_RADIUS} 
          L ${props.twig.parent.x + VIEW_RADIUS} ${props.twig.y + VIEW_RADIUS - 10} 
          Q ${props.twig.parent.x + VIEW_RADIUS} ${props.twig.y + VIEW_RADIUS} 
            ${props.twig.parent.x + VIEW_RADIUS + 10} ${props.twig.y + VIEW_RADIUS} 
          L ${props.twig.x + VIEW_RADIUS} ${props.twig.y + VIEW_RADIUS}
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
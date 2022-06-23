import { useApolloClient } from "@apollo/client";
import { DisplayMode, VIEW_RADIUS } from "~constants";
import type { Arrow } from "~features/arrow/arrow";
import type { SpaceType } from "~features/space/space";
import { selectPalette } from "~features/window/windowSlice";
import { useAppSelector } from "~store";
import type { Twig } from "./twig";
import { FULL_TWIG_FIELDS } from "./twigFragments";
import { selectPosReady } from "./twigSlice";

interface TwigLineProps {
  space: SpaceType;
  abstract: Arrow;
  twig: Twig;
}

export default function TwigLine(props: TwigLineProps) {
  const client = useApolloClient();

  const palette = useAppSelector(selectPalette);
  
  let parentTwig = client.cache.readFragment({
    id: client.cache.identify(props.twig.parent),
    fragment: FULL_TWIG_FIELDS,
    fragmentName: 'FullTwigFields',
  }) as Twig

  const posReady = useAppSelector(state => selectPosReady(state, props.space, props.twig.id))

  if (
    !props.twig || 
    props.twig.deleteDate || 
    !parentTwig || 
    parentTwig.deleteDate ||
    !posReady || 
    props.twig.id === props.abstract.rootTwigId
  ) return null;

  if (props.twig.displayMode === DisplayMode.SCATTERED) {
    return (
      <line 
        x1={parentTwig.x + VIEW_RADIUS}
        y1={parentTwig.y + VIEW_RADIUS}
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
          M ${parentTwig.x + VIEW_RADIUS} ${parentTwig.y + VIEW_RADIUS} 
          L ${props.twig.x + VIEW_RADIUS - 10} ${parentTwig.y + VIEW_RADIUS}
          Q ${props.twig.x + VIEW_RADIUS}  ${parentTwig.y + VIEW_RADIUS} 
            ${props.twig.x + VIEW_RADIUS} ${parentTwig.y + VIEW_RADIUS + 10}
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
          M ${parentTwig.x + VIEW_RADIUS} ${parentTwig.y + VIEW_RADIUS} 
          L ${parentTwig.x + VIEW_RADIUS} ${props.twig.y + VIEW_RADIUS - 10} 
          Q ${parentTwig.x + VIEW_RADIUS} ${props.twig.y + VIEW_RADIUS} 
            ${parentTwig.x + VIEW_RADIUS + 10} ${props.twig.y + VIEW_RADIUS} 
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
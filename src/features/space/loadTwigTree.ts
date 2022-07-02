import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { SpaceType } from "~features/space/space";
import { setTwigTree } from "~features/space/spaceSlice";
import { store } from "~store";
import type { IdToType } from "~types";
import type { Twig } from "../twigs/twig";
import { selectIdToTwig } from "../twigs/twigSlice";

export const loadTwigTree = (client: ApolloClient<NormalizedCacheObject>) => {
  const state = store.getState();
  const idToTwig = selectIdToTwig(SpaceType.FRAME)(state);

  const twigs = Object.keys(idToTwig).map(id => idToTwig[id])
    .filter(twig => !twig.deleteDate)

  const idToChildIdToTrue: IdToType<IdToType<true>> = {};
  const idToDescIdToTrue: IdToType<IdToType<true>> = {};

  twigs.forEach(twig => {
    if (twig.parent) {
      if (idToChildIdToTrue[twig.parent.id]) {
        idToChildIdToTrue[twig.parent.id][twig.id] = true;
      }
      else {
        idToChildIdToTrue[twig.parent.id] = {
          [twig.id]: true,
        };
      }

      let twig1 = twig;
      while (twig1?.parent) {
        if (idToDescIdToTrue[twig1.parent.id]) {
          idToDescIdToTrue[twig1.parent.id][twig.id] = true;
        }
        else {
          idToDescIdToTrue[twig1.parent.id] = {
            [twig.id]: true,
          };
        }
        twig1 = idToTwig[twig1.parent.id]
      }
    }
  });

  //console.log('setTwigTree', idToDescIdToTrue)
  store.dispatch(setTwigTree({
    space: SpaceType.FRAME,
    idToChildIdToTrue,
    idToDescIdToTrue,
  }))
}
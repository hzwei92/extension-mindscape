import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { SpaceType } from "~features/space/space";
import { store } from "~store";
import type { IdToType } from "~types";
import type { Twig } from "./twig";
import { FULL_TWIG_FIELDS, TWIG_WITH_PARENT } from "./twigFragments";
import { selectTwigIdToTrue, setTwigTree } from "./twigSlice";

export const loadTwigTree = (client: ApolloClient<NormalizedCacheObject>) => {
  const state = store.getState();
  const twigIdToTrue = selectTwigIdToTrue(SpaceType.FRAME)(state);

  const twigs = [];
  Object.keys(twigIdToTrue).forEach(twigId => {
    const twig = client.cache.readFragment({
      id: client.cache.identify({
        id: twigId,
        __typename: 'Twig',
      }),
      fragment: FULL_TWIG_FIELDS,
      fragmentName: 'FullTwigFields',
    }) as Twig;
    //console.log(twigId, twig)
    if (twig && !twig.deleteDate) {
      twigs.push(twig);
    }
  });

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
        twig1 = client.cache.readFragment({
          id: client.cache.identify(twig1.parent),
          fragment: TWIG_WITH_PARENT,
        }) as Twig;
      }
    }
  });

  console.log('setTwigTree', idToDescIdToTrue)
  store.dispatch(setTwigTree({
    space: SpaceType.FRAME,
    idToChildIdToTrue,
    idToDescIdToTrue,
  }))
}
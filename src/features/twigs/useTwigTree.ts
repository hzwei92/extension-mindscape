import { useApolloClient } from '@apollo/client';
import { FULL_TWIG_FIELDS, TWIG_WITH_PARENT } from './twigFragments';
import type { Twig } from './twig';
import { useAppDispatch, useAppSelector } from '~store';
import type { SpaceType } from '../space/space';
import { selectShouldReloadTwigTree, selectTwigIdToTrue, setShouldReloadTwigTree, setTwigTree } from './twigSlice';
import { Dispatch, SetStateAction, useContext, useEffect } from 'react';
import { AppContext } from '~newtab/App';
import type { IdToType } from '~types';

export default function useTwigTree(space: SpaceType) {
  const dispatch = useAppDispatch();
  const client = useApolloClient();
  
  const shouldReloadTwigTree = useAppSelector(selectShouldReloadTwigTree(space));
  const twigIdToTrue = useAppSelector(selectTwigIdToTrue(space));

  const loadTwigTree = () => {
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
      console.log(twigId, twig)
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

    console.log('setTwigTree')
    dispatch(setTwigTree({
      space,
      idToChildIdToTrue,
      idToDescIdToTrue,
    }))
  }

  useEffect(() => {
    if (!shouldReloadTwigTree) return;
    loadTwigTree();
    dispatch(setShouldReloadTwigTree({
      space,
      shouldReloadTwigTree: false,
    }));
  }, [shouldReloadTwigTree])
}
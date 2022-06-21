import { useApolloClient } from '@apollo/client';
import { FULL_TWIG_FIELDS, TWIG_WITH_PARENT } from './twigFragments';
import type { Twig } from './twig';
import type { IdToIdToTrueType } from '~utils';
import { useAppDispatch, useAppSelector } from '~store';
import type { SpaceType } from '../space/space';
import { selectTwigIdToTrue, setTwigTree } from './twigSlice';
import { Dispatch, SetStateAction, useContext, useEffect } from 'react';
import { AppContext } from '~newtab/App';

export default function useTwigTree(space: SpaceType) {
  const dispatch = useAppDispatch();
  const client = useApolloClient();

  const { refresh, setRefresh } = useContext(AppContext);
  
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
      if (twig && !twig.deleteDate) {
        twigs.push(twig);
      }
    });

    const idToChildIdToTrue: IdToIdToTrueType = {};
    const idToDescIdToTrue: IdToIdToTrueType = {};

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
    if (!refresh) return;
    loadTwigTree();
    setRefresh(false);
    return () => {
      setRefresh(false)
    }
  }, [refresh])
}
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  RESYNC,
  persistStore,
  persistReducer,
} from "@plasmohq/redux-persist";
import autoMergeLevel2 from '@plasmohq/redux-persist/lib/stateReconciler/autoMergeLevel2' 
import { Storage } from "@plasmohq/storage";
import { Action, combineReducers, configureStore, Store, ThunkAction } from "@reduxjs/toolkit";
import { localStorage } from "redux-persist-webextension-storage";
import counterSlice from "~features/counter/counterSlice";
import authSlice from "~features/auth/authSlice";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import userSlice from "~features/user/userSlice";
import windowSlice from "~features/window/windowSlice";
import arrowSlice from "~features/arrow/arrowSlice";
import menuSlice from "~features/menu/menuSlice";
import spaceSlice from "~features/space/spaceSlice";
import twigSlice from "~features/twigs/twigSlice";
import { ErrMessage, MessageName, PORT_NAME } from "~constants";
import type { StateReconciler } from "@plasmohq/redux-persist/lib/types";
import { SpaceType } from "~features/space/space";

const isPlainEnoughObject = (o) => {
  return o !== null && !Array.isArray(o) && typeof o === 'object';
}

const merge: StateReconciler<any> = (inboundState, originalState, reducedState, { debug }) => {
  const newState = Object.assign({}, reducedState);
  // only rehydrate if inboundState exists and is an object
  if (inboundState && typeof inboundState === 'object') {
      const keys = Object.keys(inboundState);
      keys.forEach(key => {
          // ignore _persist data
          if (key === '_persist')
              return;
          // if reducer modifies substate, skip auto rehydration
          if (originalState[key] !== reducedState[key]) {
              if (process.env.NODE_ENV !== 'production' && debug)
                  console.log('redux-persist/stateReconciler: sub state for key `%s` modified, skipping.', key);
              return;
          }
          if (isPlainEnoughObject(reducedState[key])) {
              if (
                (
                  inboundState?.auth?.isDone && 
                  (key === 'arrow' || 
                  key === 'twig' || 
                  key === 'user')
                ) ||
                key === 'FRAME' || 
                key === 'FOCUS'
              ) {
                newState[key] = merge(inboundState[key], originalState[key], reducedState[key], persistConfig)
              }
              else {
                // if object is plain enough shallow merge the new values (hence "Level2")  
                newState[key] = Object.assign(Object.assign({}, newState[key]), inboundState[key]);
              }

              return;
          }
          // otherwise hard set
          newState[key] = inboundState[key];
      });
  }
  if (process.env.NODE_ENV !== 'production' &&
      debug &&
      inboundState &&
      typeof inboundState === 'object')
      console.log(`redux-persist/stateReconciler: rehydrated keys '${Object.keys(inboundState).join(', ')}'`);
  return newState;
}
export const persistConfig = {
  key: 'redux',
  version: 1,
  storage: localStorage,
  debug: false,
  throttle: 0,
  stateReconciler: merge,
};

const rootReducer = combineReducers({
  arrow: arrowSlice,
  auth: authSlice,
  counter: counterSlice,
  menu: menuSlice,
  space: spaceSlice,
  twig: twigSlice,
  user: userSlice,
  window: windowSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store: Store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
          RESYNC
        ]
      }
    })
});
export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// This is what makes Redux sync properly with multiple pages
// Open your extension's options page and popup to see it in action

new Storage('local').watch({
  [`persist:${persistConfig.key}`]: (changes) => {
    // console.log('watch redux', changes)
    // console.log(JSON.parse(changes.newValue.twig));
    // console.log(JSON.parse(changes.oldValue.twig));
    persistor.resync();
  },
  ['apollo-cache-persist']: (changes) => {
    //console.log('watch apollo', changes.newValue)
    try {
      const port = chrome.runtime.connect({
        name: PORT_NAME,
      });
      if (port) {
        port.postMessage({
          name: MessageName.RESTORE_CACHE,
        });
        port.disconnect();
      }
    } catch (err) {
      if (err.message === ErrMessage.NO_RECEIVER) {
        console.log('newtab not open')
      }
      else {
        console.log(err);
      }
    }

  },
})

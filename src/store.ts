import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  RESYNC,
  persistReducer,
  persistStore
} from "@plasmohq/redux-persist"
import { Storage } from "@plasmohq/storage"
import { Action, combineReducers, configureStore, Store, ThunkAction } from "@reduxjs/toolkit"
import { localStorage } from "redux-persist-webextension-storage"
import counterSlice from "~features/counter/counterSlice"
import authSlice from "~features/auth/authSlice"
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
import userSlice from "~features/user/userSlice"
import windowSlice from "~features/window/windowSlice"
import arrowSlice from "~features/arrow/arrowSlice"
import menuSlice from "~features/menu/menuSlice"
import spaceSlice from "~features/space/spaceSlice"
import twigSlice from "~features/twigs/twigSlice"
import { ErrMessage, MessageName, PORT_NAME } from "~constants"

const rootReducer = combineReducers({
  arrow: arrowSlice,
  auth: authSlice,
  counter: counterSlice,
  menu: menuSlice,
  space: spaceSlice,
  twig: twigSlice,
  user: userSlice,
  window: windowSlice,
})

export const persistConfig = {
  key: "root",
  version: 1,
  storage: localStorage
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

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
})
export const persistor = persistStore(store)

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
    console.log('watch redux', changes)
    //console.log(JSON.parse(changes.newValue.twig))
    persistor.resync()
  },
  ['apollo-cache-persist']: (changes) => {
    //console.log('watch apollo', changes)
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

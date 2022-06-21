import type { NormalizedCacheObject } from "@apollo/client"
import type { ApolloClient } from "@apollo/client"
import { v4 } from "uuid"
import { AlarmType, PORT_NAME } from "~constants"
import { getCurrentUser, initUser, refreshToken } from "~features/auth/auth"
import { selectAuthIsDone, selectTokenIsInit, selectTokenIsValid, setAuthIsDone, setSessionId, setTokenIsInit } from "~features/auth/authSlice"
import { decrement, increment } from "~features/counter/counterSlice"
import { getTwigs } from "~features/twigs/twig"
import { selectUserId, setUserId } from "~features/user/userSlice"
import { persistor, RootState, store } from "~store"

let prevState: RootState;
chrome.tabs.onCreated.addListener(tab => {
  store.dispatch(increment());
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  store.dispatch(decrement());
});

chrome.storage.onChanged.addListener(changes => {
  //console.log('changes', changes);
});

chrome.runtime.onInstalled.addListener(async details => {
  console.log('installed', details);

  store.dispatch(setSessionId(v4()));
  chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === AlarmType.REFRESH_TOKEN) {
      refreshToken();
      return;
    }
  })

  persistor.subscribe(async () => {  
    const state = store.getState();
    //console.log("State changed with: ", state)
  
    const authIsDone = selectAuthIsDone(state);
    if (!authIsDone) {
      const userId = selectUserId(state);
      if (userId) {
        getTwigs(userId);
        store.dispatch(setAuthIsDone(true));
      }
      else {
        const tokenIsInit = selectTokenIsInit(state);
        const tokenIsValid = selectTokenIsValid(state);
        if (tokenIsInit) {
          if (tokenIsValid) {
            getCurrentUser();
          }
          else {
            initUser();
          }
        }
      }
    }
  
    prevState = state;
  })

  store.dispatch(setTokenIsInit(false))
  store.dispatch(setAuthIsDone(false));
  store.dispatch(setUserId(''));

  refreshToken();
})
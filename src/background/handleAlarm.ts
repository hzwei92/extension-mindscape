import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import type { Persistor } from "@plasmohq/redux-persist/lib/types";
import type { CachePersistor } from "apollo3-cache-persist";
import type { Store } from "redux";
import { AlarmType, ALARM_DELIMITER, ErrMessage } from "~constants";
import { refreshToken } from "~features/auth/auth";
import { getTabTree } from "~features/tab/getTabTree";
import { maintainSubtree } from "~features/tab/maintainSubtree";
import { syncTabState } from "~features/tab/syncTabState";
import type { Twig } from "~features/twigs/twig";
import type { User } from "~features/user/user";
import { selectCurrentUser } from "~features/user/userSlice";
import { getClient } from "~graphql";
import type { IdToType } from "~types";
import { createGroup } from "../features/tab/createGroup";
import { createTab } from "../features/tab/createTab";
import { moveTab } from "../features/tab/moveTab";
import { updateTab } from "../features/tab/updateTab";

export const handleAlarm = (store: Store, persistor: Persistor) =>
  (client: ApolloClient<NormalizedCacheObject>, cachePersistor: CachePersistor<NormalizedCacheObject>) => 
  (tabIdToMoveBlocked: IdToType<number>, newIdToTwig: IdToType<Twig>) =>
  async alarm => {
    console.log('alarm', alarm)
    await cachePersistor.restore();

    if (alarm.name === AlarmType.REFRESH_TOKEN) {
      refreshToken(client);
      return;
    }

    const name = alarm.name.split(ALARM_DELIMITER);

    if (parseInt(name[2]) >= 25) {
      const alarms = await chrome.alarms.getAll();

      await Promise.all(alarms.map(async alarm => {
        const name = alarm.name.split(ALARM_DELIMITER);
        if (
          name[0] === AlarmType.CREATE_GROUP ||
          name[0] === AlarmType.CREATE_TAB ||
          name[0] === AlarmType.UPDATE_TAB ||
          name[0] === AlarmType.MOVE_TAB 
        ) {
          await chrome.alarms.clear(alarm.name);
        }
      }));
      
      const state = store.getState();
      const user: User = selectCurrentUser(state);
      const tabTree = await getTabTree(store)(client);

      await syncTabState(client, cachePersistor)(user.frame.rootTwigId, [tabTree])

      return;
    }
    if (name[0] === AlarmType.CREATE_GROUP) {
      const groupId = parseInt(name[1]);
      const group = await chrome.tabGroups.get(groupId);
      const count = parseInt(name[2]) + 1;
      await createGroup(store, persistor)(client, cachePersistor)(group, newIdToTwig, count);
      return;
    }

    if (name[0] === AlarmType.CREATE_TAB) {
      const tabId = parseInt(name[1]);
      const tab = await chrome.tabs.get(tabId);
      const count = parseInt(name[2]) + 1;
      await createTab(store, persistor)(client, cachePersistor)(tab, newIdToTwig, count);
      return;
    }

    if (name[0] === AlarmType.UPDATE_TAB) {
      const tabId =  parseInt(name[1]);
      const tab = await chrome.tabs.get(tabId);
      const count = parseInt(name[2]) + 1;
      await updateTab(tab, count);
      return;
    }

    if (name[0] === AlarmType.MOVE_TAB) {
      const { client, persistor } = await getClient();
      const tabId =  parseInt(name[1]);
      const tab = await chrome.tabs.get(tabId);
      const count = parseInt(name[2]) + 1;
      await moveTab(client, persistor)(tab, count);
      return;
    }

    if (name[0] === AlarmType.MAINTAIN_SUBTREE) {
      const tabId = parseInt(name[1]);
      maintainSubtree(client)(tabIdToMoveBlocked)(tabId);
      return;
    }

    if (name[0] === AlarmType.NO_GROUP) {
      const tabId = parseInt(name[1]);

      const focusWindow = await chrome.windows.getLastFocused();
      const tab = await chrome.tabs.get(tabId);

      if (tab && tab.groupId === -1) {
        try {
          await chrome.tabs.group({
            tabIds: [tabId],
            createProperties: {
              windowId: focusWindow.id,
            }
          });
        } catch (err) {
          if (err.message === ErrMessage.CANNOT_EDIT_TABS) {
            chrome.alarms.create(alarm.name, {
              when: Date.now() + 100,
            });
          }
          else if (err.message === ErrMessage.NO_TAB + tabId +'.') {
            
          }
          else {
            console.error(err);
          }
        }
      }
      return;
    }

  }
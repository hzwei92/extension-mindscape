import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import type { Persistor } from "@plasmohq/redux-persist/lib/types";
import type { CachePersistor } from "apollo3-cache-persist";
import type { Store } from "redux";
import { AlarmType, ALARM_DELIMITER, ErrMessage } from "~constants";
import { refreshToken } from "~features/auth/auth";
import { createGroup } from "./createGroup";
import { createTab } from "./createTab";
import { moveTab } from "./moveTab";
import { orderAndGroupTabs } from "./orderAndGroupTabs";
import { updateTab } from "./updateTab";

export const handleAlarm = (store: Store, persistor: Persistor) => 
  (client: ApolloClient<NormalizedCacheObject>, cachePersistor: CachePersistor<NormalizedCacheObject>) => 
  async alarm => {
    console.log('alarm', alarm)

    if (alarm.name === AlarmType.REFRESH_TOKEN) {
      refreshToken(client);
      return;
    }

    const name = alarm.name.split(ALARM_DELIMITER);

    if (name[0] === AlarmType.CREATE_GROUP) {
      const groupId = parseInt(name[1]);
      const group = await chrome.tabGroups.get(groupId);
      await createGroup(client, cachePersistor)(group);
      return;
    }

    if (name[0] === AlarmType.CREATE_TAB) {
      const tabId = parseInt(name[1]);
      const tab = await chrome.tabs.get(tabId);
      await createTab(client)(tab);
      return;
    }

    if (name[0] === AlarmType.UPDATE_TAB) {
      const tabId =  parseInt(name[1]);
      const tab = await chrome.tabs.get(tabId);
      await updateTab(client)(tab);
      return;
    }

    if (name[0] === AlarmType.MOVE_TAB) {
      const tabId =  parseInt(name[1]);
      const tab = await chrome.tabs.get(tabId);
      await moveTab(client, cachePersistor)(tab);
      return;
    }

    try {
      if (name[0] === AlarmType.NO_GROUP) {
        const tabId = parseInt(name[1]);

        const focusWindow = await chrome.windows.getLastFocused();

        const tab = await chrome.tabs.get(tabId);

        if (tab.groupId === -1) {
          await chrome.tabs.group({
            tabIds: [tabId],
            createProperties: {
              windowId: focusWindow.id,
            }
          });
        }
      }
      else if (name[0] === AlarmType.MAINTAIN_SUBTREE) {
        const index = parseInt(name[1]);
        const groupId = parseInt(name[2])
        const tabIds = name.slice(3).map(tabId => parseInt(tabId));
        await chrome.tabs.move(tabIds, {
          index,
        });
        await chrome.tabs.group({
          tabIds,
          groupId,
        });
      }
    } catch (err) {
      if (err.message === ErrMessage.CANNOT_EDIT_TABS) {
        chrome.alarms.create(alarm.name, {
          when: Date.now() + 100,
        });
      }
      else {
        console.error(err);
      }
    }
  }
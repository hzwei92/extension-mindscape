import { useApolloClient } from "@apollo/client";
import React, { Dispatch, MutableRefObject, SetStateAction, useEffect, useState } from "react";
import { MAX_Z_INDEX } from "~constants";
import type { User } from "~features/user/user";
import { selectUserId } from "~features/user/userSlice";
import { useAppDispatch, useAppSelector } from "~store";
import { createTheme, Paper, ThemeProvider } from "@mui/material";
import { selectPalette, setPalette, setSize } from "~features/window/windowSlice";
import { SnackbarProvider } from 'notistack';
import AppBar from "./AppBar";
import MenuComponent from "~features/menu/MenuComponent";
import FrameComponent from "~features/frame/FrameComponent";
import { FULL_USER_FIELDS } from "~features/user/userFragments";

export const AppContext = React.createContext({} as {
  frameSpaceEl: MutableRefObject<HTMLElement | undefined>
  focusSpaceEl: MutableRefObject<HTMLElement | undefined>
  setFrameSpaceEl: Dispatch<SetStateAction<MutableRefObject<HTMLElement | undefined>>>
  setFocusSpaceEl: Dispatch<SetStateAction<MutableRefObject<HTMLElement | undefined>>>
  port: chrome.runtime.Port | null
});

interface AppProps {
  port: chrome.runtime.Port
}
export default function App(props: AppProps) {
  console.log('app')
  const client = useApolloClient();
  const dispatch = useAppDispatch();

  const userId = useAppSelector(selectUserId);
  const user = client.cache.readFragment({
    id: client.cache.identify({
      id: userId,
      __typename: 'User',
    }),
    fragment: FULL_USER_FIELDS,
    fragmentName: 'FullUserFields',
  }) as User;

  console.log(userId, user);

  const palette = useAppSelector(selectPalette);

  const [theme, setTheme] = useState(createTheme({
    zIndex: {
      modal: MAX_Z_INDEX + 1000,
      snackbar: MAX_Z_INDEX + 10000
    },
    palette: {
      primary: {
        main: user?.color || (palette === 'dark' ? '#ffffff' : '#000000'),
      },
      mode: palette,
    },
  }));

  const [frameSpaceEl, setFrameSpaceEl] = useState(null as MutableRefObject<HTMLElement | undefined>);
  const [focusSpaceEl, setFocusSpaceEl] = useState(null as MutableRefObject<HTMLElement | undefined>);

  useEffect(() => {
    const handleResize = () => {
      dispatch(setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      }));
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const handlePaletteModeChange =  (event: any) => {
      dispatch(setPalette(event.matches 
        ? 'dark' 
        : 'light'
      ));
    };

    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', handlePaletteModeChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.matchMedia('(prefers-color-scheme: dark)')
        .removeEventListener('change', handlePaletteModeChange);
    };
  }, [])

  useEffect(() => {
    setTheme(createTheme({
      zIndex: {
        modal: MAX_Z_INDEX + 1000,
        snackbar: MAX_Z_INDEX + 10000
      },
      palette: {
        primary: {
          main: user?.color || (palette === 'dark' ? '#ffffff' : '#000000'),
        },
        mode: palette,
      },
    }));
  }, [user?.color, palette]);
  
  return (
    <AppContext.Provider value={{
      frameSpaceEl, 
      focusSpaceEl, 
      setFrameSpaceEl, 
      setFocusSpaceEl, 
      port: props.port,
    }}>  
      <ThemeProvider theme={theme}>
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          preventDuplicate={true}
          dense={true}
          autoHideDuration={10000}
        >
          <Paper sx={{
            height: '100%',
            width: '100%',
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'row',
          }}>
            <AppBar user={user} />
            <MenuComponent user={user} />
            <FrameComponent user={user} />
          </Paper>
        </SnackbarProvider>
      </ThemeProvider>
    </AppContext.Provider>
  );
}
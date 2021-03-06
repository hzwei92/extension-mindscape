import type { NormalizedCacheObject } from "@apollo/client";
import React, { Dispatch, MutableRefObject, SetStateAction, useEffect, useState } from "react";
import { MAX_Z_INDEX } from "~constants";
import { selectCurrentUser } from "~features/user/userSlice";
import { persistor, useAppDispatch, useAppSelector } from "~store";
import { createTheme, Paper, ThemeProvider } from "@mui/material";
import { selectPalette, setPalette } from "~features/window/windowSlice";
import { SnackbarProvider } from 'notistack';
import AppBar from "./AppBar";
import MenuComponent from "~features/menu/MenuComponent";
import FrameComponent from "~features/frame/FrameComponent";
import type { CachePersistor } from "apollo3-cache-persist";
import { selectAuthIsDone } from "~features/auth/authSlice";
import type { User } from "~features/user/user";

export const AppContext = React.createContext({} as {
  tabId: number,
  frameSpaceEl: MutableRefObject<HTMLElement | undefined>;
  focusSpaceEl: MutableRefObject<HTMLElement | undefined>;
  setFrameSpaceEl: Dispatch<SetStateAction<MutableRefObject<HTMLElement | undefined>>>;
  setFocusSpaceEl: Dispatch<SetStateAction<MutableRefObject<HTMLElement | undefined>>>;
  cachePersistor: CachePersistor<NormalizedCacheObject>;
  width: number;
  height: number;
});

interface AppProps {
  cachePersistor: CachePersistor<NormalizedCacheObject>;
  tabId: number;
}
export default function App(props: AppProps) {
  console.log('app')
  const dispatch = useAppDispatch();

  const authIsDone = useAppSelector(selectAuthIsDone);

  const user: User | null = useAppSelector(selectCurrentUser);

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

  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
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
  }, []);


  useEffect(() => {
    console.log('herewego', authIsDone, user)
    if (authIsDone && !user) {
      persistor.resync();
      props.cachePersistor.restore();
    }
  }, [user, authIsDone])


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
      tabId: props.tabId,
      frameSpaceEl, 
      focusSpaceEl, 
      setFrameSpaceEl, 
      setFocusSpaceEl,
      cachePersistor: props.cachePersistor,
      width,
      height,
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
import { Box, Card, IconButton, Icon, Divider } from "@mui/material"
import { MAX_Z_INDEX, MOBILE_WIDTH } from "../constants"
import MapIcon from "@mui/icons-material/Map"
import SearchIcon from "@mui/icons-material/Search"
import AccountCircle from "@mui/icons-material/AccountCircle"
import DynamicFeedIcon from "@mui/icons-material/DynamicFeed"
import HubIcon from "@mui/icons-material/Hub"
import PodcastsIcon from "@mui/icons-material/Podcasts"
import CropDinIcon from "@mui/icons-material/CropDin"
import CropFreeIcon from "@mui/icons-material/CropFree"
import Brightness4Icon from "@mui/icons-material/Brightness4"
import {useAppSelector, useAppDispatch } from "../store"
import type { User } from "~features/user/user"
import { selectColor, togglePalette } from "~features/window/windowSlice"
import { selectMenuMode, setMenuMode } from "~features/menu/menuSlice"
import { MenuMode } from "~features/menu/menu"
import { useContext } from "react"
import { AppContext } from "./App"
import { getAppBarWidth } from "~utils";

interface AppBarProps {
  user: User | null;
}

export default function AppBar(props: AppBarProps) {
  const dispatch = useAppDispatch();

  const { width } = useContext(AppContext);
  const appBarWidth = getAppBarWidth(width);
  const color = useAppSelector(selectColor(false));
  const menuMode = useAppSelector(selectMenuMode);

  const handleAboutClick = () => {

  }

  const handleAccountClick = () => {
    dispatch(setMenuMode({
      mode: MenuMode.ACCOUNT,
      toggle: true,
    }))
  }

  const handleSignalClick = () => {

  }

  const handleGraphClick = () => {

  }

  const handleMapClick = () => {

  }

  const handleSearchClick = () => {

  }

  const handleFeedClick = () => {

  }
  const handleFrameClick = () => {

  }
  const handleFocusClick = () => {

  }
  const handlePaletteClick = () => {
    dispatch(togglePalette(null))
  }
  return (
    <Box>
      <Card elevation={5} sx={{
        position: 'fixed',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        textAlign: 'center',
        minHeight: '100%',
        width: appBarWidth,
        marginRight: '1px',
        zIndex: MAX_Z_INDEX + 100,
        borderRadius: 0,
      }}>
        <Box>
          <Box sx={{
            padding: '5px',
            paddingTop: 1,
          }}>
            <IconButton title='About' size='small' onClick={handleAboutClick} sx={{
              border: menuMode === MenuMode.ABOUT
                ? `1px solid ${props.user?.color || color}`
                : 'none',
              fontSize: width < MOBILE_WIDTH
                ? 16
                : 28,
            }}>
              <Icon fontSize='inherit'>
                👁‍🗨
              </Icon>
            </IconButton>
          </Box>
          <Box title='Account' sx={{paddingTop: 1}}>
            <IconButton onClick={handleAccountClick} sx={{
              border: menuMode === MenuMode.ACCOUNT
                ? `1px solid ${props.user?.color}`
                : 'none',
              color: menuMode === MenuMode.ACCOUNT
                ? 'primary.main'
                : color,
            }}>
              <AccountCircle/>
            </IconButton>
          </Box>
          <Box title='Signal' sx={{paddingTop: 1}}>
            <IconButton onClick={handleSignalClick} sx={{
              border: menuMode === MenuMode.SIGNAL
                ? `1px solid ${props.user?.color}`
                : 'none',
              color: menuMode === MenuMode.SIGNAL
                ? 'primary.main'
                : color,
            }}>
              <PodcastsIcon/>
            </IconButton>
          </Box>
          <Box title='Graphs' sx={{paddingTop: 1}}>
            <IconButton onClick={handleGraphClick} sx={{
              border: menuMode === MenuMode.GRAPH
                ? `1px solid ${props.user?.color}`
                : 'none',
              color: menuMode === MenuMode.GRAPH
                ? 'primary.main'
                : color,
            }}>
              <HubIcon/>
            </IconButton>
          </Box>
          <Box title='Search' sx={{paddingTop: 1}}>
            <IconButton onClick={handleSearchClick} sx={{
              border: menuMode === MenuMode.SEARCH
                ? `1px solid ${props.user?.color}`
                : 'none',
              color: menuMode === MenuMode.SEARCH
                ? 'primary.main'
                : color,
            }}>
              <SearchIcon/>
            </IconButton>
          </Box>
          <Box title='Map' sx={{paddingTop: 1}}>
            <IconButton onClick={handleMapClick} sx={{
              border: menuMode === MenuMode.MAP
                ? `1px solid ${props.user?.color}`
                : 'none',
              color: menuMode === MenuMode.MAP
                ? 'primary.main'
                : color,
            }}>
              <MapIcon/>
            </IconButton>
          </Box>
          <Box title='Feed' sx={{paddingTop: 1}}>
            <IconButton onClick={handleFeedClick} sx={{
              border: menuMode === MenuMode.FEED
                ? `1px solid ${props.user?.color}`
                : 'none',
              color: menuMode === MenuMode.FEED
                ? 'primary.main'
                : color,
            }}>
              <DynamicFeedIcon/>
            </IconButton>
          </Box>
        </Box>
        <Box sx={{
          marginBottom: '5px',
          padding: '5px',
        }}>
          <IconButton 
            size='small' 
            onClick={handlePaletteClick}
            title='Toggle light/dark menuMode' 
            sx={{
              color,
            }}
          >
            <Brightness4Icon/>
          </IconButton>
        </Box>
      </Card>
      <Box sx={{
        width: appBarWidth
      }}/>
    </Box>
  )
}
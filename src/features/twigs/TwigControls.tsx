import { Box, Button, IconButton, Menu, MenuItem } from '@mui/material';
import React, { Dispatch, SetStateAction, useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LinkIcon from '@mui/icons-material/Link';
import NotificationsTwoToneIcon from '@mui/icons-material/NotificationsTwoTone';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import EditIcon from '@mui/icons-material/Edit';
import CropDinIcon from '@mui/icons-material/CropDin';
import CropFreeIcon from '@mui/icons-material/CropFree';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import type { Twig } from './twig';
import type { SpaceType } from '../space/space';
import type { Role } from '../role/role';
import { useAppDispatch, useAppSelector } from '~store';
import { useSnackbar } from 'notistack';
import type { Arrow } from '../arrow/arrow';
import { selectColor } from '../window/windowSlice';
import type { User } from '../user/user';
import UserTag from '../user/UserTag';
import useReplyTwig from './useReplyTwig';
import { selectCreateLink, setCommitArrowId, setCreateLink, setRemoveArrowId } from '../arrow/arrowSlice';
import { useApolloClient } from '@apollo/client';
import { FULL_ARROW_FIELDS } from '~features/arrow/arrowFragments';
//import useCenterTwig from './useCenterTwig';

interface TwigControlsProps {
  user: User | null;
  space: SpaceType;
  twig: Twig;
  abstract: Arrow;
  role: Role | null;
  canPost: boolean;
  canView: boolean;
  canEdit: boolean;
  isPost: boolean;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}
function TwigControls(props: TwigControlsProps) {
  const client = useApolloClient();
  const dispatch = useAppDispatch();

  const arrow = client.cache.readFragment({
    id: client.cache.identify({
      id: props.twig.detailId,
      __typename: 'Arrow',
    }),
    fragment: FULL_ARROW_FIELDS,
    fragmentName: 'FullArrowFields',
  }) as Arrow;

  const color = useAppSelector(selectColor(true))

  const createLink = useAppSelector(selectCreateLink);

  const frameTwig = null;
  const focusTwig = null;

  const [menuAnchorEl, setMenuAnchorEl] = useState(null as Element | null);
  const [isEditingRoute, setIsEditingRoute] = useState(false);


  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  
  const { replyTwig } = useReplyTwig(props.user, props.space, props.abstract, props.canEdit);

  
  // const { detail } = useSubArrow(props.twig.post, () => {
  //   props.setIsLoading(false);
  // });
  // const { undetail } = useUndetail(props.twig.post, () => {
  //   props.setIsLoading(false);
  // });

  // const { addTwig: addFrameTwig } = useAddTwig('FRAME');
  // const { addTwig: addFocusTwig } = useAddTwig('FOCUS');

  //const { centerTwig: centerFrameTwig } = useCenterTwig(props.user, 'FRAME');
  //const { centerTwig: centerFocusTwig } = useCenterTwig(props.user, 'FOCUS');


  const handleMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
  }

  const handleReplyClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    replyTwig(props.twig);
  }

  const handleLinkClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (createLink.sourceId === props.twig.detailId) {
      dispatch(setCreateLink({
        sourceId: '',
        targetId: '',
      }));
    }
    else {
      dispatch(setCreateLink({
        sourceId: props.twig.detailId,
        targetId: '',
      }));
    }
  }

  const handleMenuOpenClick = (event: React.MouseEvent) => {
    setMenuAnchorEl(event.currentTarget);
  }
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setIsEditingRoute(false);
  }

  const handleRouteClick = (event: React.MouseEvent) => {
    setIsEditingRoute(!isEditingRoute);
  }

  const handleCopyClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    navigator.clipboard.writeText(`https://mindscape.pub/m/${arrow.routeName}`);
    const handleDismissClick = (event: React.MouseEvent) => {
      closeSnackbar(props.twig.id);
    }
    enqueueSnackbar('URL copied', {
      key: props.twig.id,
      action: () => {
        return (
          <Box>
            <IconButton onClick={handleDismissClick} sx={{
              color,
            }}>
              <CloseIcon sx={{
                fontSize: 14,
              }}/>
            </IconButton>
          </Box>
        );
      }
    })
    handleMenuClose();
  }

  const handleCopyRelativeClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    navigator.clipboard.writeText(`https://mindscape.pub/m/${props.abstract.routeName}/${props.twig.i}`);
    const handleDismissClick = (event: React.MouseEvent) => {
      closeSnackbar(props.twig.id + 'context');
    }
    enqueueSnackbar('URL (with context) copied ', {
      key: props.twig.id + 'context',
      action: () => {
        return (
          <Box>
            <IconButton onClick={handleDismissClick} sx={{
              color,
            }}>
              <CloseIcon sx={{
                fontSize: 14,
              }}/>
            </IconButton>
          </Box>
        );
      }
    })
    handleMenuClose();
  }

  const handleSubClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    //detail();
    props.setIsLoading(true);
    handleMenuClose();
  }
  
  const handleUnsubClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    //undetail();
    props.setIsLoading(true);
    handleMenuClose();
  }

  const handleFrameClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    /*
    if (frameTwig) {
      if (frameTwig.postId === frameArrowId) {
        centerFrameTwig(frameTwig, true, 0);
      }
      else {
      }
    }
    else {
      addFrameTwig(props.twig.post.id)
    }*/
  }

  const handleFocusClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    /*
    if (focusTwig) {
      if (focusTwig.postId === focusArrowId) {
        centerFocusTwig(focusTwig, true, 0);
      }
      else {
      }
    }
    else {
      addFocusTwig(props.twig.post.id);
    }*/
  }

  const handleCommitClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    dispatch(setCommitArrowId(props.twig.detailId))
    handleMenuClose();
  }

  const handleRemoveClick =  (event: React.MouseEvent) => {
    event.stopPropagation();
    dispatch(setRemoveArrowId(props.twig.detailId));
    handleMenuClose();
  }

  const handlePrevClick = (event: React.MouseEvent) => {
    event.stopPropagation();

  }

  const handleNextClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  }

  return (
    <Box sx={{
      margin: 1,
      marginTop: 0,
      marginLeft: 0,
    }}>
      <Button
        disabled={!props.canPost}
        onMouseDown={handleMouseDown} 
        onClick={handleReplyClick}
        sx={{
          color,
          fontSize: 12,
        }}
      >
        Reply
      </Button>

      <Button disabled={!props.canView} onMouseDown={handleMouseDown} onClick={handleLinkClick} sx={{
        color,
        fontSize: 12,
      }}>
        Link
      </Button>
      <IconButton onMouseDown={handleMouseDown} onClick={handleMenuOpenClick}>
        <MoreVertIcon sx={{
          color,
          fontSize: 12,
        }}/>
      </IconButton>
      <Menu
        open={!!menuAnchorEl}
        onClose={handleMenuClose}
        anchorEl={menuAnchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        {
          props.twig.user.id !== arrow.user.id
            ? <Box sx={{
                fontSize: 12,
                padding: 1,
              }}>
                reposted by&nbsp;
                <UserTag user={props.user} tagUser={props.twig.user} />
              </Box>
            : null
        }
        {
          arrow.userId === props.user?.id
            ? <MenuItem onClick={handleRouteClick} sx={{
                fontSize: 14,
              }}>
                <Box sx={{
                  marginLeft: '-5px',
                  marginBottom: '-5px',
                  fontSize: 14,
                }}>
                  <EditIcon fontSize='inherit'/>
                </Box>
                &nbsp; Edit hyperlink
              </MenuItem>
            : null
        }
        <MenuItem onClick={handleCopyClick} sx={{
          fontSize: 14,
        }}>
          <Box sx={{
            marginLeft: '-5px',
            marginBottom: '-5px',
            fontSize: 14,
          }}>
            <LinkIcon fontSize='inherit'/>
          </Box>
          &nbsp; Copy hyperlink
        </MenuItem>
        <MenuItem onClick={handleCopyRelativeClick} sx={{
          fontSize: 14,
        }}>
          <Box sx={{
            marginLeft: '-5px',
            marginBottom: '-5px',
            fontSize: 14,
          }}>
            <LinkIcon fontSize='inherit'/>
          </Box>
          &nbsp; Copy hyperlink (with context)
        </MenuItem>
        {
          arrow.userId === props.user?.id && !arrow.commitDate && !arrow.removeDate
            ? <MenuItem onClick={handleCommitClick} sx={{
                fontSize: 14,
              }}>
                <Box sx={{
                  marginLeft: '-5px',
                  marginBottom: '-5px',
                  fontSize: 14,
                }}>
                  <CheckIcon fontSize='inherit'/>
                </Box>
                &nbsp; Commit post
              </MenuItem>
            : null
        }
        {
          arrow.userId === props.user?.id && !arrow.removeDate
            ? <MenuItem onClick={handleRemoveClick} sx={{
                fontSize: 14,
              }}>
                <Box sx={{
                  marginLeft: '-5px',
                  marginBottom: '-5px',
                  fontSize: 14,
                }}>
                  <CloseIcon fontSize='inherit'/>
                </Box>
                &nbsp; Delete post
              </MenuItem>
            : null
        }
        {
          false // TOOD post subs
            ? <MenuItem onClick={handleUnsubClick} sx={{
                fontSize: 14,
              }}>
                <Box sx={{
                  marginLeft: '-5px',
                  marginBottom: '-5px',
                  fontSize: 14,
                  color: props.user?.color, 
                }}>
                  <NotificationsTwoToneIcon fontSize='inherit'/>
                </Box>
                &nbsp; Unsubscribe from post
              </MenuItem>
            : <MenuItem onClick={handleSubClick} sx={{
                fontSize: 14,
              }}>
                <Box sx={{
                  marginLeft: '-5px',
                  marginBottom: '-5px',
                  fontSize: 14,
                }}>
                  <NotificationsNoneIcon fontSize='inherit'/>
                </Box>
                &nbsp; Subscribe to post
              </MenuItem>
          }
          {
            props.space === 'FOCUS'
              ? <MenuItem onClick={handleFrameClick} sx={{
                  fontSize: 14,
                }}>
                  <Box sx={{
                    marginLeft: '-5px',
                    marginBottom: '-5px',
                    fontSize: 14,
                    color: frameTwig ? props.user?.frame?.color : null
                  }}>
                    <CropDinIcon fontSize='inherit'/>
                  </Box>
                  &nbsp; { frameTwig ? 'View in frame' : 'Add to frame' }
                </MenuItem>
              : props.user?.focusId
                ? <MenuItem onClick={handleFocusClick} sx={{
                    fontSize: 14,
                  }}>
                    <Box sx={{
                      marginLeft: '-5px',
                      marginBottom: '-5px',
                      fontSize: 14,
                      color: focusTwig ? props.user?.focus?.color : null
                    }}>
                      <CropFreeIcon fontSize='inherit'/>
                    </Box>
                    &nbsp; { focusTwig ? 'View in focus' : 'Add to focus' }
                  </MenuItem>
                : null
          }
      </Menu>
      <Button onMouseDown={handleMouseDown} onClick={handlePrevClick} sx={{
        color,
        fontSize: 12,
      }}>
        {arrow.inCount} IN
      </Button>
      <Button onMouseDown={handleMouseDown} onClick={handleNextClick} sx={{
        color,
        fontSize: 12,
      }}>
        {arrow.outCount} OUT
      </Button>
    </Box>
  )
}

export default React.memo(TwigControls)
import { Box, Paper } from '@mui/material';
import { useState } from 'react';
import AccountComponent from '~features/account/AccountComponent';
import { useAppDispatch, useAppSelector } from '~store';
import type { User } from '../user/user';
import { selectColor } from '../window/windowSlice';
import { selectActualMenuWidth, selectMenuIsResizing, setMenuIsResizing } from './menuSlice';

interface MenuComponentProps {
  user: User | null;
}
export default function MenuComponent(props: MenuComponentProps) {
  const dispatch = useAppDispatch();

  const menuWidth = useAppSelector(selectActualMenuWidth);
  const isResizing = useAppSelector(selectMenuIsResizing);
  const color = useAppSelector(selectColor(true));

  const [showResizer, setShowResizer] = useState(false);

  const handleResizeMouseEnter = (event: React.MouseEvent) => {
    setShowResizer(true);
  };

  const handleResizeMouseLeave = (event: React.MouseEvent) => {
    setShowResizer(false);
  };

  const handleResizeMouseDown = (event: React.MouseEvent) => {
    dispatch(setMenuIsResizing(true));
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'stretch',
      width: menuWidth,
      //height: '100%',
      transition: isResizing
        ? 'none'
        : 'width 0.5s'
    }}>
      <Paper sx={{
        height: '100%',
        width: 'calc(100% - 4px)',
        color,
      }}>
        <AccountComponent user={props.user} />
      </Paper>
      <Box 
        onMouseDown={handleResizeMouseDown}
        onMouseEnter={handleResizeMouseEnter}
        onMouseLeave={handleResizeMouseLeave} 
          sx={{
          width: 4,
          backgroundColor: showResizer
            ? 'primary.main'
            : color,
          cursor: 'col-resize'
        }}
      />
    </Box>
  )
}
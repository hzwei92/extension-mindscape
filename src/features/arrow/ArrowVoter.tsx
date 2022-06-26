import { Box, Button, IconButton } from '@mui/material';
import { useState } from 'react';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import type { Twig } from '../twigs/twig';
import type { SpaceType } from '../space/space';
import { useAppSelector } from '~store';
import type { Vote } from '../vote/vote';
import type { User } from '../user/user';
import { selectColor } from '../window/windowSlice';
import { useApolloClient } from '@apollo/client';
import { FULL_ARROW_FIELDS } from './arrowFragments';
import type { Arrow } from './arrow';

interface ArrowVoterProps {
  user: User;
  space: SpaceType;
  arrowId: string;
}
export default function ArrowVoter(props: ArrowVoterProps) {
  const client = useApolloClient();

  const arrow = client.cache.readFragment({
    id: client.cache.identify({
      id: props.arrowId,
      __typename: 'Arrow',
    }),
    fragment: FULL_ARROW_FIELDS,
    fragmentName: 'FullArrowFields',
  }) as Arrow;

  const color = useAppSelector(selectColor(true));

  const [isVoting, setIsVoting] = useState(false);

  let userVote = null as Vote | null;
  (arrow.votes || []).some(vote => {
    if (vote.userId === props.user?.id) {
      userVote = vote;
      return true;
    }
    return false;
  });


  const handleVoteClick = (clicks: number) => (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsVoting(true);
  }
  const handleButtonMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      paddingTop: '10px',
      marginLeft: '2px',
      marginRight: '-5px',
    }}>
      <IconButton
        disabled={isVoting}
        size='small' 
        onMouseDown={handleButtonMouseDown}
        onClick={handleVoteClick(
          userVote && userVote.weight === 1 
            ? 0
            : 1
        )}
        sx={{
          color: (userVote?.weight || 0) > 0
            ? props.user?.color
            : color,
        }}
      >
        { 
          (userVote?.weight || 0) > 0
            ? <KeyboardDoubleArrowUpIcon fontSize='inherit' />
            : <KeyboardArrowUpIcon fontSize='inherit' />
        }
      </IconButton>
      <Button
        disabled={isVoting}
        onMouseDown={handleButtonMouseDown}
        color='inherit'
        size='small'
        sx={{
          minWidth: 0,
          color,
          fontSize: 14,
        }}
      >
        &nbsp;{ arrow?.weight || 0 }&nbsp;
      </Button>
      <IconButton
        onMouseDown={handleButtonMouseDown}
        disabled={isVoting}
        size='small' 
        onClick={handleVoteClick(
          userVote && userVote.weight === -1
            ? 0
            : -1
        )}
        sx={{
          color: (userVote?.weight || 0) < 0
            ? props.user?.color
            : color,
        }}
      >
        {
          (userVote?.weight || 0) < 0
            ? <KeyboardDoubleArrowDownIcon fontSize='inherit' />
            : <KeyboardArrowDownIcon fontSize='inherit' />
        }
      </IconButton>
    </Box>
  )
}
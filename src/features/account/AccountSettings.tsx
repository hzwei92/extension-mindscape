

import { gql, useLazyQuery, useMutation, useReactiveVar } from '@apollo/client';
import { Box, Card, FormControl, FormHelperText, IconButton, InputAdornment, OutlinedInput, Typography } from '@mui/material';
import React, { useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import type { User } from '../user/user';
import { useSnackbar } from 'notistack';
// import { selectSessionId } from '../auth/authSlice';

const SET_USER_NAME = gql`
  mutation SetUserName($sessionId: String!, $name: String!) {
    setUserName(sessionId: $sessionId, name: $name) {
      id
      name
      lowercaseName
      routeName
    }
  }
`;

const GET_USER_BY_NAME = gql`
  query GetUserByName($name: String!) {
    getUserByName(name: $name) {
      id
      name
    }
  }
`;

interface UserSettingsProps {
  user: User;
}

export default function UserSettings(props: UserSettingsProps) {

  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(props.user.name || '');
  const [nameError, setNameError] = useState('');
  const [nameTimeout, setNameTimeout] = useState(null as ReturnType<typeof setTimeout> | null);

  const { enqueueSnackbar } = useSnackbar();
   
  const [getUserByName] = useLazyQuery(GET_USER_BY_NAME, {
    onError: error => {
      console.error(error);
    },
    onCompleted: data => {
      console.log(data);
      if (data.getUserByName?.id && data.getUserByName.id !== props.user.id) {
        setNameError('This name is already in use');
      }
    }
  });

  const [setUserName] = useMutation(SET_USER_NAME, {
    onError: error => {
      console.error(error);

      enqueueSnackbar(error.message);
    },
    onCompleted: data => {
      console.log(data);
    }
  })

  const handleNameEditClick = (event: React.MouseEvent) => {
    setIsEditingName(true);
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    setNameError('');
    if (nameTimeout) {
      clearTimeout(nameTimeout);
    }
    const timeout = setTimeout(() => {
      getUserByName({
        variables: {
          name: event.target.value,
        },
      });
    }, 300);
    setNameTimeout(timeout);
  };

  const handleNameSubmitClick = (event: React.MouseEvent) => {
    setUserName({
      variables: {
        name,
        // sessionId,
      }
    })
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
  }

  return (
    <Card elevation={5} sx={{
      padding: 1,
      margin: 1,
    }}>
      <Typography variant='overline'>
        Name
      </Typography>
      <Box sx={{
        marginTop: '5px',
      }}>
        <Box sx={{
          display: isEditingName ? 'none' : 'block',
          paddingLeft: 1,
          paddingBottom: 1,
        }}>
          { props.user.name }&nbsp;
          <Box sx={{position: 'relative', display:'inline-block'}}>
            <Box sx={{position: 'absolute', left: 0, top: -20}}>
            <IconButton title='Edit username' onClick={handleNameEditClick} size='small' sx={{
              fontSize: 16,
            }}>
              <EditIcon fontSize='inherit' />
            </IconButton>
            </Box>
          </Box>
        </Box>
        <Box sx={{
          display: isEditingName ? 'block' : 'none',
          width: '100%',
          marginTop: '5px',
        }}>
          <FormControl sx={{
            width: '100%', 
          }}>
            <OutlinedInput
              id='user-name'
              type='text'
              value={name}
              onChange={handleNameChange}
              error={!!nameError}
              endAdornment={
                <InputAdornment position='end'>
                  <IconButton
                    title='Submit'
                    disabled={!name.length || !!nameError}
                    edge='end'
                    onClick={handleNameSubmitClick}
                    onMouseDown={handleMouseDown}
                    sx={{
                      fontSize: 16,
                    }}
                  >
                    <SendIcon fontSize='inherit'/>
                  </IconButton>
                </InputAdornment>
              }
              sx={{
                marginLeft: 1,
                marginRight: 1,
              }}
            />
            <FormHelperText error={true}>{nameError}</FormHelperText>
          </FormControl>
        </Box>
      </Box>
    </Card>
  )
}
import { gql, useLazyQuery, useMutation } from '@apollo/client';
import { Box, Button, Card, FormControl, IconButton, InputAdornment, InputLabel, OutlinedInput, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';
import { EMAIL_REGEX } from '~constants';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GoogleButton from './GoogleButton';
import { USER_FIELDS } from '../user/userFragments';
import { useAppDispatch } from '~store';
import { SpaceType } from '~features/space/space';
import { addUsers } from '~features/user/userSlice';

const GET_USER_BY_EMAIL = gql`
  query GetUserByEmail($email: String!) {
    getUserByEmail(email: $email) {
      email
    }
  }
`;

const REGISTER_USER = gql`
  mutation RegisterUser($email: String!, $pass: String!) {
    registerUser(email: $email, pass: $pass) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

interface RegisterProps {
}
export default function Register(props: RegisterProps) {
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailTimeout, setEmailTimeout] = useState(null as any);

  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [message, setMessage] = useState('');

  const [getUserByEmail] = useLazyQuery(GET_USER_BY_EMAIL, {
    onCompleted: data => {
      console.log(data);
      setEmailError(data.getUserByEmail ? 'Email is already in use' : '');
    }
  });

  const [registerUser] = useMutation(REGISTER_USER, {
    onError: error => {
      setMessage(error.message);
    },
    onCompleted: data => {
      console.log(data);
      dispatch(addUsers({
        space: SpaceType.FRAME,
        users: [data.registerUser],
      }))
    }
  })

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    setMessage('');
    if (event.target.value.length === 0) {
      setEmailError('');
    }
    else  if (EMAIL_REGEX.test(event.target.value.toLowerCase())) {
      if (emailTimeout) {
        clearTimeout(emailTimeout);
      }
      const t = setTimeout(() => {
        getUserByEmail({
          variables: {
            email: event.target.value.toLowerCase(),
          }
        });
        setEmailTimeout(null);
      }, 500);

      setEmailTimeout(t); 
      setEmailError('');
    }
    else {
      setEmailError('Please enter a valid email')
    }
  };

  const handlePassChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPass(event.target.value);
    setMessage('')
  };

  const handleClickShowPass = () => {
    setShowPass(!showPass);
  };

  const handleMouseDownPass = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleSubmit = (event: React.MouseEvent) => {
    setMessage('')
    registerUser({
      variables: {
        email,
        pass,
        isGoogle: false,
      }
    });
  };

  const isFormValid = email.length && !emailError && pass.length;

  return (
      <Card elevation={5} sx={{
        padding: 1,
        paddingLeft: 2,
        paddingRight: 2,
        margin: 1,
      }}>
        <Typography variant='overline' sx={{
          marginLeft: -1,
        }}>
          Email
        </Typography>
          
        <FormControl margin='dense' sx={{ width: '100%'}}>
          <TextField
            label='Email'
            error={!!emailError}
            type='text'
            value={email}
            onChange={handleEmailChange}
            helperText={emailError}
            variant={'outlined'}
          />
        </FormControl>
        <FormControl margin='dense' variant='outlined' sx={{width: '100%'}}>
          <InputLabel htmlFor='pass'>Password</InputLabel>
          <OutlinedInput
            id='pass'
            type={showPass ? 'text' : 'password'}
            value={pass}
            onChange={handlePassChange}
            label='Password'
            endAdornment={
              <InputAdornment position='end'>
                <IconButton
                  edge='end'
                  tabIndex={-1}
                  onClick={handleClickShowPass}
                  onMouseDown={handleMouseDownPass}
                  sx={{
                    fontSize: 16,
                  }}
                >
                  {showPass 
                    ? <VisibilityIcon fontSize='inherit'/> 
                    : <VisibilityOffIcon fontSize='inherit'/>
                  }
                  </IconButton>
              </InputAdornment>
            }
          />
        </FormControl>
        <Box sx={{margin: 1}}>
          {message}
        </Box>
        <Button
          disabled={!isFormValid}
          variant='contained' 
          onClick={handleSubmit} 
          sx={{width: '100%', marginTop:1}}
        >
          register with email
        </Button>
        <Box sx={{
          marginTop:1,
          paddingTop:1,
          borderTop: '1px solid dimgrey',
        }}>
          <GoogleButton isRegistration={true}/>
        </Box>
      </Card>
  );
}
import { Box, Button } from '@mui/material';
import { gql, useApolloClient, useMutation } from '@apollo/client';
import { useState } from 'react';
import { FULL_USER_FIELDS, USER_FIELDS } from '../user/userFragments';
import { useAppDispatch } from '~store';
import { SpaceType } from '../space/space';
import { addUsers, setCurrentUser } from '../user/userSlice';
import { resetSpace } from '~features/space/spaceSlice';

const REGISTER_USER = gql`
  mutation RegisterGoogleUser($token: String!) {
    registerGoogleUser(token: $token) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

const LOGIN_USER = gql`
  mutation LoginGoogleUser($token: String!) {
    loginGoogleUser(token: $token) {
      ...FullUserFields
    }
  }
  ${FULL_USER_FIELDS}
`;

interface GoogleButtonProps {
  isRegistration: boolean;
  onCompleted?: any;
}
export default function GoogleButton(props: GoogleButtonProps) {
  const client = useApolloClient();
  const dispatch = useAppDispatch();

  const [message, setMessage] = useState('');

  const [registerGoogleUser] = useMutation(REGISTER_USER, {
    onError: error => {
      console.error(error);
      setMessage(error.message);
    },
    onCompleted: data => {
      console.log(data);
      dispatch(addUsers({
        space: SpaceType.FRAME,
        users: [data.GoogleUser],
      }));
      props.onCompleted && props.onCompleted();
    },
  });

  const [loginGoogleUser] = useMutation(LOGIN_USER, {
    onError: error => {
      console.error(error);
      setMessage(error.message);
    },
    onCompleted: data => {
      console.log(data);
      
      resetSpace(SpaceType.FRAME);
      resetSpace(SpaceType.FOCUS);

      client.clearStore();
      client.writeQuery({
        query: gql`
          query LoginQuery {
            ...FullUserFields
          }
        `,
        data: data.loginUser,
      });

      dispatch(setCurrentUser(data.loginGoogleUser));

      props.onCompleted && props.onCompleted();
    },
  });

  const handleClick = () => {
    chrome.identity.getProfileUserInfo({
      accountStatus: chrome.identity.AccountStatus.ANY,
    }, userInfo => {
      if (userInfo.email && userInfo.id) {
        chrome.identity.getAuthToken({
          interactive: true,
        }, token => {
          console.log(token);
          if (props.isRegistration) {
            registerGoogleUser({
              variables: {
                token, 
              },
            });
          }
          else {
            loginGoogleUser({
              variables: {
                token,
              },
            });
          }
        })
      }
    })
  }

  return (
    <Box>
      <Button 
        sx={{width: '100%'}}
        variant='contained' 
        onClick={handleClick}
      >
        {props.isRegistration ? 'register with google' : 'login with google'}
      </Button>
    <Box/>
    <Box sx={{
      margin: 1,
    }}>
      { message } 
    </Box>   
    </Box>
  );
}
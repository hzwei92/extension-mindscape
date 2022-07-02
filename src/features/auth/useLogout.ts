import { gql, useApolloClient, useMutation } from '@apollo/client';
import { useContext } from 'react';
import { MessageName } from '~constants';
import { setAuthIsDone, setLogout, setTokenIsValid } from '~features/auth/authSlice';
import { resetSpace } from '~features/space/spaceSlice';
import { setCurrentUser } from '~features/user/userSlice';
import { getClient } from '~graphql';
import { AppContext } from '~newtab/App';
import { persistor, useAppDispatch } from '~store';
import { SpaceType } from '../space/space';

const LOGOUT_USER = gql`
  mutation LogoutUser {
    logoutUser {
      id
    }
  }
`;

export default function useLogout() {
  const client = useApolloClient();
  const dispatch = useAppDispatch();

  const { cachePersistor } = useContext(AppContext);

  const [logout] = useMutation(LOGOUT_USER, {
    onError: error => {
      console.error(error);
    },
    onCompleted: data => {
      console.log(data);
    }
  });

  const logoutUser = async () => {
    console.log('hihi')
    logout();
    await client.clearStore();
    await cachePersistor.persist();
    resetSpace(SpaceType.FRAME);
    resetSpace(SpaceType.FOCUS);
    dispatch(setLogout(null));
    dispatch(setCurrentUser(null));
    console.log('hello')
  }

  return { logoutUser };
}
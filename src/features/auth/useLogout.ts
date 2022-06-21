import { gql, useApolloClient, useMutation } from '@apollo/client';
import { useContext } from 'react';
import { MessageName } from '~constants';
import { setAuthIsDone, setTokenIsValid } from '~features/auth/authSlice';
import { resetSpace } from '~features/space/spaceSlice';
import { getClient } from '~graphql';
import { AppContext } from '~newtab/App';
import { useAppDispatch } from '~store';
import { SpaceType } from '../space/space';
import { setUserId } from '../user/userSlice';

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
    logout();
    await client.clearStore();
    await cachePersistor.persist();
    dispatch(setUserId(''));
    resetSpace(SpaceType.FRAME);
    resetSpace(SpaceType.FOCUS);
    dispatch(setTokenIsValid(false));
    dispatch(setAuthIsDone(false));
  }

  return { logoutUser };
}
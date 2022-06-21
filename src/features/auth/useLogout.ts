import { gql, useApolloClient, useMutation } from '@apollo/client';
import { setAuthIsDone, setTokenIsValid } from '~features/auth/authSlice';
import { resetSpace } from '~features/space/spaceSlice';
import { getClient } from '~graphql';
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
    const { persistor } = await getClient();
    persistor.purge();
    dispatch(setUserId(''));
    resetSpace(SpaceType.FRAME);
    resetSpace(SpaceType.FOCUS);
    dispatch(setTokenIsValid(false));
    dispatch(setAuthIsDone(false));
  }

  return { logoutUser };
}
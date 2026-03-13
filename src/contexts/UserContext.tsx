import { onAuthStateChanged, User } from "firebase/auth";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { IUserInfo, auth, firebaseApi } from "services";
import { ref, onValue, off, getDatabase } from "firebase/database";

interface UserContextProviderProps {
  children: any;
}

interface UserContextProps {
  user: IUserInfo | null;
  changeStatus: (status: string) => () => Promise<void>;
  setUserInfo: React.Dispatch<React.SetStateAction<IUserInfo[]>>;
}

const UserContext = createContext<UserContextProps>({
  user: null,
  changeStatus: () => async () => {},
  setUserInfo: () => {},
});

export const UserContextProvider: React.FC<UserContextProviderProps> = ({
  children,
}) => {
  const [userInfo, setUserInfo] = useState<IUserInfo[]>([]);
  const listenerRef = useRef<(() => void) | null>(null);

  const changeStatus = (status: string) => async () => {
    await firebaseApi.POST.update.status(
      status,
      auth.currentUser?.displayName || "Anonymous User"
    );
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user: User | null) => {
      // Detach any previous DB listener before attaching a new one
      if (listenerRef.current) {
        listenerRef.current();
        listenerRef.current = null;
      }

      if (!user) {
        setUserInfo([]);
        return;
      }

      // Attach a live listener to the user node
      const db = getDatabase();
      const userRef = ref(db, `users/${user.uid}`);
      const unsubscribeDb = onValue(userRef, (snapshot) => {
        if (!snapshot.val()) return;
        const data: IUserInfo = snapshot.val();
        setUserInfo([data]);
      });

      // Store the unsubscribe fn so we can clean up on auth change
      listenerRef.current = unsubscribeDb;
    });

    return () => {
      unsubscribeAuth();
      if (listenerRef.current) listenerRef.current();
    };
  }, []);

  return (
    <UserContext.Provider
      value={{ setUserInfo, changeStatus, user: userInfo[0] ?? null }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

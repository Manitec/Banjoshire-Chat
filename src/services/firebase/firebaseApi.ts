import { FirebaseError } from "firebase/app";
import { banner_ai, defaultUser } from "assets";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as _signOut,
  updateProfile,
  User,
  UserCredential,
} from "firebase/auth";
import {
  child,
  get,
  getDatabase,
  off,
  onChildAdded,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
} from "firebase/database";
import React, { Dispatch } from "react";
import { auth } from "./firebaseInit";
import {
  TError,
  IEmailAndPasswordSignIn,
  GetAllRoomsResponse,
  IMessage,
  IRoom,
  GetRoomResponse,
  IUserInfo,
  INotifications,
} from "./types";
import { Statuses } from "types";
import { EmojiClickData } from "emoji-picker-react/dist/types/exposedTypes";
import { IEmoji, IEmojiInfo } from "collections";

const provider = new GoogleAuthProvider();

interface ErrorResponse {
  type: "error";
  error: FirebaseError;
}

interface DataResponse<T = UserCredential> {
  type: "data";
  response: T;
}

const db = getDatabase();
const dbRef = ref(db);

const listenForNewMessages = async (room: string) => {
  const roomRef = ref(db, `messages/${room}`);
  onChildAdded(roomRef, (child) => {
    const message: IMessage = child.val();
  });
};

const addLastMessagesSeen = async (room: string) => {
  const userRef = ref(db, `users/${auth.currentUser?.uid}/rooms/${room}`);
  if (room === "") return;
  update(userRef, {
    lastSeen: Date.now(),
  });
};

const getUnreadMessages = async (
  room: string,
  setter: React.Dispatch<React.SetStateAction<INotifications>>,
  userLastSeen: number
) => {
  const roomMessagesRef = ref(db, `messages/${room}`);
  const unsubscribe = onValue(roomMessagesRef, (msgs) => {
    if (!msgs.val()) {
      setter({});
    } else {
      const data: IMessage[] = Object.values(msgs.val());
      const result = Object.values(data);
      const newMessages = result
        .filter((msg) => msg.timePosted > userLastSeen)
        .filter((msg) => msg.author !== auth.currentUser?.displayName);
      if (msgs.key === room) {
        setter((oldState) => ({ ...oldState, [room]: newMessages.length }));
      }
    }
  });
  return unsubscribe;
};

const changeStatus = async (status: string, username: string) => {
  const usersPathRef = ref(db, `users/${auth.currentUser?.uid}`);
  update(usersPathRef, { status });
};

const changeUserAvatar = async (avatar: string) => {
  const usersPathRef = ref(db, `users/${auth.currentUser?.uid}`);
  update(usersPathRef, { profileImg: avatar });
};

const changeUserBanner = async (banner: string) => {
  const usersPathRef = ref(db, `users/${auth.currentUser?.uid}`);
  update(usersPathRef, { banner });
};

const getUserStatus = async (
  setter: React.Dispatch<React.SetStateAction<Statuses>>
) => {
  const statusRef = ref(db, `users/${auth.currentUser?.uid}`);
  onValue(statusRef, (snapshot) => {
    if (!snapshot.val()) {
      setter("online");
    } else {
      setter(snapshot.val().status || "online");
    }
  });
};

const getUserInfo = async (
  uid: string,
  setter: React.Dispatch<React.SetStateAction<IUserInfo[]>>
) => {
  const userRef = ref(db, `users/${uid}`);
  onValue(userRef, (info) => {
    if (!info.val()) return;
    const userInfo = info.val();
    setter((prevState) => {
      const removedOldInfo = prevState.filter((el) => el.uid !== uid);
      return [...removedOldInfo, userInfo];
    });
  });
};

const joinRoom = async (roomName: string) => {
  const roomMembersRef = ref(db, `rooms/${roomName}/members`);
  const newMember = push(roomMembersRef);
  await set(newMember, { user: auth.currentUser?.uid });
  await sendMessage(
    roomName,
    `${auth.currentUser?.displayName} just joined ${roomName}`,
    true
  );
};

const createRoom = async (
  roomName: string,
  icon: string
): Promise<void | ErrorResponse> => {
  try {
    const doesExist = (await get(child(dbRef, `rooms/${roomName}`))).exists();
    if (doesExist) throw Error("Room already exists!");
    await set(ref(db, "rooms/" + roomName), {
      name: roomName,
      icon,
      members: { member: "" },
    });
    await joinRoom(roomName);
  } catch (error: any) {
    const FirbaseError: TError = error;
    return { type: "error", error: FirbaseError };
  }
};

const sendMessage = async (
  roomName: string,
  message: string,
  greeting = false
): Promise<void | ErrorResponse> => {
  try {
    const roomRef = ref(db, `messages/${roomName}`);
    const newMessage = push(roomRef);
    await set(newMessage, {
      key: newMessage.key,
      author: auth.currentUser?.displayName || "Unknown User",
      uid: auth.currentUser?.uid,
      message,
      profileImg: auth.currentUser?.photoURL || defaultUser.src,
      edited: false,
      timePosted: Date.now(),
      greeting,
      emojis: [],
    });
  } catch (error: any) {
    const FirebaseError: TError = error;
    return { type: "error", error: FirebaseError };
  }
};

const getMessages = async (
  roomName: string,
  setter: React.Dispatch<React.SetStateAction<IMessage[]>>
) => {
  const roomMessagesRef = ref(db, `messages/${roomName}`);
  onValue(roomMessagesRef, (msgs) => {
    if (!msgs.val()) {
      setter([]);
    } else {
      const data = Object.values(msgs.val()) as any;
      if (msgs.key === roomName) {
        setter(Object.values(data));
      } else {
        setter(Object.values(data[0]));
      }
    }
  });
};

const getAllRooms = async (
  setter: React.Dispatch<React.SetStateAction<IRoom[]>>
) => {
  const roomsRef = ref(db, "rooms/");
  onValue(roomsRef, (rooms) => {
    if (!rooms.val()) return;
    const result: GetAllRoomsResponse = rooms.val();
    setter(
      Object.values(result).map((room) => ({
        name: room.name,
        icon: room.icon,
        members: room.members,
      }))
    );
  });
};

const getRoom = async (
  room: string,
  setter: React.Dispatch<React.SetStateAction<string[]>>
) => {
  const roomRef = ref(db, `rooms/${room}/members`);
  onValue(roomRef, (room) => {
    if (!room.val()) return;
    const result: GetRoomResponse = room.val();
    const data = Object.values(result).map((user) => user.user);
    setter(data.filter((el) => el !== undefined));
  });
};

const createUserWithPassword = async (
  e: React.FormEvent,
  { email, password, username }: IEmailAndPasswordSignIn
): Promise<ErrorResponse | DataResponse> => {
  e.preventDefault();
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await setAdditionUserInfo(username || "Anonymous User");
    await changeStatus("online", username || "Anonymous User");
    return { type: "data", response: res };
  } catch (error: any) {
    const FirbaseError: TError = error;
    return { type: "error", error: FirbaseError };
  }
};

const setAdditionUserInfo = async (username: string) => {
  if (!auth.currentUser) return;
  updateProfile(auth.currentUser, {
    displayName: username,
    photoURL: defaultUser.src,
  });
  const usersPathRef = ref(db, `users/${auth.currentUser?.uid}`);
  set(usersPathRef, {
    status: "online",
    banner: banner_ai,
    name: username,
    uid: auth.currentUser?.uid,
    memberSince: auth.currentUser?.metadata.creationTime,
    profileImg: auth.currentUser?.photoURL || defaultUser.src,
  });
};

const signInWithGoogle = async (): Promise<ErrorResponse | DataResponse> => {
  try {
    const res = await signInWithPopup(auth, provider);
    const uid = auth.currentUser?.uid;

    // Check if user already exists — preserve their existing status/data
    const existingSnap = await get(child(dbRef, `users/${uid}`));
    if (!existingSnap.exists()) {
      // First time Google sign-in — create the user record
      const usersPathRef = ref(db, `users/${uid}`);
      await set(usersPathRef, {
        status: "online",
        banner: banner_ai,
        name: auth.currentUser?.displayName,
        uid,
        memberSince: auth.currentUser?.metadata.creationTime,
        profileImg: auth.currentUser?.photoURL || defaultUser.src,
      });
    } else {
      // Returning user — only update status to online, preserve everything else
      const usersPathRef = ref(db, `users/${uid}`);
      await update(usersPathRef, { status: "online" });
    }

    return { type: "data", response: res };
  } catch (error: any) {
    const FirbaseError: TError = error;
    return { type: "error", error: FirbaseError };
  }
};

const signInWithPassword = async (
  e: React.FormEvent,
  { email, password }: IEmailAndPasswordSignIn
): Promise<ErrorResponse | DataResponse> => {
  e.preventDefault();
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    // Restore online status on sign-in
    if (auth.currentUser?.uid) {
      const usersPathRef = ref(db, `users/${auth.currentUser.uid}`);
      await update(usersPathRef, { status: "online" });
    }
    return { type: "data", response: res };
  } catch (error: any) {
    const FirbaseError: TError = error;
    return { type: "error", error: FirbaseError };
  }
};

const signOut = async (): Promise<ErrorResponse | DataResponse<void>> => {
  try {
    // Set offline before signing out
    if (auth.currentUser?.uid) {
      const usersPathRef = ref(db, `users/${auth.currentUser.uid}`);
      await update(usersPathRef, { status: "invisible" });
    }
    const res = await _signOut(auth);
    off(ref(db));
    return { type: "data", response: res };
  } catch (error: any) {
    const FirbaseError: TError = error;
    return { type: "error", error: FirbaseError };
  }
};

const editMessage = async (
  prevMessage: IMessage,
  room: string,
  newMessage: string
) => {
  const messageRef = ref(db, `messages/${room}/${prevMessage.key}`);
  update(messageRef, { message: newMessage, edited: true });
};

const deleteMessage = async (room: string, messageKey: string) => {
  const messageRef = ref(db, `messages/${room}/${messageKey}`);
  set(messageRef, null);
};

const addEmoji = async (
  message: IMessage,
  room: string,
  emoji: EmojiClickData
) => {
  const emojiesRef = ref(
    db,
    `messages/${room}/${message.key}/emojies/${emoji.unified}`
  );
  const emojiPath = `messages/${room}/${message.key}/emojies`;
  const emojiesValue = await get(child(ref(db), emojiPath));
  const newEmoji = push(emojiesRef);
  if (emojiesValue.val() === null) {
    await set(newEmoji, {
      icon: emoji.unified,
      from: auth.currentUser?.uid,
      key: newEmoji.key,
    });
    return;
  }
  const emojiType = emojiesValue.val()[emoji.unified] || false;
  if (emojiType) {
    const usersReacted: any[] = Object.values(emojiType);
    let alreadyReacted = false;
    usersReacted.map((emoji) => {
      if (emoji.from === auth.currentUser?.uid) alreadyReacted = true;
    });
    if (alreadyReacted) return "You have already reacted with this emoji!";
  }
  await set(newEmoji, {
    icon: emoji.unified,
    from: auth.currentUser?.uid,
    key: newEmoji.key,
  });
};

const reactWithEmoji = async (
  room: string,
  messageKey: string,
  emoji: string
) => {
  const emojiRef = ref(db, `messages/${room}/${messageKey}/emojies/${emoji}`);
  const newEmoji = push(emojiRef);
  set(newEmoji, {
    from: auth.currentUser?.uid,
    icon: emoji,
    key: newEmoji.key,
  });
};

const removeEmoji = async (
  room: string,
  message: IMessage,
  emoji: IEmojiInfo
) => {
  const emojiRef = ref(
    db,
    `messages/${room}/${message.key}/emojies/${emoji.icon}/${emoji.key}`
  );
  await remove(emojiRef);
};

const getEmojis = async (
  room: string,
  message: IMessage,
  setter: Dispatch<React.SetStateAction<IEmoji[]>>
) => {
  const emojisRef = ref(db, `messages/${room}/${message.key}/emojies`);
  onValue(emojisRef, (emojis) => {
    if (!emojis.val()) {
      setter([]);
    } else {
      const EmojisArray: any = Object.entries(emojis.val());
      setter(
        EmojisArray.map((emoji: any) => {
          const key = emoji[0];
          const data = emoji[1];
          const structuredData = Object.values(data);
          return { emoji: structuredData };
        })
      );
    }
  });
};

export const firebaseApi = {
  POST: {
    signIn: {
      withPassword: signInWithPassword,
      withGoogle: signInWithGoogle,
    },
    signOut,
    signUp: {
      withPassword: createUserWithPassword,
    },
    room: {
      join: joinRoom,
      create: createRoom,
    },
    message: {
      send: sendMessage,
      edit: editMessage,
      lastSeen: addLastMessagesSeen,
    },
    update: {
      status: changeStatus,
      avatar: changeUserAvatar,
      banner: changeUserBanner,
    },
    emoji: {
      add: addEmoji,
      react: reactWithEmoji,
    },
  },
  GET: {
    allRooms: getAllRooms,
    messages: getMessages,
    unreadMessages: getUnreadMessages,
    user: {
      status: getUserStatus,
      info: getUserInfo,
    },
    emojis: getEmojis,
    room: getRoom,
    notifiction: listenForNewMessages,
  },
  DELETE: {
    emoji: removeEmoji,
    message: deleteMessage,
  },
};

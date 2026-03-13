import { useRouter } from "next/router";
import React, { RefObject, useEffect, useRef, useState } from "react";
import { firebaseApi, INotifications, IRoom } from "services";
import { CurrentUserProfile, icons } from "collections";
import { Explore, RoomUnreadMessages } from "components";
import { useUser } from "contexts";
import { hasUserJoined } from "utils";
import { Unsubscribe } from "firebase/auth";

interface SidebarProps {
  sidebarOpened: boolean;
  setSidebarOpened: React.Dispatch<React.SetStateAction<boolean>>;
  ref?: RefObject<HTMLDivElement>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpened,
  setSidebarOpened,
  ...props
}) => {
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [newMessages, setNewMessage] = useState<INotifications>({});
  const router = useRouter();
  const { user } = useUser();
  // No idea how it works but it does
  // It removes the old onValue listeners correctly
  const unsubscribe = useRef<Unsubscribe | any>(() => {});

  const slug = router.query.slug ? router.query.slug[0] : "";

  useEffect(() => {
    firebaseApi.GET.allRooms(setRooms);
  }, []);

  useEffect(() => {
    if (rooms.length === 0) return;
    if (!user) return;
    const userRooms = user.rooms;
    if (!userRooms) return;
    Object.keys(userRooms).forEach((room) => {
      const unsubscribeFromLastListener = firebaseApi.GET.unreadMessages(
        room,
        setNewMessage,
        userRooms[room].lastSeen
      );
      // No idea how it works but it does
      // It removes the old onValue listeners correctly
      unsubscribe.current = unsubscribeFromLastListener;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, user?.rooms, rooms]);

  const handleGoToRoom = (path: string) => () => {
    if (router.pathname === "/chats") {
      router.push(`chats/${path}`);
    } else {
      router.push(path);
    }
  };

  return (
    <>
      <div
        className={sidebarOpened ? "popup-background" : "hidden"}
        onClick={() => setSidebarOpened(false)}
      />
      <div
        className={
          sidebarOpened ? "sidebar-container" : "sidebar-container-closed"
        }
        {...props}
      >
        <div className="flex w-full flex-col justify-between pl-[15px] overflow-auto">
          <div className="flex flex-col">
            {rooms.map((room, i) => {
              const Icon = icons[room.icon];
              const userJoined = hasUserJoined(room, user?.uid || "!user id!");
              return (
                userJoined && (
                  <div
                    key={i}
                    className={
                      slug === room.name
                        ? "active-room room-img-tail"
                        : "sidebar-room room-img-tail"
                    }
                    onClick={() => {
                      handleGoToRoom(room.name)();
                      firebaseApi.POST.message.lastSeen(slug);
                      firebaseApi.POST.message.lastSeen(room.name);
                    }}
                  >
                    <Icon size={25} fill="black" />
                    {newMessages[room.name] > 0 && (
                      <RoomUnreadMessages>
                        {newMessages[room.name]}
                      </RoomUnreadMessages>
                    )}
                  </div>
                )
              );
            })}
            <Explore
              onClick={() => {
                firebaseApi.POST.message.lastSeen(slug);
              }}
            />
          </div>
        </div>
        <CurrentUserProfile />
      </div>
    </>
  );
};

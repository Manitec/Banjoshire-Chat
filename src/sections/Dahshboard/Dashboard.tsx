import { icons } from "collections";
import { Popup } from "components";
import { useUser } from "contexts";
import { useRouter } from "next/router";
import React, { RefObject, useEffect, useState } from "react";
import { firebaseApi, IRoom, togglePopup } from "services";
import { hasUserJoined } from "utils";
import { exploreBackground, stars } from "assets";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "hooks";
import { BiSearch, BiLock } from "react-icons/bi";
import TierGate from "components/TierGate";
import PrivateRoomModal from "components/PrivateRoomModal";

interface DashboardProps {
  ref?: RefObject<HTMLDivElement>;
}

export const Dashboard: React.FC<DashboardProps> = ({ ...props }) => {
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [search, setSearch] = useState("");
  const [privateRoomTarget, setPrivateRoomTarget] = useState<IRoom | null>(null);

  const router = useRouter();
  const { user } = useUser();
  const dispatch = useAppDispatch();
  const { popupOpened } = useAppSelector((state) => state.counter);

  useEffect(() => {
    firebaseApi.GET.allRooms(setRooms);
  }, []);

  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleGoToRoom = (room: IRoom, userJoined: boolean) => () => {
    if (room.private && !userJoined) {
      setPrivateRoomTarget(room);
      return;
    }
    if (!userJoined) firebaseApi.POST.room.join(room.name);
    if (router.pathname === "/chats") {
      router.push(`chats/${room.name}`);
    } else {
      router.push(room.name);
    }
  };

  return (
    <>
      {popupOpened && (
        <div className="fixed z-[90] left-0 w-full">
          <Popup
            closePopup={() => dispatch(togglePopup("null"))}
            popupType={popupOpened || "null"}
          />
        </div>
      )}
      {privateRoomTarget && (
        <PrivateRoomModal
          room={privateRoomTarget}
          onClose={() => setPrivateRoomTarget(null)}
          onSuccess={() => {
            firebaseApi.POST.room.join(privateRoomTarget.name);
            router.push(`chats/${privateRoomTarget.name}`);
            setPrivateRoomTarget(null);
          }}
        />
      )}
      <section className="dashboard" {...props}>
        <div className="w-full h-[40vw] top-0 max-h-[400px] flex items-center justify-center flex-col">
          <h1 className="dashboard-greeting z-[10]">Explore Rooms</h1>
          <span className="z-[10] my-[10px] text-white md:my-[20px] md:text-[20px]">Or</span>
          <div className="flex gap-3 z-[10]">
            <button
              onClick={() => dispatch(togglePopup("createRoom"))}
              className="create-room-button"
              type="button"
            >
              Create A Room
            </button>
            <TierGate requiredTier="pro" inline>
              <button
                onClick={() => dispatch(togglePopup("createPrivateRoom"))}
                className="create-room-button flex items-center gap-1"
                type="button"
              >
                <BiLock size={16} /> Private Room
              </button>
            </TierGate>
          </div>
          <Image className="pointer-events-none" src={exploreBackground} alt="explore-background" fill style={{ objectFit: "cover" }} />
          <Image className="pointer-events-none absolute left-10 top-10 animate-starsLeft" src={stars} alt="stars-background" />
          <Image className="pointer-events-none absolute left-[-100px] top-[40%] animate-starsLeft" src={stars} alt="stars-background" />
          <Image className="pointer-events-none absolute bottom-0 right-0 animate-starsRight" src={stars} alt="stars-background" />
          <Image className="pointer-events-none absolute bottom-[40%] right-[-200px] animate-starsRight" src={stars} alt="stars-background" />
        </div>
        <div className="dashboard-info">
          <h3 className="dashboard-greeting-info">Click on a room to join the conversation!</h3>
          <div className="flex items-center bg-slate-700/50 rounded-lg px-3 py-2 mb-4 max-w-[400px] mx-auto">
            <BiSearch size={18} className="text-white/50 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-white placeholder-white/40 outline-none w-full text-[15px]"
            />
          </div>
          <div className="dashboard-rooms-container">
            {filteredRooms.length === 0 && search && (
              <p className="text-white/50 text-sm mt-4">No rooms match &ldquo;{search}&rdquo;</p>
            )}
            {filteredRooms.map((room, i) => {
              const Icon = icons[room.icon];
              const userHasJoined = hasUserJoined(room, user?.uid || "!user!");
              return (
                <div
                  key={i}
                  className="dashboard-room relative"
                  onClick={handleGoToRoom(room, userHasJoined)}
                >
                  <Icon size={20} />
                  {room.private && <BiLock size={11} className="absolute top-1 right-1 text-yellow-400" />}
                  <div className="dashboard-room-tooltip">{room.name}{room.private ? " 🔒" : ""}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

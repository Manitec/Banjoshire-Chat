import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useUser } from "contexts";
import { auth } from "services/firebase";
import { ref, onValue, push, set, getDatabase } from "firebase/database";
import { IoSend } from "react-icons/io5";
import TierGate from "components/TierGate";
import Link from "next/link";
import { BiArrowBack } from "react-icons/bi";

interface DmMessage {
  key: string;
  author: string;
  uid: string;
  message: string;
  profileImg: string;
  timePosted: number;
}

function getDmRoomId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("_");
}

export default function DirectMessage() {
  const router = useRouter();
  const { uid } = router.query as { uid: string };
  const { user } = useUser();
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [input, setInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const db = getDatabase();

  const scrollToBottom = () => {
    const height = chatRef.current?.scrollHeight || 0;
    chatRef.current?.scroll(0, height);
  };

  useEffect(() => {
    if (!uid) return;
    const userRef = ref(db, `users/${uid}`);
    const unsub = onValue(userRef, (snap) => {
      if (snap.val()) setOtherUser(snap.val());
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  useEffect(() => {
    if (!uid || !user?.uid) return;
    const roomId = getDmRoomId(user.uid, uid);
    const msgsRef = ref(db, `dm/${roomId}`);
    const unsub = onValue(msgsRef, (snap) => {
      if (!snap.val()) { setMessages([]); return; }
      const sorted = (Object.values(snap.val()) as DmMessage[]).sort(
        (a, b) => a.timePosted - b.timePosted
      );
      setMessages(sorted);
      setTimeout(scrollToBottom, 50);
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, user?.uid]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user?.uid || !uid) return;
    const roomId = getDmRoomId(user.uid, uid);
    const msgsRef = ref(db, `dm/${roomId}`);
    const newMsg = push(msgsRef);
    await set(newMsg, {
      key: newMsg.key,
      author: user.name || auth.currentUser?.displayName || "Unknown",
      uid: user.uid,
      message: input.trim(),
      profileImg: user.profileImg || "",
      timePosted: Date.now(),
    });
    setInput("");
    setTimeout(scrollToBottom, 50);
  };

  return (
    <TierGate requiredTier="pro">
      {/* h-[100vh] not h-full — <main> has no height so h-full collapses */}
      <div className="flex flex-col h-[100vh] bg-darkGrey/95 overflow-hidden">

        {/* Nav — absolute like all other pages, sits on top */}
        <nav className="navigation flex items-center gap-3">
          <Link href="/chats" className="text-white/60 hover:text-white transition">
            <BiArrowBack size={22} />
          </Link>
          {otherUser?.profileImg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={otherUser.profileImg}
              width={32}
              height={32}
              className="rounded-full w-[32px] h-[32px] object-cover shrink-0"
              alt=""
            />
          )}
          <h1 className="text-white text-[18px] font-semibold">
            {otherUser?.name || "Direct Message"}
          </h1>
        </nav>

        {/* Scrollable messages */}
        <div ref={chatRef} className="overflow-auto h-full pt-[90px]">
          <div className="flex flex-col gap-1 px-4 pb-4">
            {messages.length === 0 && (
              <p className="text-white/30 text-sm text-center mt-6">No messages yet. Say hello! 👋</p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.key}
                className={`flex items-end gap-2 ${
                  msg.uid === user?.uid ? "flex-row-reverse" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={msg.profileImg || "/default-user.png"}
                  className="rounded-full w-[28px] h-[28px] object-cover shrink-0 mb-1"
                  alt=""
                />
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm break-words ${
                    msg.uid === user?.uid
                      ? "bg-indigo-600 rounded-br-none"
                      : "bg-slate-700 rounded-bl-none"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input bar */}
        <div className="w-[-webkit-fill-available] flex md:pl-[10px] mx-[10px] mb-[5px]">
          <form onSubmit={sendMessage} className="w-full flex items-center gap-2">
            <input
              className="messenger flex-1"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${otherUser?.name || "..."}`}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition p-2 rounded-xl shrink-0"
            >
              <IoSend size={18} className="text-white" />
            </button>
          </form>
        </div>

      </div>
    </TierGate>
  );
}

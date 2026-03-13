import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useUser } from "contexts";
import { auth } from "services/firebase";
import { ref, onValue, push, set, getDatabase } from "firebase/database";
import { BiHash, BiArrowBack } from "react-icons/bi";
import { IoSend } from "react-icons/io5";
import TierGate from "components/TierGate";
import Link from "next/link";

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const db = getDatabase();

  useEffect(() => {
    if (!uid) return;
    const userRef = ref(db, `users/${uid}`);
    const unsub = onValue(userRef, (snap) => {
      if (snap.val()) setOtherUser(snap.val());
    });
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    if (!uid || !user?.uid) return;
    const roomId = getDmRoomId(user.uid, uid);
    const msgsRef = ref(db, `dm/${roomId}`);
    const unsub = onValue(msgsRef, (snap) => {
      if (!snap.val()) { setMessages([]); return; }
      setMessages(Object.values(snap.val()) as DmMessage[]);
    });
    return () => unsub();
  }, [uid, user?.uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
  };

  return (
    <TierGate requiredTier="pro">
      <div className="flex flex-col h-[100vh] bg-[#1a1c2e] text-white">
        {/* Header */}
        <nav className="navigation flex items-center gap-3">
          <Link href="/chats" className="text-white/60 hover:text-white transition">
            <BiArrowBack size={22} />
          </Link>
          {otherUser?.profileImg && (
            <img src={otherUser.profileImg} className="w-8 h-8 rounded-full" alt="avatar" />
          )}
          <h1 className="text-white text-[18px] font-semibold">
            {otherUser?.name || "Direct Message"}
          </h1>
        </nav>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {messages.length === 0 && (
            <p className="text-white/30 text-sm text-center mt-10">No messages yet. Say hello! 👋</p>
          )}
          {messages.map((msg) => (
            <div key={msg.key} className={`flex items-start gap-3 ${
              msg.uid === user?.uid ? "flex-row-reverse" : ""
            }`}>
              <img src={msg.profileImg} className="w-8 h-8 rounded-full shrink-0" alt="avatar" />
              <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                msg.uid === user?.uid
                  ? "bg-indigo-600 rounded-tr-none"
                  : "bg-slate-700 rounded-tl-none"
              }`}>
                {msg.message}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="flex items-center gap-3 px-4 py-3 border-t border-white/10">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${otherUser?.name || "..."}`}
            className="flex-1 bg-slate-700 rounded-xl px-4 py-2 text-white placeholder-white/40 outline-none text-[15px]"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition p-2 rounded-xl"
          >
            <IoSend size={18} />
          </button>
        </form>
      </div>
    </TierGate>
  );
}

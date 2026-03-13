import React, { useState } from "react";
import { IRoom } from "services";

interface Props {
  room: IRoom;
  onClose: () => void;
  onSuccess: () => void;
}

const PrivateRoomModal: React.FC<Props> = ({ room, onClose, onSuccess }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (password === room.password) {
      onSuccess();
    } else {
      setError("Incorrect password. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 bg-[#1e2030] rounded-xl p-6 w-[90%] max-w-[380px] shadow-2xl">
        <h2 className="text-white text-[20px] font-bold mb-1">🔒 Private Room</h2>
        <p className="text-white/50 text-sm mb-4">Enter the password to join <span className="text-white font-medium">{room.name}</span></p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Room password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-slate-700 text-white rounded-lg px-4 py-2 outline-none placeholder-white/40"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-slate-600 text-white/70 hover:bg-slate-500 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition disabled:opacity-50"
            >
              Join
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrivateRoomModal;

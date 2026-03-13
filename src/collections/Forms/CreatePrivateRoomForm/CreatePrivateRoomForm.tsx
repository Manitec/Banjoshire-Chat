import React, { useState } from "react";
import { firebaseApi } from "services";
import { icons } from "collections/Forms/CreateRoomForm/CreateRoomForm";
import { TPopups } from "components";
import { FaDiscourse } from "react-icons/fa";
import { BiLock } from "react-icons/bi";

interface CreatePrivateRoomFormProps {
  closePopup: (type?: TPopups) => () => void;
}

const CreatePrivateRoomForm: React.FC<CreatePrivateRoomFormProps> = ({ closePopup }) => {
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [icon, setIcon] = useState("SiBurton");
  const [iconsSelectorOpened, setIconsSelectorOpened] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const RoomIcon = icons[icon];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (roomName.length < 2) {
      setError("Room name must be at least 2 characters.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    const res = await firebaseApi.POST.room.createPrivate(roomName, icon, password);
    if (!res) {
      setRoomName("");
      setPassword("");
      setSuccess(true);
    } else {
      setError(res.error.message);
    }
  };

  return (
    <form
      className="form pt-[60px] md:max-w-[500px] md:pt-[20px]"
      onSubmit={handleSubmit}
    >
      <div className="form-demo-info">
        <FaDiscourse size={50} className="hidden md:block md:mb-[20px]" />
        <h1 className="text-[18px] mb-1 md:mb-6 text-center flex items-center gap-2 justify-center">
          <BiLock size={20} /> Create a Private Room
        </h1>
      </div>

      {/* Icon selector */}
      <div className="create-room-icon-container">
        <label className="form-label">Room Icon</label>
        <div className="create-room-icon">
          <RoomIcon size={35} fill="white" />
          <div
            onClick={() => setIconsSelectorOpened(!iconsSelectorOpened)}
            className="change-room-icon"
          >
            Change Icon
          </div>
        </div>
      </div>
      <div
        className={
          iconsSelectorOpened
            ? "room-icons-container"
            : "room-icons-container h-[0px] transition-all duration-1000 my-0"
        }
      >
        {Object.keys(icons).map((ic) => {
          const Icon = icons[ic];
          return (
            <div
              key={ic}
              onClick={() => { setIcon(ic); setIconsSelectorOpened(false); }}
              className="room-icon-choice"
            >
              <Icon size={35} />
            </div>
          );
        })}
      </div>

      {/* Room name */}
      <label className="form-label" htmlFor="privateRoomName">Room Name</label>
      <input
        id="privateRoomName"
        type="text"
        value={roomName}
        placeholder="Room Name..."
        className="input"
        onChange={(e) => setRoomName(e.target.value)}
      />

      {/* Password */}
      <label className="form-label mt-3" htmlFor="privateRoomPassword">Room Password</label>
      <input
        id="privateRoomPassword"
        type="password"
        value={password}
        placeholder="Password..."
        className="input"
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <span className="form-error">{error}</span>}
      {success && <span className="form-error text-green-500">Private Room Created! 🔒</span>}

      <button
        className="w-full p-2 py-[10px] border-2 rounded-[10px] bg-black/90 text-white mt-[10px]"
        type="submit"
      >
        Create Private Room
      </button>
    </form>
  );
};

export default CreatePrivateRoomForm;

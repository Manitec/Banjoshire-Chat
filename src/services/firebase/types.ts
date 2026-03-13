import { FirebaseError } from "firebase/app";

export type TError = FirebaseError | Error;

export interface IEmailAndPasswordSignIn {
  email: string;
  password: string;
  username?: string;
}

export interface IMessage {
  key: string;
  author: string;
  uid: string;
  message: string;
  profileImg: string;
  edited: boolean;
  timePosted: number;
  greeting: boolean;
  emojis: [];
}

export interface IRoom {
  name: string;
  icon: string;
  members: { [key: string]: { user: string } };
  private?: boolean;
  password?: string;
}

export interface IUserInfo {
  status: string;
  banner: string;
  name: string;
  uid: string;
  memberSince: string;
  profileImg: string;
}

export interface INotifications {
  [key: string]: number;
}

export type GetAllRoomsResponse = {
  [key: string]: IRoom;
};

export type GetRoomResponse = {
  [key: string]: { user: string };
};

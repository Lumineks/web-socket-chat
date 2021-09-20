import WebSocket from "ws";
import user from "./user";

export interface userOnline extends user {
    wsc: WebSocket,
}
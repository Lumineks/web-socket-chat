export default interface user {
    id: number;
    username: string;
    email: string;
    password: string;
    admin: boolean;
    banned: boolean;
    muted: boolean;
}
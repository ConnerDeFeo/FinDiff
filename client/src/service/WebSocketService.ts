import { fetchAuthSession } from "aws-amplify/auth";

const URL = import.meta.env.VITE_WEBSOCKET_URL;

const getIdToken = async (): Promise<string | undefined> => {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    return idToken;
}

export const WebSocketService = {
    createSecureWebSocket: async(): Promise<WebSocket> => {
        const idToken = await getIdToken();
        return new WebSocket(`${URL}?token=${idToken}`);
    },
    createWebSocket: (): WebSocket => {
        return new WebSocket(URL!);
    }
}

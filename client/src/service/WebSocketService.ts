import { fetchAuthSession } from "aws-amplify/auth";

const URL = import.meta.env.VITE_WEBSOCKET_URL;

const getIdToken = async (): Promise<string | undefined> => {
    try{
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();
        return idToken;
    }catch(error){
        return undefined;
    }
}

export const WebSocketService = {
    createWebSocket: (): WebSocket => {
        return new WebSocket(URL!);
    },
    sendMessage: async (ws: WebSocket, payload:Record<any, any>): Promise<void> => {
        const idToken = await getIdToken();
        payload.bearerToken = idToken;
        ws.send(JSON.stringify(payload));
    }
}

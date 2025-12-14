import { fetchAuthSession } from "aws-amplify/auth";

const API_KEY = import.meta.env.VITE_AWS_API_KEY;

const getIdToken = async (): Promise<string> => {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    if (!idToken) {
        throw new Error("User is not authenticated, ID token is missing.");
    }
    return idToken;
}

const API = {
    get: async (path: string): Promise<Response> => {
        const idToken = await getIdToken();
        return await fetch(path, {
            method: 'GET',
            headers: {
                'X-Api-Key': API_KEY,
                Authorization: `Bearer ${idToken}`
            }
        });
    },
    post: async (path: string, data: Record<string, any> = {}): Promise<Response> => {
        const idToken = await getIdToken();
        return await fetch(path, {
            method: 'POST',  
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': API_KEY,
                Authorization: `Bearer ${idToken}`
            },
            body: JSON.stringify(data),
        });
    },
    put: async (path: string, data: Record<string, any> = {}): Promise<Response> => {
        const idToken = await getIdToken();
        return await fetch(path, {
            method: 'PUT',  
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': API_KEY,
                Authorization: `Bearer ${idToken}`
            },
            body: JSON.stringify(data),
        });
    },
    delete: async (path: string): Promise<Response> => {
        const idToken = await getIdToken();
        return await fetch(path, {
            method: 'DELETE',
            headers: {
                'X-Api-Key': API_KEY,
                Authorization: `Bearer ${idToken}`
            }
        });
    },
};
  
export default API;
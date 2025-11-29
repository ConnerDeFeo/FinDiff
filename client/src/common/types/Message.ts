import type { MessageRole } from "../variables/Enums";

export type Message = {
    role: MessageRole;
    content: string;
    section?: string;
}
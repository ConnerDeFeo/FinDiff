import FinDiffBlinker from "../../common/component/display/FinDiffBlinker";
import MarkDownDisplay from "../../common/component/display/MarkdownDisplay";
import type { Message } from "../../common/types/Message";
import { MessageRole } from "../../common/variables/Enums";

const MessageDisplay = ({message, index, chatLength}:{message: Message, index: number, chatLength: number}) => {
    return(
        <div key={index} className={`mb-6 ${message.role === MessageRole.User ? '' : 'text-left'}`}>
            {message.role === MessageRole.Assistant ? 
                // Assistant message with optional section header
                <div className={` 
                    ${message.section ? "border-2 border-gray-300 rounded-lg p-4 bg-white" : ""}
                    ${index == chatLength-1 && `min-h-[80vh]`}
                `}>
                    {message.section &&
                        <div className="text-center font-bold py-2 mb-2 text-3xl border-b-2">{message.section}</div>
                    }
                    {
                        message.content ?
                        <MarkDownDisplay markdown={message.content} />
                        :
                        <FinDiffBlinker />
                    }
                </div>
                : 
                // User message 
                <div className="ml-80 bg-gray-200 p-3 pr-5 rounded-xl text-left break-words">
                    {message.content}
                </div>
            }
        </div>
    );
};

export default MessageDisplay;
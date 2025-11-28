import { useState } from "react";
import type { Stock } from "../../common/types/Stock";
import { MessageRole, WebSocketMessageType } from "../../common/variables/Enums";
import LeftSidebar from "./leftSideBar/LeftSidebar";
import MarkDownDisplay from "../../common/component/display/MarkdownDisplay";
import type { Message } from "../../common/types/Message";

const MainPage = () => {
    const [chat, setChat] = useState<Message[]>([]);
    const [awaitingAnalysis, setAwaitingAnalysis] = useState<boolean>(false);
    const [analysisMode, setAnalysisMode] = useState<'compare' | 'single' | 'chatbot'>('chatbot');
    const [userInput, setUserInput] = useState<string>('');
    const [selectedDocuments, setSelectedDocuments] = useState<{
        filingDate: string;
        accessionNumber: string;
        primaryDocument: string;
        year: string;
    }[]>([]);
    const [selectedStock, setSelectedStock] = useState<Stock | undefined>();
    const [disableSendButton, setDisableSendButton] = useState<boolean>(false);
    const [conversationId, setConversationId] = useState<string>('');

    // Handle prompt submission
    const handlePromptSubmit = async (e?: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e) e.preventDefault(); // Prevent newline on enter key press
        setDisableSendButton(true);
        setChat(prev=>[...prev, { role: MessageRole.User, content: userInput }]);
        setUserInput('');
        setAwaitingAnalysis(true);
        
        if (selectedDocuments.length >= 1) {
        setAnalysisMode('chatbot');
        
            // Create WebSocket on-demand
            const websocket = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL);
            const payload = selectedDocuments.length === 1 ? {
                action: 'generate_response',
                cik: selectedStock?.cik_str,
                accession: selectedDocuments[0].accessionNumber,
                primaryDoc: selectedDocuments[0].primaryDocument,
                prompt: userInput,
                conversationId: conversationId || undefined
            } : {
                action: "generate_multi_context_response",
                stocks: selectedDocuments.map(doc => ({
                    cik: selectedStock?.cik_str,
                    accession: doc.accessionNumber,
                    primaryDoc: doc.primaryDocument
                })),
                prompt: userInput,
                conversationId: conversationId || undefined
            };
            
            websocket.onopen = () => {
                console.log("WebSocket connection opened");
                setDisableSendButton(true);
                setChat(prev=>[...prev, { role: MessageRole.Assistant, content: "" }]);
                websocket.send(JSON.stringify(payload));
            };
            
            websocket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                
                if (message.type === WebSocketMessageType.Chunk) {
                    setChat(prev=>{
                        const updated = [...prev];
                        const lastIndex = updated.length - 1;
                        updated[lastIndex] = {
                            ...updated[lastIndex],
                            content: updated[lastIndex].content + message.data
                        };
                        return updated;
                    });
                    setAwaitingAnalysis(false);
                } else if (message.type === WebSocketMessageType.Complete) {
                    console.log(message.id)
                    setConversationId(message.id);
                    websocket.close();
                } else if (message.type === WebSocketMessageType.Error) {
                    setChat(prev=>{
                        const updated = [...prev];
                        const lastIndex = updated.length - 1;
                        updated[lastIndex] = {
                            ...updated[lastIndex],
                            content: updated[lastIndex].content + message.data
                        };
                        return updated;
                    });
                    websocket.close();
                    setAwaitingAnalysis(false);
                }
            };

            websocket.onclose = () => {
                console.log("WebSocket connection closed");
                setDisableSendButton(false);
            };
            
            websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                websocket.close();
                setAwaitingAnalysis(false);
            };
        }
    };

    return (
        <div className="h-screen findiff-bg-white flex overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar
            setChat={setChat}
            setAnalysisMode={setAnalysisMode}
            awaitingAnalysis={awaitingAnalysis}
            selectedDocuments={selectedDocuments}
            setSelectedDocuments={setSelectedDocuments}
            selectedStock={selectedStock}
            setSelectedStock={setSelectedStock}
            setAwaitingAnalysis={setAwaitingAnalysis}
            setDisableSendButton={setDisableSendButton}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-8 mb-24">
                {chat.length > 0 && chat.map((message, index) => (
                    <div key={index} className={`mb-6 ${message.role === MessageRole.User ? 'text-right' : 'text-left'}`}>
                        {message.role === MessageRole.Assistant ? 
                            <MarkDownDisplay markdown={message.content} /> 
                            : 
                            <div className="ml-80 bg-gray-200 p-3 pr-5 rounded-xl text-left">
                                {message.content}
                            </div>
                        }
                    </div>
                ))}
                {chat.length === 0 && !awaitingAnalysis && (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-400">
                    <svg className="mx-auto h-24 w-24 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg">
                        {analysisMode === 'compare' 
                        ? 'Select filings to compare and view analysis here'
                        : 'Select a filing to analyze and view results here'
                        }
                    </p>
                    </div>
                </div>
                )}
            </div>
            </div>
            
            {/* Text Input Area */}
            <div className="w-4xl mx-auto fixed bottom-2 left-70 right-0 bg-white">
            <div className="relative">
                <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your message here..."
                    className="
                        block w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 
                        focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none transition-all
                    "
                    rows={3}
                    onKeyDown={e => (e.key === "Enter" && !e.shiftKey && !disableSendButton) ? handlePromptSubmit(e) : undefined}
                />
                <div className="absolute bottom-3 right-3">
                <button
                    onClick={() => handlePromptSubmit()}
                    disabled={!userInput.trim() || selectedDocuments.length === 0 || awaitingAnalysis || disableSendButton}
                    className={`
                        px-2 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium 
                        hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 
                        transition-all cursor-pointer ${
                        (!userInput.trim() || selectedDocuments.length === 0 || awaitingAnalysis || disableSendButton) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    <img src="/images/Arrow.png" alt="Send" className="h-7 w-7"/>
                </button>
                </div>
            </div>
            </div>
        </div>
        </div>
    );
}

export default MainPage;
import { useRef, useState, useEffect } from "react";
import type { Stock } from "../../common/types/Stock";
import { MessageRole, WebSocketMessageType } from "../../common/variables/Enums";
import LeftSidebar from "./leftSideBar/LeftSidebar";
import type { Message } from "../../common/types/Message";
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import MessageDisplay from "./MessageDisplay";
import { useUser } from "../../common/hooks/useUser";
import { LocalStorageKeys } from "../../common/variables/LocalStorageKeys";
import { AuthenticationModalType, useAuthenticationModal } from "../../common/hooks/useAuthenticationModal";

const MainPage = () => {
    // Buffer for incoming streamed content chunks
    const buffer = useRef<string>('');
    // Ref to track the accumulated displayed content
    const displayedContentRef = useRef<string>('');
    // Virtuoso ref for chat container
    const chatContainerRef = useRef<VirtuosoHandle | null>(null);
    
    // Chat message history
    const [chat, setChat] = useState<Message[]>([]);
    // Flag to indicate if analysis is in progress
    const [awaitingAnalysis, setAwaitingAnalysis] = useState<boolean>(false);
    // Current analysis mode (compare filings, single filing, or chatbot)
    const [analysisMode, setAnalysisMode] = useState<'compare' | 'single' | 'chatbot'>('chatbot');
    // User's current text input
    const [userInput, setUserInput] = useState<string>('');
    // Selected SEC filing documents for analysis
    const [selectedDocuments, setSelectedDocuments] = useState<{
        filingDate: string;
        accessionNumber: string;
        primaryDocument: string;
        year: string;
    }[]>([]);
    // Currently selected stock/company
    const [selectedStock, setSelectedStock] = useState<Stock | undefined>();
    // Controls whether send button is disabled
    const [disableSendButton, setDisableSendButton] = useState<boolean>(false);
    // Unique ID for the current conversation thread
    const [conversationId, setConversationId] = useState<string>('');
    const {currentUser} = useUser();
    const {setAuthenticationModal} = useAuthenticationModal();
    const remChats = localStorage.getItem(LocalStorageKeys.NO_SIGN_IN_CHATS_REMAINING);
    const displaySignInBanner = !currentUser && remChats && parseInt(remChats) <= 0;

    /**
     * Handles submission of user prompt to backend via WebSocket
     * Supports both single and multi-document analysis
     */
    const handlePromptSubmit = async (e?: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e) e.preventDefault(); // Prevent newline on enter key press
        if(!currentUser){
            if(remChats){
                if(parseInt(remChats) <=0){
                    setAuthenticationModal(AuthenticationModalType.SIGNIN);
                    return;
                }
                localStorage.setItem(LocalStorageKeys.NO_SIGN_IN_CHATS_REMAINING, (parseInt(remChats)-1).toString());
            }
            else{
                localStorage.setItem(LocalStorageKeys.NO_SIGN_IN_CHATS_REMAINING, "4");
            }
        }
        
        // Disable send button and add user message to chat
        setDisableSendButton(true);
        setChat(prev=>[...prev, { role: MessageRole.User, content: userInput }, { role: MessageRole.Assistant, content: ""}]);
        setUserInput('');
        setAwaitingAnalysis(true);
        displayedContentRef.current = '';
        
        // Only proceed if at least one document is selected
        if (selectedDocuments.length >= 1) {
            setAnalysisMode('chatbot');
        
            // Create WebSocket connection on-demand
            const websocket = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL);
            
            // Build payload based on number of selected documents
            const payload = selectedDocuments.length === 1 ? {
                // Single document analysis
                action: 'generate_response',
                cik: selectedStock?.cik_str,
                accession: selectedDocuments[0].accessionNumber,
                primaryDoc: selectedDocuments[0].primaryDocument,
                prompt: userInput,
                conversationId: conversationId || undefined
            } : {
                // Multi-document comparison
                action: "generate_multi_context_response",
                stocks: selectedDocuments.map(doc => ({
                    cik: selectedStock?.cik_str,
                    accession: doc.accessionNumber,
                    primaryDoc: doc.primaryDocument
                })),
                prompt: userInput,
                conversationId: conversationId || undefined
            };
            
            // Handle WebSocket connection opened
            websocket.onopen = () => {
                console.log("WebSocket connection opened");
                setDisableSendButton(true);
                // Add empty assistant message that will be populated with streamed content
                websocket.send(JSON.stringify(payload));
            };
            
            // Handle incoming messages from WebSocket
            websocket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                
                if (message.type === WebSocketMessageType.Chunk) {
                    // Accumulate content chunks in buffer
                    buffer.current += message.data;
                } else if (message.type === WebSocketMessageType.Complete) {
                    // Analysis complete, save conversation ID and close connection
                    console.log(message.id)
                    setConversationId(message.id);
                    setAwaitingAnalysis(false);
                    websocket.close();
                } else if (message.type === WebSocketMessageType.Error) {
                    // Handle error message
                    buffer.current += message.data;
                    websocket.close();
                    setAwaitingAnalysis(false);
                }
            };

            // Handle WebSocket connection closed
            websocket.onclose = () => {
                console.log("WebSocket connection closed");
                setDisableSendButton(false);
            };
            
            // Handle WebSocket errors
            websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                websocket.close();
                setAwaitingAnalysis(false);
            };
        }
    };

    /**
     * Animation loop that gradually displays buffered content
     * Creates a typewriter effect for streaming responses
     */
    useEffect(() => {
        let lastUpdate = 0;
        let updates = false;

        const animate = (timestamp: number) => {
            if (buffer.current.length > 0) {
                const chunk = buffer.current.slice(0, 15);
                buffer.current = buffer.current.slice(15);
                displayedContentRef.current += chunk;
                updates = true;
            }

            // Update React state at most 20fps (every 50ms) if there are updates
            if (timestamp - lastUpdate > 50 && updates) {
                setChat(prev => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    updated[updated.length - 1] = {
                        ...last,
                        content: displayedContentRef.current
                    };
                    return updated;
                });
                lastUpdate = timestamp;
                updates = false;
            }

            requestAnimationFrame(animate);
        };

        const id = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(id);
    }, []);

    useEffect(() => {
        const last = chat[chat.length - 1];
        if (!last) return;

        // Only scroll if the last message is from the assistant
        if (last.role === MessageRole.Assistant) {
            chatContainerRef.current?.scrollToIndex({
                index: chat.length - 1,
                align: "end",
                behavior: "smooth"
            });
        }
    }, [chat.length]);

    /**
     * Clears chat and conversation ID when selected documents change
     */
    const clearChat = ()=>{
        setChat([]);
        setConversationId('');
    }

    return (
        <div className="h-screen findiff-bg-white flex overflow-hidden">
            {/* Left Sidebar - Document selection and stock picker */}
            <LeftSidebar
                buffer={buffer}
                displayedContentRef={displayedContentRef}
                setChat={setChat}
                setAnalysisMode={setAnalysisMode}
                awaitingAnalysis={awaitingAnalysis}
                selectedDocuments={selectedDocuments}
                setSelectedDocuments={setSelectedDocuments}
                selectedStock={selectedStock}
                setSelectedStock={setSelectedStock}
                setAwaitingAnalysis={setAwaitingAnalysis}
                setDisableSendButton={setDisableSendButton}
                clearChat={clearChat}
            />
            {/* Main Content Area - Chat display and input */}
            <div className="flex-1 flex flex-col relative justify-between h-full overflow-hidden">
                {/* Sign In Banner */}
                {displaySignInBanner && (
                    <div className="w-full bg-gradient-to-r from-blue-200 to-blue-800 text-white py-3 px-6 shadow-lg fixed">
                        <div className="max-w-4xl mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span className="font-semibold">You've reached your free chat limit. Sign in to continue using FinDiff!</span>
                            </div>
                            <button
                                onClick={() => setAuthenticationModal(AuthenticationModalType.SIGNIN)}
                                className="bg-white text-blue-500 font-semibold py-2 px-6 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                Sign In
                            </button>
                        </div>
                    </div>
                )}
                {
                    chat.length > 0 ?
                    <Virtuoso
                        data={chat}
                        itemContent={(index, item) => (
                            <div className={`
                                max-w-4xl mx-auto 
                                ${index === chat.length - 1 ? 'pb-22' : ''}
                                ${index === 0 ? 'pt-4' : ''}
                            `} key={index}>
                                <MessageDisplay message={item} index={index} chatLength={chat.length} />
                            </div>
                        )}
                        followOutput={chat.length > 1 ? 'smooth' : false}
                        ref={chatContainerRef}
                        className="overflow-y-auto"
                    />
                    : !awaitingAnalysis && 
                    (
                        <div className="flex justify-center items-center mt-20">
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
                    )
                }
                {/* Fixed text input area at bottom */}
                <div className="w-4xl mx-auto fixed bottom-2 left-62 right-0 bg-white border-2 border-blue-500 rounded-lg focus:outline-none">
                    {/* Multi-line text input with auto-resize */}
                    <textarea
                        value={userInput}
                        onChange={(e) => {
                            setUserInput(e.target.value);
                            // Auto-resize textarea
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                        }}
                        placeholder="Type your message here..."
                        className="block w-full p-3 border-transparent resize-none rounded-lg focus:outline-none overflow-y-auto min-h-12 max-h-50"
                        rows={1}
                        onKeyDown={e => (e.key === "Enter" && !e.shiftKey && !disableSendButton) ? handlePromptSubmit(e) : undefined}
                    />
                    <div className="relative h-10">
                        {/* Send button positioned in bottom-right of textarea */}
                        <div className="absolute bottom-1 right-3">
                            <button
                                onClick={() => handlePromptSubmit()}
                                disabled={!userInput.trim() || selectedDocuments.length === 0 || awaitingAnalysis || disableSendButton || buffer.current.length > 0}
                                className={`
                                    px-2 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium 
                                    hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 
                                    transition-all cursor-pointer ${
                                    (!userInput.trim() || selectedDocuments.length === 0 || awaitingAnalysis || disableSendButton || buffer.current.length > 0) ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                <img src="/images/Arrow.png" alt="Send" className="h-6 w-6"/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MainPage;
import { useRef, useState, useEffect } from "react";
import type { Stock } from "../../common/types/Stock";
import { MessageRole, WebSocketMessageType } from "../../common/variables/Enums";
import LeftSidebar from "./leftSideBar/LeftSidebar";
import MarkDownDisplay from "../../common/component/display/MarkdownDisplay";
import type { Message } from "../../common/types/Message";
import FinDiffBlinker from "../../common/component/display/FinDiffBlinker";

const MainPage = () => {
    // Buffer for incoming streamed content chunks
    const buffer = useRef<string>('');
    // Ref to track the accumulated displayed content
    const displayedContentRef = useRef<string>('');
    // Ref for scrollable chat container
    const chatContainerRef = useRef<HTMLDivElement | null>(null);
    
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

    /**
     * Handles submission of user prompt to backend via WebSocket
     * Supports both single and multi-document analysis
     */
    const handlePromptSubmit = async (e?: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e) e.preventDefault(); // Prevent newline on enter key press
        
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
        let animationFrameId: number;
        
        const animate = () => {
            if (buffer.current.length > 0) {
                // Take 5 characters from buffer at a time
                const chunk = buffer.current.slice(0, 5);
                buffer.current = buffer.current.slice(5);
                displayedContentRef.current += chunk;
                
                // Update the last assistant message with accumulated content
                setChat(prev => {
                    const updated = [...prev];
                    if (updated.length > 0) {
                        updated[updated.length - 1] = {
                            ...updated[updated.length - 1],
                            content: displayedContentRef.current
                        };
                    }
                    return updated;
                });
            }
            animationFrameId = requestAnimationFrame(animate);
        };
        
        animationFrameId = requestAnimationFrame(animate);
        // Cleanup animation frame on unmount
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    /**
     * Auto-scrolls chat to bottom when new messages arrive
     */
    useEffect(() => {
        const el = chatContainerRef.current;
        if (!el) return;

        requestAnimationFrame(() => {
            // true bottom = scrollHeight - clientHeight
            el.scrollTop = el.scrollHeight - el.clientHeight;
        });
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
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Scrollable chat message area */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
                    <div className="max-w-4xl mx-auto p-8 mb-24">
                        {/* Render all chat messages */}
                        {chat.length > 0 && chat.map((message, index) => (
                            <div key={index} className={`mb-6 ${message.role === MessageRole.User ? '' : 'text-left'}`}>
                                {message.role === MessageRole.Assistant ? 
                                    // Assistant message with optional section header
                                    <div className={` 
                                        ${message.section ? "border-2 border-gray-300 rounded-lg p-4 bg-white" : ""}
                                        ${index == chat.length -1 && `min-h-[80vh]`}
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
                        ))}
                        {/* Empty state placeholder */}
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
                
                {/* Fixed text input area at bottom */}
                <div className="w-4xl mx-auto fixed bottom-2 left-62 right-0 bg-white">
                    <div className="relative">
                        {/* Multi-line text input with auto-resize */}
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
                        {/* Send button positioned in bottom-right of textarea */}
                        <div className="absolute bottom-3 right-3">
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
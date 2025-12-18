import { useState } from "react";
import FinDiffButton from "../../../common/component/FinDiffButton";
import SearchStock from "../../../common/component/SearchStock";
import secService from "../../../service/SecService";
import type { Stock } from "../../../common/types/Stock";
import { MessageRole, WebSocketMessageType } from "../../../common/variables/Enums";
import StockDisplay from "../../../common/component/display/StockDisplay";
import SelectedDocuments from "./SelectedDocuments";
import SectionSelection from "./SectionSelection";
import type { Message } from "../../../common/types/Message";
import { useUser } from "../../../common/hooks/useUser";
import { useNavigate } from "react-router-dom";
import { WebSocketService } from "../../../service/WebSocketService";
import { FindiffModalType, useFindiffModal } from "../../../common/hooks/useFindiffModal";

/**
 * LeftSidebar component - Main navigation and control panel for SEC filing analysis
 * Handles stock selection, document selection, section analysis, and user authentication
 */
const LeftSidebar = (
    {
        setChat, 
        setAnalysisMode, 
        awaitingAnalysis, 
        selectedDocuments, 
        selectedStock, 
        setSelectedDocuments, 
        setSelectedStock, 
        setAwaitingAnalysis,
        setDisableSendButton,
        buffer,
        displayedContentRef,
        clearChat
    }
    :
    {
        setChat: React.Dispatch<React.SetStateAction<Message[]>>, 
        setAnalysisMode: React.Dispatch<React.SetStateAction<'compare' | 'single' | 'chatbot'>>, 
        awaitingAnalysis: boolean,
        selectedDocuments: {
            filingDate: string;
            accessionNumber: string;
            primaryDocument: string;
            year: string;
        }[],
        selectedStock: Stock | undefined,
        setSelectedDocuments: React.Dispatch<React.SetStateAction<{
            filingDate: string;
            accessionNumber: string;
            primaryDocument: string;
            year: string;
        }[]>>,
        setSelectedStock: React.Dispatch<React.SetStateAction<Stock | undefined>>,
        setAwaitingAnalysis: React.Dispatch<React.SetStateAction<boolean>>,
        setDisableSendButton: React.Dispatch<React.SetStateAction<boolean>>,
        buffer: React.RefObject<string>,
        displayedContentRef: React.RefObject<string>,
        clearChat: ()=>void;
    }
) => {
    // State for storing available 10-K filings for the selected stock
    const [available10KFilings, setAvailable10KFilings] = useState<{accessionNumber:string, filingDate:string, primaryDocument:string}[]>([]);
    
    // State for the currently selected section to analyze
    const [selectedSection, setSelectedSection] = useState<string>("");
    // Hooks for modal management, user authentication, and navigation
    const { setFindiffModal } = useFindiffModal();
    const { currentUser } = useUser();
    const navigate = useNavigate();
    
    /**
     * Handles the submission of analysis request
     * Determines whether to perform single document analysis or comparison
     * Establishes WebSocket connection for streaming results
     */
    const handleSubmit = async () => {
        // Validate required selections
        if (selectedDocuments.length === 0 || !selectedSection || !selectedStock) return;
        
        // Set analysis state and clear previous content
        setAwaitingAnalysis(true);
        displayedContentRef.current = '';
        let data = {};
        
        if (selectedDocuments.length === 1) {
            // Single document analysis mode
            setAnalysisMode('single');
            const doc = selectedDocuments[0];
            const stockData = {
                cik: selectedStock.cik_str, 
                accessionNumber: doc.accessionNumber, 
                primaryDocument: doc.primaryDocument
            };
            data = {
                stock: stockData,
                action: 'analyze_10k_section',
                section: selectedSection,
            }

        } else if (selectedDocuments.length === 2) {
            // Comparison mode - analyze two documents
            setAnalysisMode('compare');
            
            // Sort documents by filing date (oldest first)
            const [doc1, doc2] = selectedDocuments.sort((a, b) => a.filingDate.localeCompare(b.filingDate));
            
            const stockData1 = {
                cik: selectedStock.cik_str, 
                accessionNumber: doc1.accessionNumber,  
                primaryDocument: doc1.primaryDocument
            };
            const stockData2 = {
                cik: selectedStock.cik_str, 
                accessionNumber: doc2.accessionNumber, 
                primaryDocument: doc2.primaryDocument
            };
            data = {
                stock1: stockData1,
                stock2: stockData2,
                action: 'compare_10k_filings',
                section: selectedSection,
            }
        }
        
        // Create WebSocket connection for streaming analysis results
        const websocket = WebSocketService.createWebSocket();
        
        // When connection opens, add empty assistant message and send request
        websocket.onopen = () => {
            setChat(prev=>[...prev, { role: MessageRole.Assistant, content: "", section: selectedSection.replaceAll('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}]);
            WebSocketService.sendMessage(websocket, data);
        };

        // Handle incoming messages from the server
        websocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            if (message.type === WebSocketMessageType.Chunk) {
                // Accumulate streaming content chunks
                buffer.current += message.data;
            } else if (message.type === WebSocketMessageType.Complete) {
                // Analysis complete, close connection
                websocket.close();
                setAwaitingAnalysis(false);
            } else if (message.type === WebSocketMessageType.Error) {
                // Handle error messages
                buffer.current += message.data;
                websocket.close();
                setAwaitingAnalysis(false);
            } else if(message.type === WebSocketMessageType.FreeTierLimit) {
                // Free tier limit reached, remove last message and show premium modal
                setChat(prev=>prev.splice(0, prev.length - 1))
                setFindiffModal(FindiffModalType.GET_PREMIUM);
                websocket.close();
                setAwaitingAnalysis(false);
            }
        };
        
        // Handle WebSocket errors
        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            websocket.close();
            setAwaitingAnalysis(false);
        };

        // Clean up when connection closes
        websocket.onclose = () => {
            console.log("WebSocket connection closed");
            setDisableSendButton(false);
        }
    }

    /**
     * Fetches available 10-K filings for a given stock CIK
     * @param cik - Central Index Key for the stock
     */
    const fetchAvailable10KFilings = async (cik:string) => {
        const resp = await secService.getAvailable10KFilings(cik);
        if(resp.ok){
            const data = await resp.json();
            setAvailable10KFilings(data);
        }
    }

    /**
     * Handles stock selection from the search component
     * Clears previous document selections and fetches available filings
     * @param stock - Selected stock object
     */
    const onStockSelect = (stock: Stock) => {
        setSelectedDocuments([]);
        fetchAvailable10KFilings(stock.cik_str);
        setSelectedStock(stock);
    }

    return (
        <div className="flex flex-col h-[100vh] bg-white border-r border-gray-200 shadow-lg">
            {/* Main scrollable content area */}
            <div className="w-65 overflow-y-auto p-4 h-[90%]">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r findiff-primary-blue bg-clip-text text-transparent">
                    FinDiff
                    </h1>
                    <p className="text-sm text-gray-600">SEC Filing Analysis</p>
                </div>

                {/* Stock Search Component */}
                <div className="mb-6">
                    <SearchStock onSelect={onStockSelect}/>
                </div>

                {/* Selected Stock Information and Controls - Only shown when a stock is selected */}
                {selectedStock && (
                    <div className="flex flex-col">
                        <div className="gap-y-4 flex flex-col">
                            {/* Stock Overview Display */}
                            <StockDisplay selectedStock={selectedStock} />

                            {/* Document Selection Interface */}
                            <SelectedDocuments
                                selectedDocuments={selectedDocuments}
                                selectedCik={selectedStock.cik_str}
                                awaitingAnalysis={awaitingAnalysis}
                                available10KFilings={available10KFilings}
                                setSelectedDocuments={setSelectedDocuments}
                                setDisableSendButton={setDisableSendButton}
                            />

                            {/* Section Selection and Analysis Button - Only for authenticated users */}
                            {currentUser ? (
                                <>
                                    {/* Section Selection Dropdown */}
                                    <SectionSelection
                                        selectedSection={selectedSection}
                                        setSelectedSection={setSelectedSection}
                                    />

                                    {/* Submit Analysis Button */}
                                    <FinDiffButton 
                                        onClick={handleSubmit} 
                                        disabled={
                                            awaitingAnalysis || 
                                            !selectedSection || 
                                            selectedDocuments.length === 0 ||
                                            buffer.current.length > 0
                                        }
                                    >
                                        {selectedDocuments.length === 2 ? 'Compare Sections' : selectedDocuments.length === 1 ? 'View Section' : 'Select Documents'}
                                    </FinDiffButton>
                                </>
                            ) : (
                                // Sign-in prompt for unauthenticated users
                                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg">
                                    <p className="text-sm text-center text-gray-700 mb-2">
                                        <span className="font-semibold text-blue-700">Sign in</span> to view individual sections of 10-K filings.
                                    </p>
                                    <FinDiffButton onClick={() => setFindiffModal(FindiffModalType.SIGNIN)} className="w-full">
                                        Sign In
                                    </FinDiffButton>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* New Chat Button - Clears current chat session */}
            <FinDiffButton onClick={clearChat} className="mt-10 flex items-center h-[5%] w-38 ml-4 mb-2 justify-between">
                <p>New Chat</p>
                <p className="text-xl ml-2 mb-1">+</p>
            </FinDiffButton>
            
            {/* User Profile Section - Shows user info or sign-in prompt */}
            <button 
                className="mt-auto h-[5%] w-65 flex items-center gap-x-2 border-t border-gray-200 cursor-pointer" 
                onClick={currentUser ? ()=>navigate("/profile") : ()=>setFindiffModal(FindiffModalType.SIGNIN)}
            >
                <img src="/images/UserAvatar.png" className="h-10 w-10 p-1 ml-4"/>

                <div>
                    {currentUser ? 
                        // Authenticated user display
                        <div className="text-left text-sm">
                            <p>{currentUser.email}</p>
                            <p className=" text-gray-500">{currentUser.premium ? "Premium User" : "Free User"}</p>
                        </div>
                        : 
                        // Sign-in prompt
                        <p>Sign In</p>
                    }
                </div>
            </button>
        </div>
    );
}

export default LeftSidebar;
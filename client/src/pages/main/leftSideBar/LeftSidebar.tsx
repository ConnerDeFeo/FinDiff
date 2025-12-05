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
import { AuthenticationModalType, useAuthenticationModal } from "../../../common/hooks/useAuthenticationModal";
import { useUser } from "../../../common/hooks/useUser";


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
    const [available10KFilings, setAvailable10KFilings] = useState<{accessionNumber:string, filingDate:string, primaryDocument:string}[]>([]);
    const [selectedSection, setSelectedSection] = useState<string>("");
    const [currentFilingSelection, setCurrentFilingSelection] = useState<string>('');
    const { setAuthenticationModal } = useAuthenticationModal();
    const { currentUser } = useUser();
    
    const handleSubmit = async () => {
        if (selectedDocuments.length === 0 || !selectedSection || !selectedStock) return;
        setAwaitingAnalysis(true);
        displayedContentRef.current = '';
        let data = {};
        if (selectedDocuments.length === 1) {
            // Single analysis
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
            // Comparison analysis
            setAnalysisMode('compare');
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
        const websocket = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL!);
        websocket.onopen = () => {
            console.log("WebSocket connection opened");
            setChat(prev=>[...prev, { role: MessageRole.Assistant, content: "", section: selectedSection.replaceAll('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}]);
            websocket.send(JSON.stringify(data));
        };

        websocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            if (message.type === WebSocketMessageType.Chunk) {
                buffer.current += message.data;
            } else if (message.type === WebSocketMessageType.Complete) {
                websocket.close();
                setAwaitingAnalysis(false);
            } else if (message.type === WebSocketMessageType.Error) {
                buffer.current += message.data;
                websocket.close();
                setAwaitingAnalysis(false);
            }
        };
        
        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            websocket.close();
            setAwaitingAnalysis(false);
        };

        websocket.onclose = () => {
            console.log("WebSocket connection closed");
            setDisableSendButton(false);
        }
    }

    const fetchAvailable10KFilings = async (cik:string) => {
        const resp = await secService.getAvailable10KFilings(cik);
        if(resp.ok){
        const data = await resp.json();
        setAvailable10KFilings(data);
        }
    }

    const onStockSelect = (stock: Stock) => {
        setSelectedDocuments([]);
        fetchAvailable10KFilings(stock.cik_str);
        setSelectedStock(stock);
    }

    return (
        <div className="flex flex-col h-[100vh] bg-white border-r border-gray-200 shadow-lg">
            <div className="w-65 overflow-y-auto p-4 h-[90%]">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r findiff-primary-blue bg-clip-text text-transparent">
                    FinDiff
                    </h1>
                    <p className="text-sm text-gray-600">SEC Filing Analysis</p>
                </div>

                {/* Search Section */}
                <div className="mb-6">
                    <SearchStock onSelect={onStockSelect}/>
                </div>

                {/* Selected Stock Card */}
                {selectedStock && (
                    <div className="flex flex-col">
                        <div className="gap-y-4 flex flex-col">
                            {/* Stock Overview */}
                            <StockDisplay selectedStock={selectedStock} />

                            {/* Selected Documents */}
                            <SelectedDocuments
                                selectedDocuments={selectedDocuments}
                                selectedCik={selectedStock.cik_str}
                                awaitingAnalysis={awaitingAnalysis}
                                available10KFilings={available10KFilings}
                                currentFilingSelection={currentFilingSelection}
                                setCurrentFilingSelection={setCurrentFilingSelection}
                                setSelectedDocuments={setSelectedDocuments}
                                setDisableSendButton={setDisableSendButton}
                            />

                            {/* Sections Selection */}
                            <SectionSelection
                                selectedSection={selectedSection}
                                setSelectedSection={setSelectedSection}
                            />

                            {/* Action Button */}
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
                        </div>
                    </div>
                )}
            </div>
            <FinDiffButton onClick={clearChat} className="mt-10 flex items-center h-[5%] w-35 ml-4 mb-2">
                <p>New Chat</p>
                <p className="text-xl ml-2 mb-1">+</p>
            </FinDiffButton>
            <button 
                className="mt-auto h-[5%] w-65 flex items-center gap-x-2 border-t border-gray-200 cursor-pointer" 
                onClick={currentUser ? ()=>setAuthenticationModal(AuthenticationModalType.LOGOUT) : ()=>setAuthenticationModal(AuthenticationModalType.SIGNIN)}
            >
                <img src="/images/UserAvatar.png" className="h-10 w-10 p-1 ml-4"/>
                <p>{currentUser ? currentUser.email : 'Sign In'}</p>
            </button>
        </div>
    );
}

export default LeftSidebar;
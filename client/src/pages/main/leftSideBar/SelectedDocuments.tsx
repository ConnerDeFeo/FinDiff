import { useState } from "react";
import FindiffDropDown from "../../../common/component/display/FindiffDropDown";
import { WebSocketMessageType } from "../../../common/variables/Enums";
import secService from "../../../service/SecService";
import { useUser } from "../../../common/hooks/useUser";
import { WebSocketService } from "../../../service/WebSocketService";

const SelectedDocuments = (
    {
        selectedDocuments, 
        awaitingAnalysis, 
        available10KFilings, 
        currentFilingSelection, 
        setCurrentFilingSelection, 
        setSelectedDocuments, 
        selectedCik,
        setDisableSendButton
    }:
    {
        selectedDocuments: Array<{year: string; filingDate: string; accessionNumber: string; primaryDocument: string}>;
        awaitingAnalysis: boolean;
        available10KFilings: {accessionNumber:string, filingDate:string, primaryDocument:string}[];
        currentFilingSelection: string;
        setCurrentFilingSelection: React.Dispatch<React.SetStateAction<string>>;
        setSelectedDocuments: React.Dispatch<React.SetStateAction<{
            filingDate: string;
            accessionNumber: string;
            primaryDocument: string;
            year: string;
        }[]>>;
        selectedCik: string;
        setDisableSendButton: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const [uploadProgress, setUploadProgress] = useState<Record<string, {completed: number, total: number}>>({});
    const {currentUser} = useUser();

    const uploadDocument = async (filing: {accessionNumber:string, filingDate:string, primaryDocument:string}) => {
        const websocket = await WebSocketService.createSecureWebSocket();
        websocket.onopen = () => {
            console.log(`Uploading document for filing date: ${filing.filingDate}`);
            setDisableSendButton(true);
            setUploadProgress(prev => ({
                ...prev,
                [filing.filingDate]: { completed: 0, total: 1 }
            }));
            websocket.send(JSON.stringify({
                action: 'upload_document',
                cik: selectedCik,
                accession: filing.accessionNumber,
                primaryDoc: filing.primaryDocument,
            }));
        }

        websocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if(message.type === WebSocketMessageType.Update) {
                setUploadProgress(prev => ({
                    ...prev,
                    [filing.filingDate]: { completed: message.completed, total: message.total }
                }));
            }
            else if(message.type === WebSocketMessageType.Complete) {
                setUploadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[filing.filingDate];
                    return newProgress;
                });
                websocket.close();
            }
            else if(message.type === WebSocketMessageType.Error) {
                console.error(`Error uploading ${filing.filingDate}: ${message.message}`);
                setUploadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[filing.filingDate];
                    return newProgress;
                });
                websocket.close();
            }
        };

        websocket.onerror = (event) => {
            console.error(`WebSocket error for ${filing.filingDate}:`, event);
            setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[filing.filingDate];
                return newProgress;
            });
            websocket.close();
        }

        websocket.onclose = () => {
            console.log(`Upload WebSocket connection closed for filing date: ${filing.filingDate}`);
            setDisableSendButton(false);
        }
    }

    const addDocument = async () => {
        const maxDocuments = currentUser ? 2 : 1;
        if (!currentFilingSelection || selectedDocuments.length >= maxDocuments) return;
        const filing = available10KFilings.find(f => f.filingDate.split('-')[0] === currentFilingSelection);
        const resp = await secService.checkDocumentProcessed(
            selectedCik,
            filing!.accessionNumber,
            filing!.primaryDocument
        );
        if(!resp.ok) return;
        const data = await resp.json();
        if(!data.processed) uploadDocument(filing!);
        
        setSelectedDocuments([...selectedDocuments, {
            filingDate: filing!.filingDate,
            accessionNumber: filing!.accessionNumber,
            primaryDocument: filing!.primaryDocument,
            year: filing!.filingDate.split('-')[0]
        }]);
        setCurrentFilingSelection('');
    };

    const removeDocument = (filingDate: string) => {
        setSelectedDocuments(selectedDocuments.filter(doc => doc.filingDate !== filingDate));
    };

    return(
        <div className="pb-6 border-b border-gray-200">
            <h3 className="text-sm font-semibold findiff-secondary-blue mb-3">
                Selected 10-K Documents ({selectedDocuments.length}/{currentUser ? 2 : 1})
            </h3>
            {selectedDocuments.length > 0 ? (
                <div className="gap-y-2 mb-3">
                    {selectedDocuments.map((doc) => {
                        const progress = uploadProgress[doc.filingDate];
                        const progressPercent = progress ? (progress.completed / progress.total) * 100 : 0;
                        
                        return (
                            <div 
                                key={doc.filingDate}
                                className="flex flex-col p-2 bg-blue-50 border border-blue-200 rounded-lg mb-2"
                            >
                                <div className="flex items-center justify-between">
                                    <a href={`https://www.sec.gov/Archives/edgar/data/${selectedCik}/${doc.accessionNumber.replace(/-/g, '')}/${doc.primaryDocument}`}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="flex items-center"
                                    >
                                        <span className="text-sm text-blue-800 font-medium underline">{doc.year}</span>
                                    </a>
                                    <button
                                        onClick={() => removeDocument(doc.filingDate)}
                                        className="text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                                        disabled={awaitingAnalysis || !!progress}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                {progress && (
                                    <div className="mt-2">
                                        <div className="text-xs text-blue-600 mb-1">
                                            <span>Uploading...</span>
                                        </div>
                                        <div className="w-full bg-blue-200 rounded-full h-2">
                                            <div 
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-xs text-gray-500 mb-3">No documents selected</p>
            )}
            
            {selectedDocuments.length < (currentUser ? 2 : 1) && (
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <FindiffDropDown
                            options={available10KFilings
                                .filter(filing => !selectedDocuments.some(doc => doc.filingDate === filing.filingDate))
                                .map(filing => filing.filingDate.split('-')[0])}
                            value={currentFilingSelection}
                            onChange={setCurrentFilingSelection}
                            placeholder="Select a filing"
                            disabled={awaitingAnalysis}
                        />
                        <button
                            onClick={addDocument}
                            disabled={!currentFilingSelection || awaitingAnalysis}
                            className="cursor-pointer px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            Add
                        </button>
                    </div>
                    <p className="text-xs text-gray-500">
                        {selectedDocuments.length === 0 
                            ? (currentUser ? 'Add 1 document for single analysis, or 2 for comparison' : 'Add 1 document for analysis')
                            : 'Add 1 more document for comparison analysis'}
                    </p>
                </div>
            )}
            
            {!currentUser && selectedDocuments.length >= 1 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                        <span className="font-semibold">Sign in</span> to compare multiple documents and unlock advanced features
                    </p>
                </div>
            )}
        </div>
    );
};
export default SelectedDocuments;
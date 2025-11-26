import FindiffDropDown from "../../../common/component/display/FindiffDropDown";
import { WebSocketMessageType } from "../../../common/variables/Enums";
import secService from "../../../service/SecService";

const SelectedDocuments = ({selectedDocuments, awaitingAnalysis, available10KFilings, currentFilingSelection, setCurrentFilingSelection, setSelectedDocuments, selectedCik}:
    {selectedDocuments: Array<{year: string; filingDate: string; accessionNumber: string; primaryDocument: string}>;
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
}) => {
    const uploadDocument = async (filing: {accessionNumber:string, filingDate:string, primaryDocument:string}) => {
        const websocket = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL as string);
        websocket.onopen = () => {
            console.log(`WebSocket opened for ${filing.filingDate}`);
            websocket.send(JSON.stringify({
                action: 'upload_document',
                cik: selectedCik,
                accession: filing.accessionNumber,
                primaryDoc: filing.primaryDocument,
            }));
        }

        websocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if(message.type === WebSocketMessageType.Complete) {
                console.log(`Upload complete for ${filing.filingDate}`);
            }
            else if(message.type === WebSocketMessageType.Update) {
                console.log(`Progress update for ${filing.filingDate}: ${message.completed}/${message.total}`);
            }
            else if(message.type === WebSocketMessageType.Error) {
                console.error(`Error uploading ${filing.filingDate}: ${message.message}`);
            }
            else if (message.type === WebSocketMessageType.Complete) {
                console.log(`Upload complete for ${filing.filingDate}`);
                websocket.close();
            }
        };

        websocket.onerror = (event) => {
            console.error(`WebSocket error for ${filing.filingDate}:`, event);
            websocket.close();
        }

        websocket.onclose = () => {
            console.log(`WebSocket closed for ${filing.filingDate}`);
        }
    }

    const addDocument = async () => {
        if (!currentFilingSelection || selectedDocuments.length >= 2) return;
        const filing = available10KFilings.find(f => f.filingDate.split('-')[0] === currentFilingSelection);
        const resp = await secService.checkDocumentProcessed(
            selectedCik,
            filing!.accessionNumber,
            filing!.primaryDocument
        );
        if(!resp.ok) return;
        const data = await resp.json();
        console.log('Document processed status:', data);
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
                Selected Documents ({selectedDocuments.length}/2)
            </h3>
            {selectedDocuments.length > 0 ? (
                <div className="gap-y-2 mb-3">
                    {selectedDocuments.map((doc) => (
                        <div 
                            key={doc.filingDate}
                            className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                            <span className="text-sm text-blue-800 font-medium">{doc.year}</span>
                            <button
                                onClick={() => removeDocument(doc.filingDate)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                disabled={awaitingAnalysis}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-gray-500 mb-3">No documents selected</p>
            )}
            
            {selectedDocuments.length < 2 && (
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
                            ? 'Add 1 document for single analysis, or 2 for comparison' 
                            : 'Add 1 more document for comparison analysis'}
                    </p>
                </div>
            )}
        </div>
    );
};
export default SelectedDocuments;
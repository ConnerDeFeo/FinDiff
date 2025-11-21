import { useState } from "react";
import './global.css'
import MarkDownDisplay from "./common/component/display/MarkdownDisplay";
import Spinner from "./common/component/display/Spinner";
import LeftSidebar from "./common/component/main/LeftSidebar";
import type { Stock } from "./common/types/Stock";

function App() {
  const [analysis, setAnalysis] = useState<string>('');
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

  // Handle prompt submissionq
  const handlePromptSubmit = async () => {
    setAnalysis('');
    setUserInput('');
    setAwaitingAnalysis(true);
    
    if (selectedDocuments.length >= 1) {
      setAnalysisMode('chatbot');
      
      // Create WebSocket on-demand
      const websocket = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL);
      
      websocket.onopen = () => {
        console.log('WebSocket connection established');
        websocket.send(JSON.stringify({
          cik: selectedStock?.cik_str,
          accession: selectedDocuments[0].accessionNumber,
          primaryDoc: selectedDocuments[0].primaryDocument,
          prompt: userInput,
          action: 'generate_response'
        }));
      };
      
      websocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        if (message.type === 'chunk') {
          setAnalysis(prev => prev + message.data);
          setAwaitingAnalysis(false);
        } else if (message.type === 'complete') {
          console.log('Stream complete');
          websocket.close();
        } else if (message.type === 'error') {
          console.error('Error:', message.message);
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
        console.log('WebSocket disconnected');
      };
    }
  };

  return (
    <div className="h-screen findiff-bg-white flex overflow-hidden">
      {/* Left Sidebar */}
      <LeftSidebar
        setAnalysis={setAnalysis}
        setAnalysisMode={setAnalysisMode}
        awaitingAnalysis={awaitingAnalysis}
        selectedDocuments={selectedDocuments}
        setSelectedDocuments={setSelectedDocuments}
        selectedStock={selectedStock}
        setSelectedStock={setSelectedStock}
        setAwaitingAnalysis={setAwaitingAnalysis}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8 mb-24">
            {(analysis || awaitingAnalysis) && (awaitingAnalysis ? 
                <div className="flex flex-col justify-center items-center py-12">
                  <Spinner />
                  <p className="mt-4 text-gray-600">This may take a few moments.</p>
                </div>
                :
                <MarkDownDisplay markdown={analysis} />
            )}
            {!analysis && !awaitingAnalysis && (
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
              onKeyDown={e => e.key === "Enter" ? handlePromptSubmit() : undefined}
            />
            <div className="absolute bottom-3 right-3">
              <button
                onClick={handlePromptSubmit}
                disabled={!userInput.trim() || selectedDocuments.length !== 1 || awaitingAnalysis}
                className={`
                  px-2 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium 
                  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 
                  transition-all cursor-pointer ${
                  (!userInput.trim() || selectedDocuments.length !== 1 || awaitingAnalysis) ? 'opacity-50 cursor-not-allowed' : ''
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

export default App;
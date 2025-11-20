import { useEffect, useState } from "react";
import './global.css'
import secService from "./service/SecService";
import MarkDownDisplay from "./common/component/display/MarkdownDisplay";
import Spinner from "./common/component/display/Spinner";
import LeftSidebar from "./common/component/main/LeftSidebar";
import type { Stock } from "./common/types/Stock";

function App() {
  const [analysis, setAnalysis] = useState<string>('');
  const [progress, setProgress] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');
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

  useEffect(()=>{
    const poll = async (attempt: number) => {
      if (attempt >= 150) {
        setAnalysis('Analysis timed out. Please try again later.');
        setAwaitingAnalysis(false);
        return;
      }
      setAwaitingAnalysis(true);
      
      const resp = analysisMode === 'compare' 
        ? await secService.getComparisonStatus(jobId)
        : analysisMode === 'single' ? 
        await secService.get10KAnalysisStatus(jobId)
        : 
        await secService.getChatbotStatus(jobId);
        
      if(!resp.ok) {
        setAnalysis('Error fetching analysis status.');
        setAwaitingAnalysis(false);
        return;
      }
      const job =  await resp.json();

      if (job.status === 'COMPLETED' || job.status === 'FAILED') {
        setAnalysis(job.result || 'Analysis failed.');
        setAwaitingAnalysis(false);
        return;
      }
      if(job.progress){
        setProgress(job.progress);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      poll(attempt + 1);
    };
    if(jobId){
      poll(0);
      setJobId('');
    }
  }, [jobId, analysisMode]);

  const handlePromptSubmit = async () => {
    if(selectedDocuments.length===1){
      setAnalysisMode('chatbot');
      const resp = await secService.generateResponse(
        userInput, 
        selectedStock!.cik_str, 
        selectedDocuments[0].accessionNumber, 
        selectedDocuments[0].primaryDocument
      );
      if(resp.ok){
        const jobId = await resp.json();
        setJobId(jobId);
        setUserInput('');
      }
    }
  }

  return (
    <div className="h-screen findiff-bg-white flex overflow-hidden">
      {/* Left Sidebar */}
      <LeftSidebar
        setAnalysis={setAnalysis}
        setJobId={setJobId}
        setAnalysisMode={setAnalysisMode}
        awaitingAnalysis={awaitingAnalysis}
        selectedDocuments={selectedDocuments}
        setSelectedDocuments={setSelectedDocuments}
        selectedStock={selectedStock}
        setSelectedStock={setSelectedStock}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {(analysis || awaitingAnalysis) && (
              <>
                { awaitingAnalysis ? 
                  <div className="flex flex-col justify-center items-center py-12">
                    <Spinner />
                    <p className="mt-4 text-gray-600">This may take a few moments.</p>
                  </div>
                  :
                  <MarkDownDisplay markdown={analysis} />
                }
                {awaitingAnalysis &&
                  <p>{progress}</p>
                }
              </>
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
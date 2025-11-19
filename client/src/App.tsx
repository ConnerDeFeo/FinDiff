import { useEffect, useState } from "react";
import './global.css'
import secService from "./service/SecService";
import MarkDownDisplay from "./common/component/display/MarkdownDisplay";
import Spinner from "./common/component/display/Spinner";
import LeftSidebar from "./common/component/main/LeftSidebar";

function App() {
  const [analysis, setAnalysis] = useState<string>('');
  const [progress, setProgress] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');
  const [awaitingAnalysis, setAwaitingAnalysis] = useState<boolean>(false);
  const [analysisMode, setAnalysisMode] = useState<'compare' | 'single' | 'chatbot'>('compare');
  const [userInput, setUserInput] = useState<string>('');

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
    const resp = await secService.generateResponse(userInput);
    if(resp.ok){
      const jobId = await resp.json();
      setJobId(jobId);
      setUserInput('');
    }
  }

  return (
    <div className="h-screen findiff-bg-white flex overflow-hidden">
      {/* Left Sidebar */}
      <LeftSidebar
        analysisMode={analysisMode}
        setAnalysis={setAnalysis}
        setJobId={setJobId}
        setAnalysisMode={setAnalysisMode}
        awaitingAnalysis={awaitingAnalysis}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-8">
            {(analysis || awaitingAnalysis) && (
              <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 findiff-border-primary-blue">
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
              </div>
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
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-5xl mx-auto">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your message here..."
              className="w-full p-3 border-2 border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none transition-all"
              rows={3}
              onKeyDown={e => e.key === "Enter" ? handlePromptSubmit() : undefined}
            />
            <button
              onClick={handlePromptSubmit}
              className="cursor-pointer mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
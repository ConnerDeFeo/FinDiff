import { useState } from "react"
import Spinner from "./display/Spinner"

const FinDiffButton: React.FC<{children: React.ReactNode, onClick: () => void | Promise<void>, disabled?: boolean, gray?: boolean, className?: string}> = 
({children, onClick, disabled, gray, className}) => {

  const [loadingState, setLoadingState] = useState<boolean>(false)

  // Wraps the provided onClick to handle Promise-based async calls
  const handleClick = () => {
    if (!onClick) return

    const resp = onClick()
    // If onClick returns a Promise, show spinner until it resolves
    if (resp instanceof Promise) {
      setLoadingState(true)
      resp.finally(() => setLoadingState(false))
    }
  }

  return (
    <button
        onClick={handleClick}
        disabled={loadingState || disabled}
        className={`
            relative font-medium px-4 py-2 rounded-lg flex-1 
            transition-all duration-200 ease-in-out
            shadow-sm text-sm
            ${gray 
                ? "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 hover:border-gray-400 active:bg-gray-300" 
                : "bg-gradient-to-b from-blue-500 to-blue-600 text-white border border-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-md active:from-blue-700 active:to-blue-800"
            }
            ${disabled || loadingState
                ? "opacity-50 cursor-not-allowed" 
                : "cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            }
            ${className ?? ""}
        `}
    >
        {loadingState ? (
            // Show spinner + children text when loading
            <span className="flex items-center justify-center">
                <Spinner />
                {children}...
            </span>
        ) : (
            // Default: render children directly
            children
        )}
    </button>
  );
}

export default FinDiffButton;
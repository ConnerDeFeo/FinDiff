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
            text-white px-5 py-2 rounded-lg flex-1
            ${gray ? "bg-gray-400" : "findiff-bg-primary-blue"}
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90 cursor-pointer"}
            ${loadingState ? "opacity-50 cursor-not-allowed" : ""}
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
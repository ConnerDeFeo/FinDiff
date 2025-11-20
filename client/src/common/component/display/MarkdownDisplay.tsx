import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MarkDownDisplay: React.FC<{ markdown: string }> = ({ markdown }) => {
  return (
    <div className="rounded-lg">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // ===== HEADINGS =====
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl findiff-secondary-blue font-bold my-6" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl findiff-secondary-blue font-bold my-4" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg findiff-secondary-blue font-bold my-3" {...props} />
          ),

          // ===== PARAGRAPHS & LISTS =====
          p: ({ node, ...props }) => (
            <p className="my-2 leading-7 text-gray-800" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="list-disc  my-1 ml-6" {...props} />
          ),

          // ===== TABLES (FIXES TAILWIND RESET) =====
          table: ({ node, ...props }) => (
            <table className="table-auto border-collapse border border-gray-300 my-6 w-full" {...props} />
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-100" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="border border-gray-300 px-3 py-2 font-semibold text-left" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-gray-300 px-3 py-2" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="even:bg-gray-50" {...props} />
          ),

          strong: ({ node, ...props }) => <strong {...props} />,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

export default MarkDownDisplay;
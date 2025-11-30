import { useState, useEffect } from 'react';

const FinDiffBlinker = () => {
  const [lightness, setLightness] = useState(0);
  const [increasing, setIncreasing] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setLightness(prev => {
        if (prev >= 50) {
          setIncreasing(false);
          return prev - 1;
        } else if (prev <= 0) {
          setIncreasing(true);
          return prev + 1;
        }
        return increasing ? prev + 1 : prev - 1;
      });
    }, 50); // Update every 50ms

    return () => clearInterval(interval);
  }, [increasing]);

  return (
    <div
    className="w-5 h-5 rounded-full"
    style={{
        backgroundColor: `hsl(220, 100%, ${lightness}%)`
    }}
    />
  );
};

export default FinDiffBlinker;
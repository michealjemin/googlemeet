import { useState, useEffect, useRef } from 'react';

const useMediaStream = () => {
  const [state, setState] = useState(null);
  const isStreamSet = useRef(false);

  useEffect(() => {
    if (isStreamSet.current) return;
    isStreamSet.current = true;
    (async function initStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        console.log("setting your stream");
        setState(stream);
      } catch (e) {
        console.log("Error in media navigator", e);
      }
    })();

    // Cleanup function
    return () => {
      if (state) {
        state.getTracks().forEach((track) => track.stop())
      }
    };
  }, [state]);

  return {
    stream: state,setStream:setState
  };
};

export default useMediaStream;
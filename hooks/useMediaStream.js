import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

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
        // toast.success("Stream initialized");
        setState(stream);
      } catch (e) {
        toast.error("error while initializing media stream", e)
      }
    })();

    
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
import {useState} from 'react'
import { cloneDeep } from 'lodash'
import { useSocket } from '@/context/socket'
import { useRouter } from 'next/router'
import useMediaStream from './useMediaStream'


const usePlayer = (myId, roomId, peer) => {
   const{setStream}=useMediaStream()
    const socket = useSocket()
    const [players, setPlayers] = useState({})
    const router = useRouter()
    const playersCopy = cloneDeep(players)

    const playerHighlighted = playersCopy[myId]
    delete playersCopy[myId]

    const nonHighlightedPlayers = playersCopy

    const leaveRoom = () => {
        socket.emit('user-leave', myId, roomId);
        console.log("leaving room", roomId);
      
       
        const stream = players[myId].url;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      
        peer?.disconnect(); 
        router.push('/'); 
      };
    const toggleAudio = () => {
        console.log("I toggled my audio")
        setPlayers((prev) => {
            const copy = cloneDeep(prev)
            copy[myId].muted = !copy[myId].muted
            return {...copy}
        })
        socket.emit('user-toggle-audio', myId, roomId)
    }

    const toggleVideo = async () => {
        console.log("I toggled my video");
        const stream = players[myId].url;
      
        if (stream) {
          const videoTracks = stream.getVideoTracks();
          if (videoTracks.length > 0) {
            if (videoTracks[0].enabled) {
                
              
              videoTracks.forEach((track) => track.stop()); 
            } else {
             
              const newStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: players[myId].muted, 
              });
              setStream(newStream )
              setPlayers((prev) => ({
                ...prev,
                [myId]: {
                  url: newStream,
                  muted: prev[myId].muted,
                  playing: true,
                },
              }));
              
              Object.keys(players).forEach((playerId) => {
                if (playerId !== myId) {
                  const call = peer.call(playerId, newStream);
                  call.on("stream", (incomingStream) => {
                    setPlayers((prev) => ({
                      ...prev,
                      [playerId]: {
                        url: incomingStream,
                        muted: prev[playerId].muted,
                        playing: prev[playerId].playing,
                      },
                    }));
                  });
                }
              });
            }
          }
        }
      
        setPlayers((prev) => {
          const copy = cloneDeep(prev);
          copy[myId].playing = !copy[myId].playing;
          return { ...copy };
        });
      
        socket.emit("user-toggle-video", myId, roomId);
      };
    return {players, setPlayers, playerHighlighted, nonHighlightedPlayers, toggleAudio, toggleVideo, leaveRoom}
}

export default usePlayer;
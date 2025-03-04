import {useState} from 'react'
import { cloneDeep } from 'lodash'
import { useSocket } from '@/context/socket'
import { useRouter } from 'next/router'


const usePlayer = (myId, roomId, peer) => {
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
      console.log("Toggling video...");
    
      let player = players[myId];
      if (!player) {
        console.log("No player found for myId");
        return;
      }
    
      let stream = player.url;
      if (!stream) {
        try {
          console.log("Requesting a new video stream...");
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setPlayers((prev) => ({
            ...prev,
            [myId]: {
              ...prev[myId],
              playing: true,
              url: stream,
            },
          }));
    
          console.log("New stream set:", stream);
        } catch (error) {
          console.error("Error getting video stream:", error);
          return;
        }
      }
    
      const videoTracks = stream.getVideoTracks();
      console.log("Video tracks:", videoTracks);
    
      if (videoTracks.length > 0) {
        if (player.playing) {
          console.log("Stopping video...");
    
          videoTracks.forEach((track) => {
            track.stop();
            stream.removeTrack(track);
          });
          Object.keys(players).forEach((playerId) => {
            if (playerId !== myId) {
              const sender = peer?.connections[playerId]?.[0]?.peerConnection
                ?.getSenders()
                .find((s) => s.track?.kind === "video");
    
              if (sender) {
                console.log("Removing video track from peer connection:", playerId);
                peer?.connections[playerId]?.[0]?.peerConnection.removeTrack(sender);
              }
            }
          });
    
          setPlayers((prev) => ({
            ...prev,
            [myId]: {
              ...prev[myId],
              playing: false,
              url: null,
            },
          }));
    
          console.log("Video stopped");
        }
      }
    
      socket.emit("user-toggle-video", myId, roomId);
    };
    return {players, setPlayers, playerHighlighted, nonHighlightedPlayers, toggleAudio, toggleVideo, leaveRoom}
}

export default usePlayer;
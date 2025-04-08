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
    
      // Always request a new stream when toggling video on
      if (!player.playing) {
        try {
          console.log("Requesting a new video stream...");
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    
          setPlayers((prev) => ({
            ...prev,
            [myId]: {
              ...prev[myId],
              playing: true, // Video is now playing
              url: stream,
            },
          }));
    
          console.log("New stream set:", stream);
    
          // Notify peers that video is toggled back on
          Object.keys(players).forEach((playerId) => {
            if (playerId !== myId) {
              const sender = peer?.connections[playerId]?.[0]?.peerConnection
                ?.getSenders()
                .find((s) => s.track?.kind === "video");
    
              if (sender) {
                console.log("Re-adding video track to peer connection:", playerId);
                sender.replaceTrack(stream.getVideoTracks()[0]); // Add video track back to peer connection
              }
            }
          });
    
          console.log("Video started.");
        } catch (error) {
          console.error("Error getting video stream:", error);
        }
      } else {
        // If video is currently playing, stop it
        console.log("Stopping video...");
    
        const stream = player.url;
        if (stream) {
          const videoTracks = stream.getVideoTracks();
          videoTracks.forEach((track) => {
            track.stop(); // Stop the video track
          });
    
          // Notify peers that the video is toggled off
          Object.keys(players).forEach((playerId) => {
            if (playerId !== myId) {
              const sender = peer?.connections[playerId]?.[0]?.peerConnection
                ?.getSenders()
                .find((s) => s.track?.kind === "video");
    
              if (sender) {
                console.log("Removing video track from peer connection:", playerId);
                sender.track.stop(); // Stop the track in peer connection
              }
            }
          });
    
          // Set the player's video to not playing and remove the stream reference
          setPlayers((prev) => ({
            ...prev,
            [myId]: {
              ...prev[myId],
              playing: false,
              url: null, // Clear the stream
            },
          }));
    
          console.log("Video stopped.");
        }
      }
    
      // Emit the toggle event to the server
      socket.emit("user-toggle-video", myId, roomId);
    };
    return {players, setPlayers, playerHighlighted, nonHighlightedPlayers, toggleAudio, toggleVideo, leaveRoom}
}

export default usePlayer;
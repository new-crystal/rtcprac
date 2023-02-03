import { async } from "@firebase/util";
import { useEffect } from "react";
import { useRef } from "react";
import { servers } from "./server/firebase";
import { db } from "./server/firebase";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { useState } from "react";

const Meet = () => {
  const myVideo_ref = useRef();
  const yourVideo_ref = useRef();
  const [audio, setAudio] = useState(true);
  const [video, setVideo] = useState(true);

  const pc = new RTCPeerConnection(servers);
  let localStream = null;
  let remoteStream = null;

  const getVideo = async () => {
    //roomid
    let id = "ddd";
    let data = null;

    const dataList = await getDocs(collection(db, "meettingtest"));
    dataList.forEach((result) => {
      result.data().roomId === id && getFirebase(result.data());
    });

    localStream = await navigator.mediaDevices.getUserMedia({
      video,
      audio,
    });

    remoteStream = new MediaStream();

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    pc.ontrack = (event) => {
      event.streams[0].getTracks((track) => {
        remoteStream.addTrack(track);
      });
    };

    myVideo_ref.current.srcObject = localStream;
    yourVideo_ref.current.srcObject = remoteStream;
  };

  function getFirebase(data) {
    setAudio(data.audio);
    setVideo(data.video);
  }

  useEffect(() => {
    getVideo();
  }, []);

  return (
    <div>
      <video ref={myVideo_ref}></video>
      <video ref={yourVideo_ref}></video>
    </div>
  );
};

export default Meet;

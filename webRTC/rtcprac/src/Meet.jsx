import { async } from "@firebase/util";
import { useEffect } from "react";
import { useRef } from "react";
import { db, pc } from "./server/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useState } from "react";
import { push, ref } from "firebase/database";
import { database } from "./server/firebase";

const Meet = () => {
  const myVideo_ref = useRef();
  const yourVideo_ref = useRef();
  const call_ref = useRef();
  const [audio, setAudio] = useState(false);
  const [video, setVideo] = useState({ width: 300, height: 300 });
  const roomId = "237747";
  const locate = ref(database, "meettest");

  let localStream = null;
  let remoteStream = null;

  const getVideo = async (event) => {
    //roomid
    let id = "b71cd8";
    let data = null;

    getDataList(id);

    getLocalStream();

    getRemoteStream(event);
  };

  async function getDataList(id) {
    const dataList = await getDocs(collection(db, "video"));
    dataList.forEach((result) => {
      result.data().roomId === id && setAudio(result.data().audio);
    });
  }

  async function getLocalStream() {
    localStream = await navigator.mediaDevices.getUserMedia({
      video,
      audio,
    });
    myVideo_ref.current.srcObject = localStream;

    myVideo_ref.current.onloadedmetadata = () => {
      myVideo_ref.current.play();
    };

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() =>
        sendSignalingMessage({
          type: "video-offer",
          sdp: pc.localDescription,
        })
      )
      .then((msg) => handleOffer({ sdp: pc.localDescription }))
      .catch((err) => {
        console.log(err);
      });

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
  }

  function sendSignalingMessage(msg) {
    const msgJSON = JSON.stringify(msg);
    push(locate, msgJSON);
  }

  async function getRemoteStream(e) {
    remoteStream = new MediaStream();

    yourVideo_ref.current.srcObject = remoteStream;

    myVideo_ref.current.onloadedmetadata = () => {
      myVideo_ref.current.play();
    };

    pc.ontrack = (e) => {
      e.streams[0].getTracks((track) => {
        remoteStream.addTrack(track);
      });
    };
  }

  function getAnswer() {
    pc.createAnswer()
      .then((answer) => pc.setLocalDescription(answer))
      .then(() => {
        sendSignalingMessage({
          type: "video-answer",
          sdp: pc.remoteDescription,
        });
      });
  }
  function handleOffer(msg) {
    const desc = new RTCSessionDescription(msg.sdp);
    pc.setRemoteDescription(desc)
      .then(() => navigator.mediaDevices.getUserMedia({ audio, video }))
      .then((stream) => {
        myVideo_ref.current.srcObject = stream;
        return pc.addStream(stream);
      })
      .then(() => pc.createAnswer())
      .then((answer) => pc.setLocalDescription(answer))
      .then(() => {
        sendSignalingMessage({
          type: "video-remoteDescription",
          sdp: pc.remoteDescription,
        });
      })
      .catch((err) => console.log(err));
  }

  useEffect(() => {
    getVideo();
    getAnswer();
    //handleOffer();
    //addPeople();
  }, []);

  return (
    <div>
      {/* <button onClick={(event) => getVideo(event)}>start!</button> */}
      <input ref={call_ref} />
      <video ref={myVideo_ref}></video>
      <video ref={yourVideo_ref}></video>
      {/* <button onClick={onClickEndBtn}>종료</button> */}
    </div>
  );
};

export default Meet;

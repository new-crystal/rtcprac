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

  pc.onicecandidate = handleICECandidateEvent;
  pc.onnegotiationneeded = handleNegotiationNeededEvent;
  pc.ontrack = handleTrackEvent;

  let localStream = null;
  let remoteStream = null;

  async function handleNegotiationNeededEvent() {
    try {
      const offer = await pc.createOffer();
      if (pc.signalingState !== "stable") {
        return;
      }
      await pc.setLocalDescription(offer);

      // Send the offer to the remote peer.
      sendSignalingMessage({
        name: "susu",
        target: "0gun",
        type: "offer",
        sdp: pc.localDescription,
      });
    } catch (err) {
      reportError(err);
    }
  }

  function handleTrackEvent(event) {
    yourVideo_ref.current.srcObject = event.streams[0];
  }

  const getVideo = async (event) => {
    //roomid
    let id = "b71cd8";

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
          name: "susu",
          target: "0gun",
          type: "offer",
          sdp: pc.localDescription,
        })
      )
      .then(() => handleOffer({ sdp: pc.localDescription }))
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

  function handleOffer(msg) {
    const desc = new RTCSessionDescription(msg.sdp);
    pc.setRemoteDescription(desc)
      .then(() => navigator.mediaDevices.getUserMedia({ audio, video }))
      .then((stream) => {
        localStream = stream;
        myVideo_ref.current.srcObject = localStream;

        localStream
          .getTracks()
          .forEach((track) => pc.addTrack(track, localStream));
      })
      .then(() => pc.createAnswer())
      .then((answer) => pc.setLocalDescription(answer))
      .then(() => {
        sendSignalingMessage({
          name: "susu",
          target: "0gun",
          type: "video-remoteDescription",
          sdp: pc.localDescription,
        });
      })
      .catch((err) => console.log(err));
  }
  function handleICECandidateEvent(event) {
    if (event.candidate) {
      sendSignalingMessage({
        type: "new-ice-candidate",
        target: "0gun",
        candidate: event.candidate,
      });
    }
  }
  useEffect(() => {
    getVideo();
  }, []);

  return (
    <div>
      {/* <button onClick={(event) => getVideo(event)}>start!</button> */}
      <input ref={call_ref} />
      <video
        autoPlay
        style={{ width: "300px", height: "300px", backgroundColor: "lavender" }}
        ref={myVideo_ref}
      ></video>
      <video
        autoPlay
        style={{ width: "300px", height: "300px", backgroundColor: "lavender" }}
        ref={yourVideo_ref}
      ></video>
      {/* <button onClick={onClickEndBtn}>종료</button> */}
    </div>
  );
};

export default Meet;

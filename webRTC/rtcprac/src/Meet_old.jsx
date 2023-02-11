import { async } from "@firebase/util";
import { useEffect } from "react";
import { useRef } from "react";
import { db, pc } from "./server/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useState } from "react";
import { push, ref, set, onValue, getDatabase } from "firebase/database";
import { database } from "./server/firebase";

const MeetTest = () => {
  const myVideo_ref = useRef();
  const yourVideo_ref = useRef();
  const call_ref = useRef();
  const [audio, setAudio] = useState(false);
  const [video, setVideo] = useState({ width: 300, height: 300 });
  const roomId = "2377471212";
  const locate = ref(database, "offer");
  const getOffer = getDatabase();
  const getOfferLocate = ref(getOffer, `offer/${roomId}`);
  let answerObj = null;

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

  //firebase data 가져오기
  async function getDataList(id) {
    const dataList = await getDocs(collection(db, "video"));
    dataList.forEach((result) => {
      result.data().roomId === id && setAudio(result.data().audio);
    });
  }

  //내 비디오 띄우기 + createOffer
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

  //firebase로 내보내기
  function sendSignalingMessage(msg) {
    const msgJSON = JSON.stringify(msg);
    push(getOfferLocate, { type: msg.type, msg: msgJSON }).catch((err) =>
      console.log(err)
    );
  }

  //다른 사람 데이터 트랙에 넣어주기
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

  //createAnswer
  function handleOffer(msg) {
    const desc = new RTCSessionDescription(msg.sdp);
    console.log(desc);
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
          type: "answer",
          sdp: pc.localDescription,
        });
      })
      .then(() => getAnswer({ sdp: pc.localDescription }))
      .catch((err) => console.log(err));
  }

  function getAnswer(m) {
    let msg = null;
    onValue(getOfferLocate, async (data) => {
      let dataObject = await data.val();
      answerObj = Object.values(dataObject);
      msg = await answerObj.find((a) => a.type === "answer");
    });
    const answer = JSON.parse(msg);
    //console.log(answer);
    const des = new RTCSessionDescription({ type: "answer", sdp: m.sdp.sdp });
    console.log(des);
    pc.setRemoteDescription(des).catch((err) => console.log(err));
  }

  //iceCandidate
  function handleICECandidateEvent(event) {
    if (event.candidate) {
      sendSignalingMessage({
        type: "new-ice-candidate",
        candidate: event.candidate,
      });
    }
  }
  useEffect(() => {
    getVideo();
  }, []);

  return (
    <div>
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

export default MeetTest;

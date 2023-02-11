import { async } from "@firebase/util";
import { useEffect } from "react";
import { useRef } from "react";
import { db, pc } from "./server/firebase";
import { collection, getDocs, doc, getDoc, addDoc } from "firebase/firestore";
import { useState } from "react";
import {
  push,
  ref,
  set,
  onValue,
  getDatabase,
  child,
  get,
} from "firebase/database";
import { database } from "./server/firebase";
import { cleanup } from "@testing-library/react";

const MeetTest = () => {
  const myVideo_ref = useRef();
  const yourVideo_ref = useRef();
  const call_ref = useRef();
  const [audio, setAudio] = useState(false);
  const [video, setVideo] = useState({ width: 300, height: 300 });
  const [logined, setLogined] = useState(false);
  const [dataList, setDataList] = useState(null);
  const room = "1234a";

  const locate = ref(database, "offer");
  const getOffer = getDatabase();

  let answerObj = null;
  let offerMsg = null;
  let answerMsg = null;

  // pc.onnegotiationneeded = handleNegotiationNeededEvent;
  pc.ontrack = handleTrackEvent;

  let localStream = null;
  let remoteStream = null;

  const onClickJoinBtn = () => {
    let data = call_ref.current.value;
    setLogined(true);
    getLocalStream(data);
  };

  //peer A
  //create offer
  // async function handleNegotiationNeededEvent() {
  //   try {
  //     onValue(getOfferLocate, async (data) => {
  //       const dataList = await data.val();
  //       const jsonList = Object.values(dataList);
  //       const notJsonData = jsonList.map((data) => JSON.parse(data.msg));
  //       answerMsg = notJsonData.find((data) => data.type === "answer");
  //     });
  //     if (!answerMsg) {
  //       const offer = await pc.createOffer();
  //       if (pc.signalingState !== "stable") {
  //         return;
  //       }
  //       await pc.setLocalDescription(offer);

  //       // Send the offer to the remote peer.
  //       sendSignalingMessage({
  //         type: "offer",
  //         sdp: pc.localDescription,
  //       });
  //     }
  //   } catch (err) {
  //     reportError(err);
  //   }
  // }

  function handleTrackEvent(event) {
    yourVideo_ref.current.srcObject = event.streams[0];
  }

  //peer A
  //내 비디오 띄우기
  async function getLocalStream(data) {
    localStream = await navigator.mediaDevices.getUserMedia({
      video,
      audio,
    });
    myVideo_ref.current.srcObject = localStream;

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
    createOffering(data);
  }

  //peerA
  //createOffer
  async function createOffering(data) {
    await pc.createOffer().then(async (offer) => {
      console.log(offer);
      await pc.setLocalDescription(offer);
    });
    sendSignalingMessage({
      data,
      type: "offer",
      sdp: pc.localDescription,
    });
  }

  //peer B
  //createAnswer
  async function handleOffer(msg) {
    let dataList = null;
    const getOfferLocate = ref(getOffer, `offer/${msg.data}`);
    onValue(getOfferLocate, async (data) => {
      dataList = await data.val();
      const jsonList = Object.values(dataList);
      const notJsonData = jsonList.map((data) => JSON.parse(data.msg));
      const offerData = notJsonData.find((data) => data.type === "offer");
      pc.setRemoteDescription(new RTCSessionDescription(offerData)).then(
        createAnswered()
      );
    });
  }

  //peer B
  //createAnswer
  async function createAnswered() {
    console.log(dataList);
    pc.createAnswer().then(
      async (answer) => await pc.setLocalDescription(answer)
    );
    sendSignalingMessage({
      data: room,
      type: "answer",
      sdp: pc.localDescription,
    });
  }

  //peerA
  //remoteDEscription()
  async function getAnswer(m) {
    const getOfferLocate = ref(getOffer, `offer/${m.data}`);
    onValue(getOfferLocate, async (data) => {
      const dataList = await data.val();
      const jsonList = Object.values(dataList);
      const notJsonData = jsonList.map((data) => JSON.parse(data.msg));
      const answer = notJsonData.find((data) => data.type === "answer");
      console.log(answer);
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });
  }
  //firebase로 내보내기
  async function sendSignalingMessage(msg) {
    console.log(msg);
    const msgJSON = JSON.stringify(msg.sdp);
    const getOfferLocate = ref(getOffer, `offer/${msg.data}`);
    if (msg.type === "offer" && msg.sdp) {
      offerMsg = msg;
      console.log("offer 성공!");
      handleOffer({ data: msg.data });
    } else if (msg.type === "answer") {
      answerMsg = msg;
      getAnswer({ data: room });
      console.log("answer 성공!");
    }
    push(getOfferLocate, { type: msg.type, msg: msgJSON }).catch((err) =>
      console.log(err)
    );
  }

  return (
    <div>
      {logined ? (
        <div>
          <video
            autoPlay
            style={{
              width: "300px",
              height: "300px",
              backgroundColor: "lavender",
            }}
            ref={myVideo_ref}
          ></video>
          <video
            autoPlay
            style={{
              width: "300px",
              height: "300px",
              backgroundColor: "blue",
            }}
            ref={yourVideo_ref}
          ></video>
        </div>
      ) : (
        <div>
          <h1>Join!!</h1>
          <input ref={call_ref} />
          <button onClick={onClickJoinBtn}>join</button>
        </div>
      )}

      {/* <button onClick={onClickEndBtn}>종료</button> */}
    </div>
  );
};

export default MeetTest;

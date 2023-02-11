import { async } from "@firebase/util";
import { useEffect } from "react";
import { useRef } from "react";
import { db, pc } from "./server/firebase";
import { collection, getDocs, doc, getDoc, addDoc } from "firebase/firestore";
import { useState } from "react";
import { push, ref, set, onValue, getDatabase } from "firebase/database";
import { database } from "./server/firebase";

const MeetTest = () => {
  const myVideo_ref = useRef();
  const yourVideo_ref = useRef();
  const call_ref = useRef();
  const [audio, setAudio] = useState(false);
  const [video, setVideo] = useState({ width: 300, height: 300 });
  const [logined, setLogined] = useState(false);

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
  //내 비디오 띄우기 + createOffer
  async function getLocalStream(data) {
    localStream = await navigator.mediaDevices.getUserMedia({
      video,
      audio,
    });
    myVideo_ref.current.srcObject = localStream;

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() =>
        sendSignalingMessage({
          data,
          type: "offer",
          sdp: pc.localDescription,
        })
      )
      .then(() => handleOffer({ sdp: pc.localDescription, data }))
      .catch((err) => {
        console.log(err);
      });
  }

  //firebase로 내보내기
  async function sendSignalingMessage(msg) {
    const msgJSON = JSON.stringify(msg.sdp);
    const getOfferLocate = ref(getOffer, `offer/${msg.data}`);
    if (msg.type === "offer") {
      offerMsg = msg;
    } else if (msg.type === "answer") {
      answerMsg = msg;
    }
    push(getOfferLocate, { type: msg.type, msg: msgJSON }).catch((err) =>
      console.log(err)
    );
  }

  //peer B
  //createAnswer
  async function handleOffer(msg) {
    // let offer = null;
    // let dataList = null;
    // const getOfferLocate = ref(getOffer, `offer/${msg.data}`);
    // onValue(getOfferLocate, async (data) => {
    //   dataList = await data.val();
    //   const jsonList = Object.values(dataList);
    //   const notJsonData = jsonList.map((data) => JSON.parse(data.msg));
    //   const offer = notJsonData.find((data) => data.type === "offer");
    // });
    console.log(offerMsg);
    await pc
      .setRemoteDescription(offerMsg.sdp)
      .then(() => pc.createAnswer())
      .then((answer) => pc.setLocalDescription(answer))
      .then(() => {
        sendSignalingMessage({
          data: msg.data,
          type: "answer",
          sdp: pc.localDescription,
        });
      })
      .then(() => getAnswer({ sdp: pc.localDescription, data: msg.data }))
      .catch((err) => console.log(err));
  }

  async function getAnswer(m) {
    const getOfferLocate = ref(getOffer, `offer/${m.data}`);
    onValue(getOfferLocate, async (data) => {
      const dataList = await data.val();
      const jsonList = Object.values(dataList);
      const notJsonData = jsonList.map((data) => JSON.parse(data.msg));
      const answer = notJsonData.find((data) => data.type === "answer");
      console.log(answer);
    });
    await pc.setRemoteDescription(answerMsg.sdp);
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

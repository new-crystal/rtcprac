import { async } from "@firebase/util";
import { useEffect } from "react";
import { useRef } from "react";
import { db, pc } from "./server/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  setDoc,
} from "firebase/firestore";
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
import { nanoid } from "nanoid";

const MeetTest = () => {
  const myVideo_ref = useRef();
  const yourVideo_ref = useRef();
  const call_ref = useRef();
  const [audio, setAudio] = useState(false);
  const [video, setVideo] = useState({ width: 300, height: 300 });
  const [logined, setLogined] = useState(false);
  const [dataList, setDataList] = useState(null);
  const userId = nanoid();

  const locate = ref(database, "offer");
  const getOffer = getDatabase();

  let answerObj = null;
  let offerMsg = null;
  let answerMsg = null;

  // pc.onnegotiationneeded = handleNegotiationNeededEvent;
  // pc.ontrack = handleTrackEvent;

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

  //peerB 화면 띄우기
  function handleTrackEvent() {
    remoteStream = new MediaStream();

    yourVideo_ref.current.srcObject = remoteStream;
    yourVideo_ref.current.onloadedmetadata = () => {
      yourVideo_ref.play();
    };

    pc.ontrack = (event) => {
      //console.log(event);
      event.streams[0].getTracks().forEach((track) => {
        //console.log(track);
        remoteStream.addTrack(track);
      });
    };

    // console.log(remoteStream);
  }

  //peer A
  //내 비디오 띄우기
  async function getLocalStream(data) {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        video,
        audio,
      });
      myVideo_ref.current.srcObject = localStream;

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      setTimeout(() => {
        createOffering(data);
        handleTrackEvent();
        findUser(data);
      }, 500);
    } catch (err) {
      console.log(err);
    }
  }
  //User찾기
  async function findUser(data) {
    const meetSnapshot = await getDocs(collection(db, "offer"));
    try {
      meetSnapshot.forEach(async (doc) => {
        if (doc.data().data !== data.data) {
          createOffering(data);
        } else {
          handleOffer(data);
        }
      });
    } catch (err) {
      console.log(err);
    }
  }

  //peerA
  //createOffer
  async function createOffering(data) {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignalingMessage({
        data,
        type: "offer",
        sdp: pc.localDescription,
      });
    } catch (err) {
      console.log(err);
    }
  }

  //peer B
  //createAnswer
  async function handleOffer(msg) {
    let dataList = null;
    const meetSnapshot = await getDocs(collection(db, `offer`));
    meetSnapshot.forEach(async (doc) => {
      if (
        doc.data().data === msg.data &&
        doc.data().type === "offer" &&
        doc.data().userId !== userId
      ) {
        dataList = doc.data();
      }
    });
    if (dataList) {
      pc.setRemoteDescription(
        new RTCSessionDescription(JSON.parse(dataList.msg))
      ).then(createAnswered(msg));
    }
  }

  //peer B
  //createAnswer
  async function createAnswered(msg) {
    pc.createAnswer().then(
      async (answer) => await pc.setLocalDescription(answer)
    );
    sendSignalingMessage({
      data: msg.data,
      type: "answer",
      sdp: pc.localDescription,
    });
  }

  //peerA
  //remoteDEscription()
  async function getAnswer(m) {
    let dataList = null;
    const meetSnapshot = await getDocs(collection(db, `offer`));
    meetSnapshot.forEach(async (doc) => {
      if (doc.data().data === m.data && doc.data().type === "answer") {
        dataList = doc.data();
      }
    });
    try {
      pc.setRemoteDescription(
        new RTCSessionDescription(JSON.parse(dataList.msg))
      );
    } catch (err) {
      console.log(err);
    }
  }
  //firebase로 내보내기
  async function sendSignalingMessage(msg) {
    const msgJSON = JSON.stringify(msg.sdp);
    if (msg.sdp.type === "offer" && msg.sdp) {
      offerMsg = msg;
      console.log("offer 성공!");
      setTimeout(() => {
        handleOffer({ data: msg.data });
      }, 500);
    } else if (msg.sdp.type === "answer") {
      answerMsg = msg;
      setTimeout(() => {
        getAnswer({ data: msg.data });
      }, 500);
      console.log("answer 성공!");
    }
    // const meetRef = doc(db, "offer", `${msg.data}`);
    addDoc(collection(db, `offer`), {
      type: msg.type,
      msg: msgJSON,
      data: msg.data,
      userId,
    });
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

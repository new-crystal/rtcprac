import { async } from "@firebase/util";
import { useEffect } from "react";
import { useRef } from "react";
import { db, pc } from "./server/firebase";
import {
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  addDoc,
  collection,
  query,
} from "firebase/firestore";
import { useState } from "react";
import { nanoid } from "nanoid";

const MeetTest = () => {
  const myVideo_ref = useRef();
  const yourVideo_ref = useRef();
  const call_ref = useRef();
  const [logined, setLogined] = useState(false);
  const [create, setCreate] = useState(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [roomId, setRoomId] = useState(null);

  useEffect(() => {
    if (create !== null) {
      getUserVideo();
    }
  }, [create, roomId]);

  const onClickCreateBtn = async () => {
    setLogined(true);
    setCreate(true);
    const callId = nanoid();
    setRoomId(callId);
    console.log(callId);
    // setTimeout(() => {
    //   getUserVideo();
    // }, 500);
  };

  const onClickJoinBtn = async () => {
    setLogined(true);
    setCreate(false);
    const callId = await call_ref.current.value;
    setRoomId(callId);
    // setTimeout(() => {
    //   getUserVideo();
    // }, 500);
  };
  //peerA
  //getUserMedia
  const getUserVideo = async () => {
    const localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    const remoteStream = new MediaStream();

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    myVideo_ref.current.srcObject = localStream;
    yourVideo_ref.current.srcObject = remoteStream;
    setWebcamActive(true);

    if (create === true) {
      createOffer();
    } else if (create === false) {
      remoteDes();
    }
  };

  //peerA createOffer
  const createOffer = async () => {
    const callDoc = doc(db, "calls", "call");

    setRoomId(callDoc.id);

    pc.onicecandidate = (event) => {
      event.candidate &&
        addDoc(collection(db, "offerCandidates"), event.candidate.toJSON());
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await setDoc(callDoc, { offer });

    const q = query(collection(db, "answerCandidates"));
    onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          console.log(change.doc.data());
          const data = change.doc.data();
          const candidate = new RTCIceCandidate(data);
          pc.addIceCandidate(candidate);
        }
      });
    });
  };

  const remoteDes = async () => {
    const callDoc = doc(db, "calls", "call");

    pc.onicecandidate = (event) => {
      event.candidate &&
        addDoc(collection(db, "answerCandidates"), event.candidate.toJSON());
    };

    const callSnap = await getDoc(callDoc);
    const callData = callSnap.data();

    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await updateDoc(callDoc, { answer });

    const q = query(collection(db, "offerCandidates"));
    onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          console.log(change.doc.data());
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  };
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
          <button onClick={onClickCreateBtn}>create</button>
          <input ref={call_ref} />
          <button onClick={onClickJoinBtn}>join</button>
        </div>
      )}

      {/* <button onClick={onClickEndBtn}>종료</button> */}
    </div>
  );
};

export default MeetTest;

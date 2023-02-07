import { async } from "@firebase/util";
import { useEffect } from "react";
import { useRef } from "react";
import { servers } from "./server/firebase";
import { db } from "./server/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useState } from "react";

const Meet = () => {
  const myVideo_ref = useRef();
  const yourVideo_ref = useRef();
  const call_ref = useRef();
  const [audio, setAudio] = useState(true);
  const [video, setVideo] = useState({ width: 300, height: 300 });

  const pc = new RTCPeerConnection(servers);
  let localStream = null;
  let remoteStream = null;

  const getVideo = async () => {
    //roomid
    let id = "ddd";
    let data = null;

    getDataList(id);

    getLocalStream();

    getRemoteStream();
  };

  // function getFirebase(data) {
  //   setAudio(data.audio);
  //   setVideo(data.video);
  // }

  // async function onClickEndBtn() {
  //   // referencing firebase collections
  //   const callDoc = db.collection("calls").doc();
  //   const offerCandidates = callDoc.collection("offerCandidates");
  //   const answerCandidiates = callDoc.collection("answerCandidates");
  //   // setting the input value to the calldoc id
  //   call_ref.current.value = callDoc.id;
  //   // get candidiates for caller and save to db
  //   pc.onicecandidate = (event) => {
  //     event.candidate && offerCandidates.add(event.candidate.toJSON());
  //   };
  //   // create offer
  //   const offerDescription = await pc.createOffer();
  //   await pc.setLocalDescription(offerDescription);
  //   // config for offer
  //   const offer = {
  //     sdp: offerDescription.sdp,
  //     type: offerDescription.type,
  //   };
  //   await callDoc.set({ offer });
  //   // listening to changes in firestore and update the streams accordingly
  //   callDoc.onSnapshot((snapshot) => {
  //     const data = snapshot.data();
  //     if (!pc.currentRemoteDescription && data.answer) {
  //       const answerDescription = new RTCSessionDescription(data.answer);
  //       pc.setRemoteDescription(answerDescription);
  //     }
  //     // if answered add candidates to peer connection
  //     answerCandidiates.onSnapshot((snapshot) => {
  //       snapshot.docChanges().forEach((change) => {
  //         if (change.type === "added") {
  //           const candidate = new RTCIceCandidate(change.doc.data());
  //           pc.addIceCandidate(candidate);
  //         }
  //       });
  //     });
  //   });
  //   // hangupButton.disabled = false;
  // }

  async function getDataList(id) {
    const dataList = await getDocs(collection(db, "meettingtest"));
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

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
  }

  async function getRemoteStream() {
    remoteStream = new MediaStream();

    yourVideo_ref.current.srcObject = remoteStream;

    myVideo_ref.current.onloadedmetadata = () => {
      myVideo_ref.current.play();
    };
    pc.ontrack = (event) => {
      event.streams[0].getTracks((track) => {
        remoteStream.addTrack(track);
      });
    };
  }

  const addPeople = async () => {
    //const callId = callInput.value;
    const callId = "dddd";
    // getting the data for this particular call
    //const callDoc = db.collection("meettingtest").doc(callId);

    const callDoc = collection(db, "meettingtest");

    const answerCandidates = doc(db, "meettingtest", "answerCandidates");
    const offerCandidates = doc(db, "meettingtest", "offerCandidates");

    //const answerCandidates = callDoc.collection("answerCandidates");
    // const offerCandidates = callDoc.collection("offerCandidates");

    // here we listen to the changes and add it to the answerCandidates
    pc.onicecandidate = (event) => {
      event.candidate && answerCandidates.add(event.candidate.toJSON());
    };

    // const callData = (await callDoc.get()).data();
    const callDataList = await getDoc(callDoc);
    console.log(callDataList);
    const callData = callDataList.data();

    // setting the remote video with offerDescription
    const offerDescription = callData.offer;
    console.log(offerDescription);
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    // setting the local video as the answer
    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(new RTCSessionDescription(answerDescription));

    // answer config
    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await callDoc.update({ answer });

    offerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  };

  useEffect(() => {
    getVideo();
    addPeople();
  }, []);

  return (
    <div>
      <input ref={call_ref} />
      <video ref={myVideo_ref}></video>
      <video ref={yourVideo_ref}></video>
      {/* <button onClick={onClickEndBtn}>종료</button> */}
    </div>
  );
};

export default Meet;

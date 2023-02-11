import { useRef } from "react";
import styled from "styled-components";
import { db, pc } from "./server/firebase";
import { push, ref, set, onValue, getDatabase } from "firebase/database";
import { database } from "./server/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { async } from "@firebase/util";
import { useEffect } from "react";

const Meet = () => {
  const myVideo_ref = useRef();
  const yourVideo_ref = useRef();
  const getData = getDatabase();
  const locate = ref(getData, "offer");
  const videoOption = { audio: false, video: true };

  let localStream = null;
  let remoteStream = null;

  const getLocalStream = async () => {
    localStream = await navigator.mediaDevices.getUserMedia(videoOption);
    myVideo_ref.current.srcObject = localStream;

    const offer = pc.createOffer();
    pc.setLocalDescription(offer);
    sendServer({ type: offer, sdp: pc.localDescription });

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
  };

  function sendServer(signal) {
    push(locate, signal);
  }

  useEffect(() => {
    getLocalStream();
  }, []);

  return (
    <Container>
      <Video autoPlay ref={myVideo_ref}></Video>
      <Video autoPlay ref={yourVideo_ref}></Video>
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  grid-template-columns: 300px 300px;
  grid-gap: 1rem;
`;

const Video = styled.video`
  width: 300px;
  height: 300px;
  background-color: lavender;
`;

export default Meet;

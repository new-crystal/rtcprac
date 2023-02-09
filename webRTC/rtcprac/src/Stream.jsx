import { useEffect, useState } from "react";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { useRef } from "react";
import { db, pc } from "./server/firebase";
import { async, uuidv4 } from "@firebase/util";

const Stream = () => {
  const video_ref = useRef();
  const screen_ref = useRef();
  const [audio, setAudio] = useState(false);
  const [video, setVideo] = useState(true);

  const data = {
    roomId: uuidv4(),
    userId: uuidv4(),
    audio,
    video,
  };

  const getUserVideo = async () => {
    if (video === true) {
      const containts = { audio, video: { width: 300, height: 300 } };
      try {
        let stream = await navigator.mediaDevices.getUserMedia(containts);
        video_ref.current.srcObject = stream;
        video_ref.current.onloadedmetadata = () => {
          video_ref.current.play();
        };
      } catch (err) {
        console.log(err);
      }
    }
    if (video === false) {
      const containts = { audio, video: { width: 300, height: 300 } };
      try {
        let stream = await navigator.mediaDevices.getUserMedia(containts);
        video_ref.current.srcObject = stream;
        video_ref.current.onloadedmetadata = () => {};
      } catch (err) {
        console.log(err);
      }
    }
  };

  useEffect(() => {
    getUserVideo();
  }, [audio, video]);

  const onClickSoundBtn = async () => {
    setAudio(!audio);
    await addDoc(collection(db, "meettingtest"), data);
  };

  const onClickVideoBtn = async () => {
    setVideo(!video);
    await addDoc(collection(db, "meettingtest"), data);
  };

  const onClickJoinBtn = async () => {
    let join = false;
    //useParams로 받아온 아이디
    let id = null;
    const dataList = await getDocs(collection(db, "meettingtest"));
    dataList.forEach((data) => {
      data.data().roomId === id ? (join = true) : (join = false);
    });
    //join ? navigate(`/meet/${id}`) : alert("입장하려는 방이 없습니다.")
  };

  //화면공유
  const onClickScreenBtn = async () => {
    let captureStream;
    try {
      captureStream = await navigator.mediaDevices.getDisplayMedia();
    } catch (err) {
      console.log(err);
    }
    return (screen_ref.current.srcObject = captureStream);
  };
  return (
    <div>
      <video
        style={{ width: "300px", height: "300px", backgroundColor: "lavender" }}
        ref={screen_ref}
        autoPlay
      ></video>
      <video controls ref={video_ref}></video>
      <button onClick={onClickSoundBtn}>sound</button>
      <button onClick={onClickVideoBtn}>camera</button>
      <button onClick={onClickScreenBtn}>screen</button>
      <button onClick={onClickJoinBtn}>join</button>
    </div>
  );
};

export default Stream;

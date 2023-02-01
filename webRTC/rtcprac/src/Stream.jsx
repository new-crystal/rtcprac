import { useEffect, useState } from "react";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { useRef } from "react";
import { db } from "./server/firebase";
import { async, uuidv4 } from "@firebase/util";

const Stream = () => {
  const video_ref = useRef();
  const [audio, setAudio] = useState(false);
  const [video, setVideo] = useState(true);
  const join = false;

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
    await addDoc(collection(db, "meetting-test"), data);
  };

  const onClickVideoBtn = async () => {
    setVideo(!video);
    await addDoc(collection(db, "meetting-test"), data);
  };

  const onClickJoinBtn = async () => {
    //useParams로 받아온 아이디
    let id = null;
    const dataList = await getDocs(collection(db, "meetting"));
    dataList.forEach((data) => {
      data.roomId === id ? (join = true) : (join = false);
    });
    //
    //join ? navigate(`/meet/${id}`) : alert("입장하려는 방이 없습니다.")
  };

  return (
    <div>
      <video controls ref={video_ref}></video>
      <button onClick={onClickSoundBtn}>sound</button>
      <button onClick={onClickVideoBtn}>camera</button>
      <button onClick={onClickJoinBtn}>join</button>
    </div>
  );
};

export default Stream;

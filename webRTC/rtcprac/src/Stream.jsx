import { useEffect, useState } from "react";
import { useRef } from "react";

const Stream = () => {
  const video_ref = useRef();
  const [audio, setAudio] = useState(false);
  const [video, setVideo] = useState(true);

  const getUserVideo = async () => {
    if (video === true) {
      const containts = { audio: audio, video: { width: 300, height: 300 } };
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
      const containts = { audio: audio, video: { width: 300, height: 300 } };
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

  const onClickSoundBtn = () => {
    setAudio(!audio);
  };

  const onClickVideoBtn = () => {
    setVideo(!video);
  };

  return (
    <div>
      <video ref={video_ref}></video>
      <button onClick={onClickSoundBtn}>sound</button>
      <button onClick={onClickVideoBtn}>camera</button>
    </div>
  );
};

export default Stream;

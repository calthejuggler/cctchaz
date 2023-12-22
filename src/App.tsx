import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Button } from "./components/Button.tsx";

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          width: {
            ideal: 1920,
            min: 1280,
          },
          height: {
            ideal: 1080,
            min: 720,
          },
        },
      })
      .then((stream) => {
        if (video === null) {
          return;
        }
        video.srcObject = stream;
        video.play();
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const processPhoto = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video === null || canvas === null) {
        return;
      }
      const context = canvas.getContext("2d");
      if (context === null) {
        return;
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const data = canvas.toDataURL("image/png");

      invoke("receive_photo", { photo: data })
        .then((res) => {
          if (imageRef.current === null || typeof res !== "string") {
            return;
          }
          imageRef.current.src = res;
        })
        .catch(console.error);
    };

    const interval = setInterval(processPhoto, 1000);

    if (!isStarted) {
      clearInterval(interval);
      return;
    }

    return () => {
      clearInterval(interval);
    };
  }, [isStarted]);

  return (
    <main className="mt-8">
      <section
        className={"grid grid-cols-2 items-center justify-center px-24 pt-24"}
      >
        <video
          ref={videoRef}
          autoPlay
          className={"border-foreground w-full border-2"}
        />
        <img
          ref={imageRef}
          className={"border-foreground w-full border-2"}
          alt={""}
        />
        <canvas ref={canvasRef} className={"invisible"} />
      </section>
      <Button
        onClick={() => {
          setIsStarted((prev) => !prev);
        }}
      >
        {isStarted ? "Stop" : "Start"}
      </Button>
    </main>
  );
}

export default App;

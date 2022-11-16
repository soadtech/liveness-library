import mask from "../assets/mask.svg";
import { addExifInImg } from "./security";
import { initDevice } from "./index";
import { initFaceDetector, isModelsLoaded, loadingModelsFace, startDetectionFace } from "../libs/FaceDetector/NewRealisationFaceDetector";
const cameraPadding = 15;
const img = new Image();
img.src = mask;
let video;
let canvas;
let canvasCapture;
let specialCanvasElement;
let streamStop = false;
let videoStream;
let videoStreamCtx;
// let constraints: any;
let videoSize = {
  width: 0,
  height: 0
};
let modelPath;
let probabilityThreshold;
// @ts-ignore
let isMultiframe;
let faceDetection;
let isMobile;
let showMask;
// @ts-ignore
let closeCamera;
let autoCapturingCallback;
let videoStarted;
let faceDetectionErrors;
let device = initDevice();
export const initVideo = (_modelPath, _probabilityThreshold, _videoElement, _canvasElement, _canvasCapture, _specialCanvasElement, _isMultiframe, _faceDetection, _isMobile, _showMask, _closeCameraCallback, _autoCapturingCallback, _faceDetectionErrors, _videoStartedCallback) => {
  modelPath = _modelPath;
  video = _videoElement;
  canvas = _canvasElement;
  canvasCapture = _canvasCapture;
  specialCanvasElement = _specialCanvasElement;
  isMultiframe = _isMultiframe;
  faceDetection = _faceDetection;
  isMobile = _isMobile;
  showMask = _showMask;
  closeCamera = _closeCameraCallback;
  autoCapturingCallback = _autoCapturingCallback;
  faceDetectionErrors = _faceDetectionErrors;
  probabilityThreshold = _probabilityThreshold;
  videoStarted = _videoStartedCallback;
};
export const initStream = (stream) => {
  startStream(stream);
  updateCanvasSize();
  video.addEventListener("canplay", function () {
    // videoStreamCtx = canvas.getContext("2d");
    // requestAnimationFrame(drawOnCanvas);
    if (showMask)
      drawMask();
  }, false);
};
export const drawOnCanvas = () => {
  if (streamStop)
    return;
  updateCanvasSize();
  videoStreamCtx.clearRect(0, 0, videoSize.width, videoSize.height);
  videoStreamCtx.drawImage(video, cameraPadding, cameraPadding, videoSize.width - cameraPadding * 2, videoSize.height - cameraPadding * 2, 0, 0, videoSize.width, videoSize.height);
  if (showMask)
    drawMask();
  requestAnimationFrame(drawOnCanvas);
};
export const drawMask = () => {
  // const canvas = canvas;
  updateCnvSize(canvas);
  const videoStreamCtx = canvas.getContext("2d");
  const hRatio = canvas.width / img.width;
  const vRatio = canvas.height / img.height;
  const ratio = Math.min(hRatio, vRatio);
  const portraitOrientation = canvas.width < canvas.height;
  const paddingX = 40;
  const paddingY = portraitOrientation ? 100 : 40;
  const centerShift_x = (canvas.width - img.width * ratio) / 2;
  const centerShift_y = (canvas.height - img.height * ratio) / 2;
  videoStreamCtx.drawImage(img, 0, 0, img.width, img.height, centerShift_x + paddingX, centerShift_y + paddingY, (img.width * ratio) - paddingX * 2, (img.height * ratio) - paddingY * 2);
};
const updateCanvasSize = () => {
  videoSize = { width: video.videoWidth, height: video.videoHeight };
  canvas.width = videoSize.width;
  canvas.height = videoSize.height;
};
const updateCnvSize = (_canvas) => {
  videoSize = { width: video.videoWidth, height: video.videoHeight };
  _canvas.width = videoSize.width;
  _canvas.height = videoSize.height;
};
export const startStream = (stream) => {
  if (videoStream)
    videoStream.getTracks().forEach((track) => track.stop());
  videoStream = stream;
  if ("srcObject" in video) {
    video.srcObject = stream;
  }
  else {
    // @ts-ignore
    video.src = window.URL.createObjectURL(stream);
  }
  video.play().then(() => {
    // Events.cameraReadyEvent();
    if (faceDetection) {
      // main();
      startDetection()
        .then(() => {
        videoStarted();
      });
    }
    else {
      videoStarted();
    }
  });
};
export const pauseStream = () => {
  video.pause();
};
export const startDetection = async () => {
  const startTime = performance.now();
  initFaceDetector(video, canvasCapture, isMobile, callbackCapturing, callbackErrors, specialCanvasElement);
  updateCnvSize(specialCanvasElement);
  if (!isModelsLoaded()) {
    await loadingModels(modelPath);
  }
  startDetectionFace(video, false, probabilityThreshold);
  console.log(`start time: ${(performance.now() - startTime).toFixed(3)}`);
};
export const playStream = () => {
  video.play();
};
export const loadingModels = async (path) => {
  await loadingModelsFace(path ? path : modelPath);
};
export const callbackCapturing = () => {
  autoCapturingCallback();
};
export const callbackErrors = (e) => {
  faceDetectionErrors(e);
};
export const dropStream = (isCloseCamera = false) => {
  streamStop = true;
  if (isCloseCamera && videoStream && videoStream.getTracks) {
    videoStream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  }
};
export const resolutionStream = () => {
  streamStop = false;
};
export const getFrame = (context, timeout) => {
  return new Promise(resolve => {
    setTimeout(() => {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvasCapture.toBlob((frame) => {
        if (!device.isIos) {
          addExifInImg(frame, videoStream.getTracks()[0], videoSize).then(updatedFrame => resolve(updatedFrame));
        }
        else {
          resolve(frame);
        }
      }, "image/jpeg", 1);
    }, timeout);
  });
};
export const takePhoto = (isMultiframe) => {
  return new Promise(async (resolve, rejected) => {
    const context = canvasCapture.getContext("2d");
    const delay = isMultiframe ? 100 : 0;
    canvasCapture.width = video.videoWidth;
    canvasCapture.height = video.videoHeight;
    let frames = [];
    if (isMultiframe) {
      for (let i = 0; i < 10; i++) {
        if (streamStop)
          rejected();
        frames.push(await getFrame(context, delay));
      }
    }
    else {
      pauseStream();
      frames.push(await getFrame(context, delay));
    }
    resolve(frames);
  });
};

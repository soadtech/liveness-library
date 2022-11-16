import * as faceapi from "@vladmandic/face-api/dist/face-api.esm.js";
import base64Photo from "../../assets/photoToStartTheDetector";
import { getVideoRatio } from "../../helpers/canvas";
import { drawFaces } from "../../helpers/webcam";
import { HeadPosition } from "./HeadPosition";
// @ts-ignore
const cv = window.cv;
let video; // video element
let canvas;
const MAX_NUMBER_FACES = 1;
const MAX_ANGLE_TURN_HEAD = 30;
const MIN_FACE_SIZE_FOR_MOBILE = 224;
const MIN_FACE_SIZE_FOR_DESKTOP = 350;
const MIN_OCCUPIED_SPACE_FOR_DESKTOP = 15;
const MIN_OCCUPIED_SPACE_FOR_MOBILE = 15;
const DEFAULT_PROBABILITY_THRESHOLD = 50;
const X_OFFSET_FROM_FRAME = 15;
const Y_OFFSET_FROM_FRAME = 55;
const detectionTimeCounter = 3;
let videoRatio;
let canvasForDetection;
let isMobile;
let callbackCapturing;
let callbackErrors;
let requestAnimation;
let counterSuccessfulResults = 0;
let DEFAULT_NUMBER_SUCCESSFUL_RESULTS_FOR_AUTO_CAPTURING = 20;
let detectionTime = -1;
let savedShowDetectedFace;
let savedProbabilityThreshold;
let headPosition;
let headTurnCounter = 0;
let counterSuccessfulHeadTurns = 0;
const minScore = 0.2; // minimum score
const maxResults = 5; // maximum number of results to return
const optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({ minConfidence: minScore, maxResults, inputSize: 192 });
const tinyFaceDetectorOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 192 });
const lightModels = true;
export const loadingModelsFace = async (modelPath) => {
  // if (!faceapi.nets.tinyFaceDetector.isLoaded)
  //   await faceapi
  //     .loadTinyFaceDetectorModel(modelPath)
  //     .then(() => {
  //       console.log(`loadTinyFaceDetectorModel loaded`);
  //     })
  //     .catch(e => {
  //       console.log(e);
  //     });
  // if (!faceapi.nets.faceLandmark68TinyNet.isLoaded)
  //   await faceapi
  //     .loadFaceLandmarkTinyModel(modelPath)
  //     .then(() => {
  //       console.log(`FaceLandmarkModel loaded`);
  //     })
  //     .catch(e => {
  //       console.log(e);
  //     });
  await faceapi.tf.setBackend('webgl');
  await faceapi.tf.enableProdMode();
  await faceapi.tf.ENV.set('DEBUG', false);
  await faceapi.tf.ready();
  if (lightModels) {
    await faceapi.nets.tinyFaceDetector.load(modelPath);
    await faceapi.nets.faceLandmark68TinyNet.load(modelPath);
    console.log("tinyFaceDetector detector");
  }
  else {
    await faceapi.nets.ssdMobilenetv1.load(modelPath);
    await faceapi.nets.faceLandmark68Net.load(modelPath);
    console.log("ssdMobilenetv1 detector");
  }
  // await faceapi.nets.tinyFaceDetector.load(modelPath);
  // await faceapi.nets.faceLandmark68TinyNet.load(modelPath);
  // console.log("tinyFaceDetector detector")
  // if (!cv)
  //   console.error("open cv not found")
  //
  //
  // Events.loadedModels({
  //   tinyFaceDetectorLoaded: faceapi.nets.tinyFaceDetector.isLoaded,
  //   faceLandmark68TinyNetLoaded: faceapi.nets.faceLandmark68TinyNet.isLoaded
  // });
  // const startTime = performance.now();
  //
  await initDetector();
  alert("detector init");
  //
  // Events.detectorInitialized(performance.now() - startTime);
};
export const initDetector = async () => {
  const image = new Image();
  image.src = base64Photo;
  // await faceapi.detectAllFaces(image, tinyFaceDetectorOptions).withFaceLandmarks(true);
  await faceapi.detectAllFaces(image, detectorOptions())
    .withFaceLandmarks(lightModels ? true : null);
  // .withFaceExpressions()
  // .withAgeAndGender()
};
const detectorOptions = () => {
  return lightModels ? tinyFaceDetectorOptions : optionsSSDMobileNet;
};
export const isModelsLoaded = () => {
  return (faceapi.nets.ssdMobilenetv1.isLoaded && faceapi.nets.faceLandmark68Net.isLoaded)
    ||
      (faceapi.nets.tinyFaceDetector.isLoaded && faceapi.nets.faceLandmark68TinyNet.isLoaded);
};
export const initFaceDetector = (_video, _canvas, _isMobile, _callbackCapturing, _callbackErrors, _canvasForDetection) => {
  video = _video;
  canvas = _canvas;
  canvasForDetection = _canvasForDetection;
  isMobile = _isMobile;
  callbackCapturing = _callbackCapturing;
  callbackErrors = _callbackErrors;
  videoRatio = getVideoRatio(video);
};
export const startDetectionFace = (_video, showDetectedFace = false, probabilityThreshold = DEFAULT_PROBABILITY_THRESHOLD) => {
  video = _video;
  if (!video)
    throw Error("Video element not found");
  if (video.clientWidth === 0)
    throw Error("Video element too small");
  if (!canvas)
    throw Error("Canvas element not found");
  // if (!faceapi.nets.tinyFaceDetector.isLoaded) throw Error("tinyFaceDetector not loaded");
  // if (!faceapi.nets.faceLandmark68TinyNet.isLoaded) throw Error("faceLandmark68TinyNet not loaded");
  canvasScaling(canvas, video);
  counterSuccessfulResults = 0;
  savedShowDetectedFace = showDetectedFace;
  savedProbabilityThreshold = probabilityThreshold;
  requestAnimation = requestAnimationFrame(() => detection(showDetectedFace, probabilityThreshold));
};
export const canvasScaling = (canvas, video) => {
  const cRatio = videoRatio;
  const cWidth = video.videoWidth * cRatio;
  const cHeight = video.videoHeight * cRatio;
  const oldWidth = video.clientWidth;
  const oldHeight = video.clientHeight;
  const xPadding = (oldWidth - cWidth) / 2;
  const yPadding = (oldHeight - cHeight) / 2;
  canvas.width = cWidth;
  canvas.height = cHeight;
  canvas.style.width = `${cWidth}px`;
  canvas.style.height = `${cHeight}px`;
  canvas.style.left = `${xPadding}px`;
  canvas.style.top = `${yPadding}px`;
};
export const resumeDetection = () => {
  counterSuccessfulResults = 0;
  requestAnimation = requestAnimationFrame(() => detection(savedShowDetectedFace, savedProbabilityThreshold));
};
export const detection = async (showDetectedFace, probabilityThreshold) => {
  // const t0 = performance.now();
  const startTime = performance.now();
  faceapi
    // .detectAllFaces(video, tinyFaceDetectorOptions)
    .detectAllFaces(video, detectorOptions())
    .withFaceLandmarks(lightModels ? true : null)
    .then((detections) => {
    if (canvasForDetection)
      drawFaces(canvasForDetection, detections, (performance.now() - startTime).toLocaleString());
    // canvasScaling(canvasForDetection, video)
    const detectionFacesForSize = faceapi.resizeResults(detections, {
      width: video.videoWidth,
      height: video.videoHeight,
    });
    const pipelineResults = {};
    const faceDetection = checkNumberFaces(detectionFacesForSize);
    pipelineResults["FACE_NOT_FOUND"] = !faceDetection && detectionFacesForSize.length === 0;
    pipelineResults["TOO_MANY_FACES"] = !faceDetection && detectionFacesForSize.length > MAX_NUMBER_FACES;
    if (faceDetection) {
      // if (cv)
      //   pipelineResults["FACE_ANGLE_TOO_LARGE"] = !checkHeadRotation(detectionFacesForSize);
      pipelineResults["PROBABILITY_TOO_SMALL"] = !checkProbability(detectionFacesForSize, probabilityThreshold);
      pipelineResults["FACE_TOO_SMALL"] = !checkFaceSize(detectionFacesForSize);
      pipelineResults["FACE_CLOSE_TO_BORDER"] = !checkFaceIndent(detectionFacesForSize);
    }
    if (Object.values(pipelineResults).every(v => !v)) {
      counterSuccessfulResults++;
      autoCapturing();
    }
    else {
      // clearCanvas();
      counterSuccessfulResults = 0;
      callbackErrors(pipelineResults);
    }
    // if (showDetectedFace) {
    //   faceapi.draw.drawDetections(this.canvas, detectionFacesForSize);
    //   faceapi.draw.drawFaceLandmarks(this.canvas, detectionFacesForSize);
    //   if (faceDetection) this.headPosition.draw(this.canvas.getContext("2d"));
    // }
    const leadTime = (performance.now() - startTime).toFixed(3);
    setDetectionTime(leadTime);
    requestAnimationFrame(() => detection(showDetectedFace, probabilityThreshold));
    return true;
  })
    .catch((err) => {
    alert(`Detect Error: ${err}`); // TODO
    // requestAnimationFrame(() => detection(showDetectedFace, probabilityThreshold));
    return false;
  });
  return false;
  // if (!requestAnimation) return;
};
// @ts-ignore
const checkHeadRotation = (detectionResult) => {
  const dims = faceapi.matchDimensions(canvas, video, true);
  headPosition = new HeadPosition(detectionResult[0].landmarks.positions, dims);
  let angles = [0, 0, 0];
  try {
    angles = headPosition.estimateHeadPose();
  }
  catch (e) {
    console.error("some error with open cv");
  }
  if (angles[2] > MAX_ANGLE_TURN_HEAD || angles[2] * -1 > MAX_ANGLE_TURN_HEAD) {
    headTurnCounter++;
  }
  else {
    counterSuccessfulHeadTurns++;
    if (counterSuccessfulHeadTurns >= 5) {
      headTurnCounter = 0;
      counterSuccessfulHeadTurns = 0;
    }
  }
  return headTurnCounter <= 1;
};
export const autoCapturing = () => {
  if (detectionTime > detectionTimeCounter) {
    const frameRate = 1000 / detectionTime;
    const needSuccessfulResults = frameRate > DEFAULT_NUMBER_SUCCESSFUL_RESULTS_FOR_AUTO_CAPTURING
      ? DEFAULT_NUMBER_SUCCESSFUL_RESULTS_FOR_AUTO_CAPTURING
      : frameRate;
    if (counterSuccessfulResults >= needSuccessfulResults) {
      callbackCapturing();
      stopDetection();
    }
  }
};
export const stopDetection = () => {
  if (requestAnimation) {
    cancelAnimationFrame(requestAnimation);
    requestAnimation = undefined;
  }
};
export const setDetectionTime = (leadTime) => {
  if (detectionTime === detectionTimeCounter)
    detectionTime = +leadTime;
  if (detectionTime < detectionTimeCounter)
    detectionTime++;
};
export const checkNumberFaces = (detectionResult) => {
  return detectionResult.length === MAX_NUMBER_FACES;
};
export const clearCanvas = () => {
  if (canvas) {
    const context = canvas.getContext("2d");
    if (context)
      context.clearRect(0, 0, canvas.width, canvas.height);
  }
};
export const checkProbability = (detectionResult, probabilityThreshold) => {
  const score = detectionResult[0].detection.score;
  if (probabilityThreshold) {
    return score > +probabilityThreshold / 100;
  }
  else {
    throw Error("probabilityThreshold not found");
  }
};
export const checkFaceSize = (detectionResult) => {
  const faceBox = detectionResult[0].detection.box;
  const { width, height, area } = faceBox;
  const { imageHeight, imageWidth } = detectionResult[0].detection;
  const occupiedSize = 100 / ((imageHeight * imageWidth) / area);
  const minSide = Math.min(width / videoRatio, height / videoRatio);
  return (minSide > (isMobile ? MIN_FACE_SIZE_FOR_MOBILE : MIN_FACE_SIZE_FOR_DESKTOP) &&
    occupiedSize > (isMobile ? MIN_OCCUPIED_SPACE_FOR_MOBILE : MIN_OCCUPIED_SPACE_FOR_DESKTOP));
};
export const checkFaceIndent = (detectionResult) => {
  const faceBox = detectionResult[0].detection.box;
  const { imageHeight, imageWidth } = detectionResult[0].detection;
  const { top, left, bottom, right } = faceBox;
  const topIndent = top;
  const leftIndent = left;
  const rightIndent = imageWidth - right;
  const bottomIndent = imageHeight - bottom;
  return !(topIndent < Y_OFFSET_FROM_FRAME ||
    leftIndent < X_OFFSET_FROM_FRAME ||
    rightIndent < X_OFFSET_FROM_FRAME ||
    bottomIndent < Y_OFFSET_FROM_FRAME);
};
export var PipelineResultsMessage;
(function (PipelineResultsMessage) {
  PipelineResultsMessage["FACE_NOT_FOUND"] = "face not found";
  PipelineResultsMessage["TOO_MANY_FACES"] = "too many faces";
  PipelineResultsMessage["FACE_ANGLE_TOO_LARGE"] = "face angle too large";
  PipelineResultsMessage["PROBABILITY_TOO_SMALL"] = "probability too small";
  PipelineResultsMessage["FACE_TOO_SMALL"] = "face too small";
  PipelineResultsMessage["FACE_CLOSE_TO_BORDER"] = "too close to the frame";
})(PipelineResultsMessage || (PipelineResultsMessage = {}));

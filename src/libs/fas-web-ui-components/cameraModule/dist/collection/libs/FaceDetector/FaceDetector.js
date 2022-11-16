// import * as faceapi from "face-api.js";
import * as faceapi from "@vladmandic/face-api";
// @ts-ignore
const cv = window.cv;
import { videoRatio } from "../../helpers/canvas";
import { HeadPosition } from "./HeadPosition";
import Events from "../../helpers/Events";
import base64Photo from "../../assets/photoToStartTheDetector";
export class FaceDetector {
  constructor(video, canvas, isMobile, callbackCapturing, callbackErrors) {
    this.MAX_NUMBER_FACES = 1;
    this.MAX_ANGLE_TURN_HEAD = 30;
    this.MIN_FACE_SIZE_FOR_MOBILE = 224;
    this.MIN_FACE_SIZE_FOR_DESKTOP = 350;
    this.MIN_OCCUPIED_SPACE_FOR_DESKTOP = 15;
    this.MIN_OCCUPIED_SPACE_FOR_MOBILE = 15;
    this.DEFAULT_PROBABILITY_THRESHOLD = 50;
    this.X_OFFSET_FROM_FRAME = 15;
    this.Y_OFFSET_FROM_FRAME = 55;
    this.detectionTimeCounter = 3;
    this.counterSuccessfulResults = 0;
    this.headTurnCounter = 0;
    this.counterSuccessfulHeadTurns = 0;
    this.DEFAULT_NUMBER_SUCCESSFUL_RESULTS_FOR_AUTO_CAPTURING = 20;
    this.detectionTime = -1;
    this.video = video;
    this.canvas = canvas;
    this.isMobile = isMobile;
    this.callbackCapturing = callbackCapturing;
    this.callbackErrors = callbackErrors;
    this.videoRatio = videoRatio(video);
  }
  static getInstance(video, canvas, isMobile, callbackCapturing, callbackErrors) {
    if (!FaceDetector.instance) {
      if (!video)
        console.error("video not found");
      if (!canvas)
        console.error("canvas not found");
      if (!isMobile)
        console.error("isMobile not found");
      if (!callbackCapturing)
        console.error("callbackCapturing not found");
      if (!callbackErrors)
        console.error("callbackErrors not found");
      FaceDetector.instance = new FaceDetector(video, canvas, isMobile, callbackCapturing, callbackErrors);
    }
    return FaceDetector.instance;
  }
  static async loadingModels(modelPath) {
    if (!faceapi.nets.tinyFaceDetector.isLoaded)
      await faceapi
        .loadTinyFaceDetectorModel(modelPath)
        .then(() => {
        console.log(`loadTinyFaceDetectorModel loaded`);
      })
        .catch(e => {
        console.log(e);
      });
    if (!faceapi.nets.faceLandmark68TinyNet.isLoaded)
      await faceapi
        .loadFaceLandmarkTinyModel(modelPath)
        .then(() => {
        console.log(`FaceLandmarkModel loaded`);
      })
        .catch(e => {
        console.log(e);
      });
    if (!cv)
      console.error("open cv not found");
    Events.loadedModels({
      tinyFaceDetectorLoaded: faceapi.nets.tinyFaceDetector.isLoaded,
      faceLandmark68TinyNetLoaded: faceapi.nets.faceLandmark68TinyNet.isLoaded
    });
    const startTime = performance.now();
    await this.initDetector();
    Events.detectorInitialized(performance.now() - startTime);
  }
  static hasInstance() {
    return typeof FaceDetector.instance !== "undefined";
  }
  static isDeviceSupportBackend() {
    return true;
    // return faceapi.tf.getBackend() !== this.UNSUPPORTED_BACKEND;
  }
  static async initDetector() {
    const image = new Image();
    image.src = base64Photo;
    await faceapi.detectAllFaces(image, this.tinyFaceDetectorOptions).withFaceLandmarks(true);
  }
  isModelsLoaded() {
    return faceapi.nets.tinyFaceDetector.isLoaded && faceapi.nets.faceLandmark68TinyNet.isLoaded;
  }
  startDetection(video, showDetectedFace = false, probabilityThreshold = this.DEFAULT_PROBABILITY_THRESHOLD) {
    this.video = video;
    if (!this.video)
      throw Error("Video element not found");
    if (this.video.clientWidth === 0)
      throw Error("Video element too small");
    if (!this.canvas)
      throw Error("Canvas element not found");
    if (!faceapi.nets.tinyFaceDetector.isLoaded)
      throw Error("tinyFaceDetector not loaded");
    if (!faceapi.nets.faceLandmark68TinyNet.isLoaded)
      throw Error("faceLandmark68TinyNet not loaded");
    this.canvasScaling(this.canvas, this.video);
    this.counterSuccessfulResults = 0;
    this.savedShowDetectedFace = showDetectedFace;
    this.savedProbabilityThreshold = probabilityThreshold;
    this.requestAnimation = requestAnimationFrame(() => this.detection(showDetectedFace, probabilityThreshold));
  }
  resumeDetection() {
    this.counterSuccessfulResults = 0;
    this.requestAnimation = requestAnimationFrame(() => this.detection(this.savedShowDetectedFace, this.savedProbabilityThreshold));
  }
  async detection(showDetectedFace, probabilityThreshold) {
    if (!this.requestAnimation)
      return;
    const startTime = performance.now();
    let detections = await faceapi
      .detectAllFaces(this.video, FaceDetector.tinyFaceDetectorOptions)
      .withFaceLandmarks(true);
    const detectionFacesForSize = faceapi.resizeResults(detections, {
      width: this.video.videoWidth,
      height: this.video.videoHeight,
    });
    const pipelineResults = {};
    const faceDetection = this.checkNumberFaces(detectionFacesForSize);
    pipelineResults["FACE_NOT_FOUND"] = !faceDetection && detectionFacesForSize.length === 0;
    pipelineResults["TOO_MANY_FACES"] = !faceDetection && detectionFacesForSize.length > this.MAX_NUMBER_FACES;
    if (faceDetection) {
      // if (cv)
      //   pipelineResults["FACE_ANGLE_TOO_LARGE"] = !this.checkHeadRotation(detectionFacesForSize);
      pipelineResults["PROBABILITY_TOO_SMALL"] = !this.checkProbability(detectionFacesForSize, probabilityThreshold);
      pipelineResults["FACE_TOO_SMALL"] = !this.checkFaceSize(detectionFacesForSize);
      pipelineResults["FACE_CLOSE_TO_BORDER"] = !this.checkFaceIndent(detectionFacesForSize);
    }
    if (Object.values(pipelineResults).every(v => !v)) {
      this.counterSuccessfulResults++;
      this.autoCapturing();
    }
    else {
      this.clearCanvas();
      this.counterSuccessfulResults = 0;
      this.callbackErrors(pipelineResults);
    }
    // if (showDetectedFace) {
    //   faceapi.draw.drawDetections(this.canvas, detectionFacesForSize);
    //   faceapi.draw.drawFaceLandmarks(this.canvas, detectionFacesForSize);
    //   if (faceDetection) this.headPosition.draw(this.canvas.getContext("2d"));
    // }
    const leadTime = (performance.now() - startTime).toFixed(3);
    this.setDetectionTime(leadTime);
    requestAnimationFrame(() => this.detection(showDetectedFace, probabilityThreshold));
  }
  setDetectionTime(leadTime) {
    if (this.detectionTime === this.detectionTimeCounter)
      this.detectionTime = +leadTime;
    if (this.detectionTime < this.detectionTimeCounter)
      this.detectionTime++;
  }
  canvasScaling(canvas, video) {
    const cRatio = this.videoRatio;
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
  }
  stopDetection() {
    if (this.requestAnimation) {
      cancelAnimationFrame(this.requestAnimation);
      this.requestAnimation = undefined;
    }
  }
  clearCanvas() {
    const context = this.canvas.getContext("2d");
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  autoCapturing() {
    if (this.detectionTime > this.detectionTimeCounter) {
      const frameRate = 1000 / this.detectionTime;
      const needSuccessfulResults = frameRate > this.DEFAULT_NUMBER_SUCCESSFUL_RESULTS_FOR_AUTO_CAPTURING
        ? this.DEFAULT_NUMBER_SUCCESSFUL_RESULTS_FOR_AUTO_CAPTURING
        : frameRate;
      if (this.counterSuccessfulResults >= needSuccessfulResults) {
        this.callbackCapturing();
        this.stopDetection();
      }
    }
  }
  checkHeadRotation(detectionResult) {
    const dims = faceapi.matchDimensions(this.canvas, this.video, true);
    this.headPosition = new HeadPosition(detectionResult[0].landmarks.positions, dims);
    let angles = [0, 0, 0];
    try {
      angles = this.headPosition.estimateHeadPose();
    }
    catch (e) {
      console.error("some error with open cv");
    }
    if (angles[2] > this.MAX_ANGLE_TURN_HEAD || angles[2] * -1 > this.MAX_ANGLE_TURN_HEAD) {
      this.headTurnCounter++;
    }
    else {
      this.counterSuccessfulHeadTurns++;
      if (this.counterSuccessfulHeadTurns >= 5) {
        this.headTurnCounter = 0;
        this.counterSuccessfulHeadTurns = 0;
      }
    }
    return this.headTurnCounter <= 1;
  }
  checkProbability(detectionResult, probabilityThreshold) {
    const score = detectionResult[0].detection.score;
    if (probabilityThreshold) {
      return score > +probabilityThreshold / 100;
    }
    else {
      throw Error("probabilityThreshold not found");
    }
  }
  checkNumberFaces(detectionResult) {
    return detectionResult.length === this.MAX_NUMBER_FACES;
  }
  checkFaceSize(detectionResult) {
    const faceBox = detectionResult[0].detection.box;
    const { width, height, area } = faceBox;
    const { imageHeight, imageWidth } = detectionResult[0].detection;
    const occupiedSize = 100 / ((imageHeight * imageWidth) / area);
    const minSide = Math.min(width / this.videoRatio, height / this.videoRatio);
    return (minSide > (this.isMobile ? this.MIN_FACE_SIZE_FOR_MOBILE : this.MIN_FACE_SIZE_FOR_DESKTOP) &&
      occupiedSize > (this.isMobile ? this.MIN_OCCUPIED_SPACE_FOR_MOBILE : this.MIN_OCCUPIED_SPACE_FOR_DESKTOP));
  }
  checkFaceIndent(detectionResult) {
    const faceBox = detectionResult[0].detection.box;
    const { imageHeight, imageWidth } = detectionResult[0].detection;
    const { top, left, bottom, right } = faceBox;
    const topIndent = top;
    const leftIndent = left;
    const rightIndent = imageWidth - right;
    const bottomIndent = imageHeight - bottom;
    return !(topIndent < this.Y_OFFSET_FROM_FRAME ||
      leftIndent < this.X_OFFSET_FROM_FRAME ||
      rightIndent < this.X_OFFSET_FROM_FRAME ||
      bottomIndent < this.Y_OFFSET_FROM_FRAME);
  }
}
FaceDetector.tinyFaceDetectorOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 192 });
export var PipelineResultsMessage;
(function (PipelineResultsMessage) {
  PipelineResultsMessage["FACE_NOT_FOUND"] = "face not found";
  PipelineResultsMessage["TOO_MANY_FACES"] = "too many faces";
  PipelineResultsMessage["FACE_ANGLE_TOO_LARGE"] = "face angle too large";
  PipelineResultsMessage["PROBABILITY_TOO_SMALL"] = "probability too small";
  PipelineResultsMessage["FACE_TOO_SMALL"] = "face too small";
  PipelineResultsMessage["FACE_CLOSE_TO_BORDER"] = "too close to the frame";
})(PipelineResultsMessage || (PipelineResultsMessage = {}));

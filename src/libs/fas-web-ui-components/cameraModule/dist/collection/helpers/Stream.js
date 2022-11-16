import mask from "../assets/mask.svg";
import Events from "./Events";
import { Detector } from "../libs/FaceDetector/Detector";
import { addExifInImg } from "./security";
const img = new Image();
img.src = mask;
var ImageFormat;
(function (ImageFormat) {
  ImageFormat["JPEG"] = "image/jpeg";
  ImageFormat["PNG"] = "image/png";
})(ImageFormat || (ImageFormat = {}));
export class Stream {
  constructor(device, modelPath) {
    this.showMask = false;
    this.videoSize = { width: 0, height: 0 };
    this.streamPaused = false;
    this.pauseStream = () => {
      this.streamPaused = true;
      this.videoElement.pause();
      this.dropMask();
      if (this.faceDetection)
        Detector.getInstance().stopDetector();
    };
    this.device = device;
    this.detector = Detector.getInstance(this, device.isMobile, modelPath);
  }
  setShowMask(val) {
    this.showMask = val;
  }
  setFaceDetection(val) {
    this.faceDetection = val;
  }
  setProbabilityThreshold(val) {
    Detector.getInstance().setProbabilityThreshold(val);
  }
  setCallbackErrors(fun) {
    this.callbackErrors = fun;
  }
  setCallbackAutoCapturing(fun) {
    this.callbackAutoCapturing = fun;
  }
  setCallbackFaceDetectionErrors(fun) {
    this.callbackFaceDetectionErrors = fun;
  }
  static getInstance(device, modelPath) {
    if (!Stream.instance) {
      Stream.instance = new Stream(device, modelPath);
    }
    return Stream.instance;
  }
  returnErrors(errors) {
    this.callbackFaceDetectionErrors(errors);
  }
  autoCapturing() {
    this.callbackAutoCapturing();
  }
  updateHtmlElements(videoElement, canvasElement) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.detector.updateHtmlElements(videoElement);
  }
  async startDetection() {
    return this.detector.startDetector();
  }
  static orientationChange() {
    if (Stream.instance)
      Stream.getInstance().drawMask();
  }
  startStream(stream) {
    if (this.stream)
      this.stream.getTracks().forEach((track) => track.stop());
    this.stream = stream;
    if ("srcObject" in this.videoElement) {
      this.videoElement.srcObject = stream;
    }
    else {
      // @ts-ignore
      this.videoElement.src = window.URL.createObjectURL(stream);
    }
    this.videoElement.play().then(() => {
      this.streamPaused = false;
      Events.cameraReadyEvent();
      this.drawMask();
      if (this.faceDetection)
        this.startDetection();
    });
  }
  async initStream(stream) {
    this.startStream(stream);
  }
  async resumeStream() {
    this.streamPaused = false;
    await this.videoElement.play();
    this.drawMask();
    if (this.faceDetection)
      await Detector.getInstance().startDetector();
  }
  ;
  updateCanvasSize(canvas) {
    this.videoSize = { width: this.videoElement.videoWidth, height: this.videoElement.videoHeight };
    canvas.width = this.videoSize.width;
    canvas.height = this.videoSize.height;
  }
  dropStream() {
    if (!this.streamStopped) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.videoElement.srcObject = null;
    }
    if (this.faceDetection)
      Detector.getInstance().stopDetector();
  }
  streamStopped() {
    return !(this.stream && this.stream.getTracks && this.stream.getTracks().length > 0);
  }
  drawMask() {
    if (this.showMask && !this.streamPaused) {
      setTimeout(() => {
        this.updateCanvasSize(this.canvasElement);
        const canvas = this.canvasElement;
        const canvasCtx = canvas.getContext("2d");
        const hRatio = canvas.width / img.width;
        const vRatio = canvas.height / img.height;
        const ratio = Math.min(hRatio, vRatio);
        const portraitOrientation = canvas.width < canvas.height;
        const paddingX = (!portraitOrientation && this.device.isMobile) ? 50 : 100;
        const paddingY = portraitOrientation ? 200 : 100;
        const centerShift_x = (canvas.width - img.width * ratio) / 2;
        const centerShift_y = (canvas.height - img.height * ratio) / 2;
        canvasCtx.drawImage(img, 0, 0, img.width, img.height, centerShift_x + paddingX, centerShift_y + paddingY, (img.width * ratio) - paddingX * 2, (img.height * ratio) - paddingY * 2);
      }, 150);
    }
  }
  dropMask() {
    const canvas = this.canvasElement;
    const canvasCtx = canvas.getContext("2d");
    canvasCtx.clearRect(0, 0, 10000, 10000);
  }
  takePhoto() {
    return new Promise(async (resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = this.videoElement.videoWidth;
      canvas.height = this.videoElement.videoHeight;
      resolve([await this.getFrame(canvas)]);
    });
  }
  getFrame(canvas) {
    return new Promise(resolve => {
      const context = canvas.getContext("2d");
      context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((frame) => {
        if (frame.type === ImageFormat.JPEG && !this.device.isIos) {
          try {
            addExifInImg(frame, this.stream.getTracks()[0], this.videoSize).then(updatedFrame => resolve(updatedFrame));
          }
          catch (e) {
            resolve(frame);
            this.callbackErrors(e, false);
          }
        }
        else {
          resolve(frame);
        }
      }, ImageFormat.PNG, 1);
    });
  }
}
window.addEventListener("resize", Stream.orientationChange, false);
window.addEventListener("orientationchange", Stream.orientationChange, false);

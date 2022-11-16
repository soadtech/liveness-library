import { FaceDetection, FaceLandmarks68 } from "@vladmandic/face-api";
export declare class FaceDetector {
  private static instance;
  private static tinyFaceDetectorOptions;
  private readonly canvas;
  private video;
  private readonly MAX_NUMBER_FACES;
  private readonly MAX_ANGLE_TURN_HEAD;
  private readonly MIN_FACE_SIZE_FOR_MOBILE;
  private readonly MIN_FACE_SIZE_FOR_DESKTOP;
  private readonly MIN_OCCUPIED_SPACE_FOR_DESKTOP;
  private readonly MIN_OCCUPIED_SPACE_FOR_MOBILE;
  private readonly DEFAULT_PROBABILITY_THRESHOLD;
  private readonly X_OFFSET_FROM_FRAME;
  private readonly Y_OFFSET_FROM_FRAME;
  private readonly detectionTimeCounter;
  private readonly videoRatio;
  private readonly isMobile;
  private requestAnimation;
  private counterSuccessfulResults;
  private headTurnCounter;
  private counterSuccessfulHeadTurns;
  private DEFAULT_NUMBER_SUCCESSFUL_RESULTS_FOR_AUTO_CAPTURING;
  private detectionTime;
  private savedShowDetectedFace;
  private savedProbabilityThreshold;
  private headPosition;
  callbackCapturing: any;
  callbackErrors: any;
  private constructor();
  static getInstance(video?: any, canvas?: any, isMobile?: any, callbackCapturing?: any, callbackErrors?: any): FaceDetector;
  static loadingModels(modelPath: string): Promise<void>;
  static hasInstance(): boolean;
  static isDeviceSupportBackend(): boolean;
  static initDetector(): Promise<void>;
  isModelsLoaded(): boolean;
  startDetection(video: any, showDetectedFace?: boolean, probabilityThreshold?: number): void;
  resumeDetection(): void;
  detection(showDetectedFace: boolean, probabilityThreshold: number): Promise<void>;
  setDetectionTime(leadTime: string): void;
  canvasScaling(canvas: any, video: any): void;
  stopDetection(): void;
  clearCanvas(): void;
  autoCapturing(): void;
  checkHeadRotation(detectionResult: DetectWithLandmarks[]): boolean;
  checkProbability(detectionResult: DetectWithLandmarks[], probabilityThreshold: number): boolean;
  checkNumberFaces(detectionResult: DetectWithLandmarks[]): boolean;
  checkFaceSize(detectionResult: DetectWithLandmarks[]): boolean;
  checkFaceIndent(detectionResult: DetectWithLandmarks[]): boolean;
}
interface DetectWithLandmarks {
  alignedRect: FaceDetection;
  detection: FaceDetection;
  landmarks: FaceLandmarks68;
  unshiftedLandmarks: FaceLandmarks68;
}
export interface PipelineResults {
  FACE_NOT_FOUND?: boolean;
  TOO_MANY_FACES?: boolean;
  FACE_ANGLE_TOO_LARGE?: boolean;
  PROBABILITY_TOO_SMALL?: boolean;
  FACE_TOO_SMALL?: boolean;
  FACE_CLOSE_TO_BORDER?: boolean;
}
export declare enum PipelineResultsMessage {
  FACE_NOT_FOUND = "face not found",
  TOO_MANY_FACES = "too many faces",
  FACE_ANGLE_TOO_LARGE = "face angle too large",
  PROBABILITY_TOO_SMALL = "probability too small",
  FACE_TOO_SMALL = "face too small",
  FACE_CLOSE_TO_BORDER = "too close to the frame"
}
export interface LoadingModels {
  ssdMobilenetv1Loaded: boolean;
  faceLandmark68NetLoaded: boolean;
}
export {};

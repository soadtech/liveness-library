import { FaceDetection, FaceLandmarks68 } from "@vladmandic/face-api";
export declare const loadingModelsFace: (modelPath: string) => Promise<void>;
export declare const initDetector: () => Promise<void>;
export declare const isModelsLoaded: () => boolean;
export declare const initFaceDetector: (_video: any, _canvas: any, _isMobile: any, _callbackCapturing: any, _callbackErrors: any, _canvasForDetection: any) => void;
export declare const startDetectionFace: (_video: any, showDetectedFace?: boolean, probabilityThreshold?: number) => void;
export declare const canvasScaling: (canvas: any, video: any) => void;
export declare const resumeDetection: () => void;
export declare const detection: (showDetectedFace: boolean, probabilityThreshold: number) => Promise<boolean>;
export declare const autoCapturing: () => void;
export declare const stopDetection: () => void;
export declare const setDetectionTime: (leadTime: string) => void;
export declare const checkNumberFaces: (detectionResult: DetectWithLandmarks[]) => boolean;
export declare const clearCanvas: () => void;
export declare const checkProbability: (detectionResult: DetectWithLandmarks[], probabilityThreshold: number) => boolean;
export declare const checkFaceSize: (detectionResult: DetectWithLandmarks[]) => boolean;
export declare const checkFaceIndent: (detectionResult: DetectWithLandmarks[]) => boolean;
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

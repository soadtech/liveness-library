// @ts-ignore
import React, {useState, useRef, useEffect} from 'react';
// import './index.css';
import {ErrorFaceMessage} from "../../interfaces/ErrorFaceMessage";
import {ErrorFaceDetection} from "../../interfaces/ErrorFaceDetection";
import {SuccessFaceValidation} from "../../interfaces/SuccessFaceValidation";
import { applyPolyfills, defineCustomElements } from "../../libs/fas-web-ui-components/cameraModule/loader";

applyPolyfills().then(() => {
    defineCustomElements(window);
})
let countFetch = 1
interface AppProps {
    onSuccessResponse?: (result: SuccessFaceValidation) => void
    onFaceDetectionError?:  (result: ErrorFaceDetection) => void
    onErrorValidate?: (error: any) => void
    openOnLoad?: boolean
    urlServiceLiveness?: string
    codeTransaction?: string
}
function Liveness({
                      onSuccessResponse,
                      onFaceDetectionError,
                      onErrorValidate,
                      openOnLoad,
                      urlServiceLiveness,
                      codeTransaction
                  }: AppProps) {
    /*
    const [errorFace, setErrorFace] = useState<ErrorFaceMessage>({
        show: false,
        message: ''
    })
    const camera = useRef<HTMLHeadingElement>(null)
    function formatMessageError(error: ErrorFaceDetection) {
        const errorsMessages = {
            FACE_ANGLE_TOO_LARGE: 'Aleje el rostro un poco',
            FACE_CLOSE_TO_BORDER: 'Ubique su rostro en el ovalo',
            FACE_NOT_FOUND: 'No se ha dectectado ningún rostro',
            FACE_TOO_SMALL: 'Acerce su rostro al ovalo',
            PROBABILITY_TOO_SMALL: '',
            TOO_MANY_FACES: 'Multiples rostros detectadas',
        }
        const stateError: ErrorFaceMessage = {
            show: true,
            message: ''
        }
        if (error.FACE_NOT_FOUND) {
            stateError.message = errorsMessages.FACE_NOT_FOUND
        }
        if (error.FACE_CLOSE_TO_BORDER) {
            stateError.message = errorsMessages.FACE_CLOSE_TO_BORDER
        }
        if (error.FACE_ANGLE_TOO_LARGE) {
            stateError.message = errorsMessages.FACE_ANGLE_TOO_LARGE
        }
        if (error.FACE_TOO_SMALL) {
            stateError.message = errorsMessages.FACE_TOO_SMALL
        }
        if (error.TOO_MANY_FACES) {
            stateError.message = errorsMessages.TOO_MANY_FACES
        }

        setErrorFace(stateError)
    }

    // THE RESULT PRINT HERE
    // @ts-ignore
    async function responseCapture(event: any) {
        setErrorFace({show: true, message: 'Espere un momento...'})
        const blob = event.detail[0];
        let reader = new FileReader();
        let picture
        reader.readAsDataURL(blob);
        // @ts-ignore
        reader.onloadend = async function () {
            picture = reader.result;
            try {
                if (countFetch <= 3) {
                    countFetch++
                    const resp = await fetch(
                        `${urlServiceLiveness}/api/images/validateImage`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "apiKey": "CexMnVCV4I8Xz32Az467cVi1kauX8DFx"
                            },
                            body: JSON.stringify(
                                {
                                    "image": picture,
                                    "deviceType": "string"
                                }
                            )
                        }
                    );
                    const result = await resp.json()
                    setErrorFace({show: false, message: ''})
                    if (onSuccessResponse) {
                        onSuccessResponse(result)
                    }
                    if (countFetch === 3) {
                        closeCamera();
                    }
                } else {
                    closeCamera();
                    countFetch = 0
                }

            } catch (e) {
                closeCamera();
                if (onErrorValidate){
                    onErrorValidate(e)
                }
            }
        }
    }

    function handleError(event: any) {
        console.log(event.detail.error);
    }
    function handleDetectionError(event: any) {
        if (onFaceDetectionError) {
            onFaceDetectionError(event.detail.error)
        }
        formatMessageError(event.detail.error)
    }
    function detectorInitialized(event: any) {
        console.log(event.detail.initializationTime);
    }
    function openCamera() {
        const cameraModule = camera.current
        const event = new Event('openCamera');
        if (cameraModule !== null) {
            cameraModule.dispatchEvent(event)
        }
    }
    function closeCamera() {
        const cameraModule = camera.current
        const event = new Event('closeCamera')
        if (cameraModule !== null) {
            cameraModule.dispatchEvent(event)
        }
    }

    useEffect(() => {
        const cameraModule = camera.current
        if (cameraModule !== null) {
            // cameraModule.addEventListener("capture", handleCapture);
            cameraModule.addEventListener("error", handleError);
            cameraModule.addEventListener("detectionError", handleDetectionError);
            cameraModule.addEventListener("detectorInitialized", detectorInitialized);
            cameraModule.addEventListener("responseCapture", responseCapture);
        }
    }, [])
    useEffect(() => {
        if (openOnLoad){
            setTimeout(() => {
                openCamera()
            }, 2000)
        }
    }, [openOnLoad])*/
    return (
        <>

            <div className="wrapper-camera">
                {/*// @ts-ignore **/}
                <camera-component
                    show_mask="true"
                    background_color="#fff"
                    disable_control_panel="true"
                    stop_after_capturing="false"
                    face_detection="true"
                    debug="false"
                    logo_style='{"align-self": "end", "max-width": "300px"}'
                    model_path="./libs/fas-web-ui-components/cameraModule/assets/models/"
                    id="camera"
                >
                    {/*// @ts-ignore **/}
                </camera-component>
            </div>

            <button>Open camera</button>
        </>
    );
}

export default Liveness;

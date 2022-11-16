export default function openCamera() {
    const cameraModule = window.document.getElementById('camera')
    const event = new Event('openCamera');
    if (cameraModule !== null) {
        cameraModule.dispatchEvent(event)
    }
}

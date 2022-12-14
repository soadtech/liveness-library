'use strict';

const index = require('./index-c79eac2d.js');

/*
 Stencil Client Patch Browser v2.13.0 | MIT Licensed | https://stenciljs.com
 */
const patchBrowser = () => {
    const importMeta = (typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('fas-web-ui-component-camera.cjs.js', document.baseURI).href));
    const opts = {};
    if (importMeta !== '') {
        opts.resourcesUrl = new URL('.', importMeta).href;
    }
    return index.promiseResolve(opts);
};

patchBrowser().then(options => {
  return index.bootstrapLazy([["camera-comp_3.cjs",[[1,"camera-component",{"url_logo":[1],"show_mask":[1],"background_color":[1],"disable_control_panel":[1],"stop_after_capturing":[1],"face_detection":[1],"model_path":[1],"probability_threshold":[1],"debug":[1],"logo_style":[1],"_resolutionOnPhoto":[32],"_cameraStatus":[32],"_mobileMakePhoto":[32],"_stopAfterCapturing":[32],"_showMask":[32],"_disable_control_panel":[32],"_face_detection":[32],"_probabilityThreshold":[32],"_debug":[32],"video":[32],"canvas":[32]},[[0,"videoStarted","videoStarted"],[0,"retakePhoto","retakePhoto"],[0,"takePhoto","takePhoto"],[0,"openCamera","openCamera"],[0,"loadModels","loadModels"],[0,"errorCamera","errorCamera"],[0,"closeCamera","closeCamera"],[0,"makePhoto","makePhoto"]]],[0,"camera-comp",{"showMask":[4,"show-mask"],"modelPath":[1,"model-path"],"device":[16],"probabilityThreshold":[2,"probability-threshold"],"faceDetection":[4,"face-detection"]}],[0,"control-panel",{"mobile":[4],"disableControlPanel":[4,"disable-control-panel"],"cameraStatus":[2,"camera-status"],"resolutionOnPhoto":[4,"resolution-on-photo"],"mobileMakePhoto":[4,"mobile-make-photo"],"faceDetection":[4,"face-detection"]}]]]], options);
});

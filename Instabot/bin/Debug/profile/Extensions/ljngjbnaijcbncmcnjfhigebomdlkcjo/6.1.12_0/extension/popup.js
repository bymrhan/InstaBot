var port = chrome.extension.connect({name: "Sample Communication"});

var openedRecorder = false;
var recorderOpen = document.querySelector('.recorderButton');
var userEmail = 'Anonymous';

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.message === 'AttachRecorder') {
        openedRecorder = true;
    }
    if(request.message === 'DeattachRecorder') {
        openedRecorder = false;
    }
});

recorderOpen.addEventListener('click', function() {
    // if(openedRecorder) {
    //     port.postMessage({ name: 'active' });    

    //     return;
    // }
    openedRecorder = true;
    port.postMessage({ name: 'openRecorder' });

});

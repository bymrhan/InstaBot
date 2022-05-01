/**
 * Created by sanjay kumar on 5/12/16.
 */
/* global chrome */
"use strict";

var devtoolsRegEx = /^chrome-devtools:\/\//;
var connections = {};
var clickEnabled = true;
var master = {};
var API = chrome || browser;
var contentWindowId = '';

var messageToContentScript = function(message) {
    chrome.tabs.sendMessage(message.tabId, message);
};

chrome.runtime.onConnect.addListener(function(port) {
    var extensionListener = function(message, sender, sendResponse) {
        if(message && message.message === "DeattachRecorder") {
            clickEnabled = true;
        }
        if (message.name == "init") {
            connections[message.tabId] = port;
            return;
        }
        if(message.name == "active") {
            window.chrome.windows.update(contentWindowId,{
                focused: true
            });
        }
        else if(message.name == 'openRecorder') {
            if(!clickEnabled) {
                window.chrome.windows.update(contentWindowId,{
                    focused: true
                });
                return;
            }
            openPanel();
        } else{
            messageToContentScript(message);
        }
    }

    port.onMessage.addListener(extensionListener);

    port.onDisconnect.addListener(function(port) {
        port.onMessage.removeListener(extensionListener);

        var tabs = Object.keys(connections);
        for (var i = 0, len = tabs.length; i < len; i++) {
            if (connections[tabs[i]] == port) {
                delete connections[tabs[i]]
                break;
            }
        }
    });
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log(message, "ye chalOOOO")
    if(message && message.message === "AttachRecorder") {
        clickEnabled = false;
    }
    if(message && message.message === "DeattachRecorder") {
        clickEnabled = true;
    }
    if (sender.tab) {
        if (devtoolsRegEx.test(sender.tab.url)) {
            if(message.event==="shown" || message.event==="hidden"){
                var tabId = sender.tab.id;
                if (tabId in connections) {
                   connections[tabId].postMessage(message);
                } else {
                }
            }
            messageToContentScript(message);
        } else {
            var tabId = sender.tab.id;
            if (tabId in connections) {
                connections[tabId].postMessage(message);
            } else {
            }
        }
    } else {
    }
    return true;
});


function openPanel() {
    browser.windows.create({
        url: API.runtime.getURL("recorder/index.html"),
        type: "popup",
        height: 600,
        width: 400,
    }).then(function (panelWindowInfo) {
        master[panelWindowInfo.id] = panelWindowInfo;
        contentWindowId = panelWindowInfo.id;

        browser.tabs.sendMessage(contentWindowId, {
            type: "recorderId",
            recorderId: panelWindowInfo
        });

        browser.tabs.query({
            active: true,
            windowId: panelWindowInfo.id,
            status: "complete"
        }).then(function (tabs) {
            if (tabs.length != 1) {
                master[panelWindowInfo.id] = panelWindowInfo.id;
            }
        })
    }).catch(function (e) {
        console.log(e);
    });
}


// var installURL = "https://autonomiq.io/chropath/";
// var updateURL = "https://autonomiq.io/chropath/chropath-changelog/"
// var uninstallURL = "https://autonomiq.io/chropath/uninstall/";

// Global var to get details from manifest.json
const manifest = chrome.runtime.getManifest();
// Open survey form in new tab on uninstallation
// chrome.runtime.setUninstallURL(uninstallURL, () => { })

// Open ChroPath home page in new tab on installation
const installedListener = (details) => {
    if (details.reason == 'install') {
        installNotification();
        // chrome.notifications.onClicked.addListener(onClickInstallNoti);
        // chrome.tabs.create({
        //     url: installURL
        // })
    } else if (details.reason == 'update') {
        updateNotification();
        // chrome.notifications.onClicked.addListener(onClickNoti);
    }
}

// function onClickInstallNoti() { chrome.tabs.create({ url: installURL }) }
// function onClickNoti() { chrome.tabs.create({ url: updateURL }) }
const updateNotification = () => {
    chrome.notifications.create({
        title: `ChroPath`,
        message: `Click here to see the changelog of updated version ${manifest.version}`,
        type: 'basic',
        iconUrl: 'icons-128.png'
    });
}
const installNotification = () => {
    chrome.notifications.create('onInstalled', {
        title: `ChroPath`,
        message: `Please restart browser & watch the video tutorial to make best use of ChroPath`,
        type: 'basic',
        iconUrl: 'icons-128.png'
    });
}
chrome.runtime.onInstalled.addListener(installedListener);
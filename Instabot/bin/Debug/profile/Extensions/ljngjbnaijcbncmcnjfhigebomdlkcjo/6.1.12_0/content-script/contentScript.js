/**
 * Created by sanjay kumar on 5/12/16.
 */
//Global propeties
// "use strict";

var inputText = '';
var recorderActive = false;
var attrArr = `,withid,withclass,withname,withplaceholder,withtext`;

var addAttribute = function (element, attributeName, attributeValue) {
    if (attributeName.includes('xpath')) {
        attributeName = "xpath";
    }
    try {
        element.setAttribute(attributeName, attributeValue);
    }
    catch (err) {
        return;
    }
}
var removeAttribute = function (element, attributeName, onChange) {
    try {
        attributeName = oldAttribute;
        element.removeAttribute(attributeName);
        if(element.tagName.toLowerCase().includes("svg")){
            element.style.border = "";
        }else{
            element.style.outline = "";
        }
    } catch (err) {
        return;
    }
}

var oldNodes = [];
var oldAttribute = "";
var allNodes = [];
var idChecked = "";
var _document = "";
var pageUrl = "";

var highlightElements = function (xpathOrCss, xpath, onChange, attributeChoices) {
    
    _document = _document ? _document : document;
    var elements;
    xpathOrCss = xpath === '.' ? 'xpath' : xpathOrCss;
    try {
        if (xpathOrCss.includes("xpath") || xpath === '.') {
            elements = _document.evaluate(xpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);  //xpath
        } else {
            xpathOrCss="css";
            elements = _document.querySelectorAll(xpath); //css
        }
    } catch (err) {
        if (xpath) {
            chrome.runtime.sendMessage({ count: "wrongXpath" });
        } else {
            chrome.runtime.sendMessage({ count: "blank" });
        }
        for (var i = 0; i < oldNodes.length; i++) {
            removeAttribute(oldNodes[i], xpathOrCss, onChange);
        }
        oldNodes = [];
        allNodes = [];
        return;
    }
    
    var totalMatchFound, node;
    if (xpathOrCss.includes("xpath")) {
        totalMatchFound = elements.snapshotLength;  //xpath
    } else {
        totalMatchFound = elements.length;  //css
    }
    for (var i = 0; i < oldNodes.length; i++) {
        removeAttribute(oldNodes[i], xpathOrCss, onChange);
    }
    oldNodes = [];
    allNodes = [];

    // if(onChange){
    //     console.log("sending totalMatch-"+totalMatchFound);
    //     chrome.runtime.sendMessage({ count: totalMatchFound });
    // }

    for (var i = 0; i < totalMatchFound; i++) {
        if (xpathOrCss.includes("xpath")) {
            node = elements.snapshotItem(i); //xpath
        } else {
            node = elements[i]; //css
        }
        if (i === 0 && !(xpath === "/" || xpath === "." || xpath === "/." || xpath === "//." || xpath === "//..") && node.nodeType == 1) {
            node.scrollIntoViewIfNeeded();
        }
        oldNodes.push(node);
        oldAttribute = xpathOrCss;
        if (node.nodeType == 1) {
            addAttribute(node, xpathOrCss, i + 1);
            allNodes.push(node.outerHTML);
        } else {
            allNodes.push(node.name + '="' + node.value + '"');
        }

    }
    chrome.runtime.sendMessage({ count: allNodes });
    if (_document !== document) {
        var iframeXpath = getIframeXpath(_document);
        var iframeSelector = ["iframe", iframeXpath];
        chrome.runtime.sendMessage({ count: iframeSelector });

        var styles = "[xpath], [css]{outline: 2px dotted #0715f7f7 !important}";
        var styleElement = _document.createElement("style");
        styleElement.textContent = styles;
        _document.documentElement.appendChild(styleElement);
    } 
    // else {
    //     chrome.runtime.sendMessage({ count: "notIframe" });
    // }

    var url = "websiteUrl-" + document.URL;

    //chrome.runtime.sendMessage({ count: url });

    pageUrl = url;

    if (onChange) {
        var tempEle = _document.querySelector('['+xpathOrCss+'="1"]');
        var suggestedXpath = generateRelXpath(tempEle, attributeChoices);
        var suggestedSelector = ["suggestedSelector", suggestedXpath];
        chrome.runtime.sendMessage({ count: suggestedSelector });
    }
};

function getElementsByXPath(xpath) {
    try {
        let results = [];
        let query = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (let i = 0, length = query.snapshotLength; i < length; ++i) {
            results.push(query.snapshotItem(i));
        }
        return results.length;
    } catch(err) {
        console.warn(err, "NOT VALID");
    }
};

function calculateElements(obj) {
    if(!obj.xpath) 
        return false;

    let elementsCount = getElementsByXPath(obj.xpath);
    if(elementsCount) {
        chrome.runtime.sendMessage({ type: "elementsCount", id: obj.id, elementCount: elementsCount });
    } 
    return false;
};

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {

    if(message && message.name === 'calcElements') {
        calculateElements(message.data);
    }

    if(message && message.attrArray) {
        attrArr = message.attrArray;
        attributeChoicesForXpath = message.attrArray.split(',');
    }

    if (message && message.openRecorder) {
        recorderActive = true;
        attachEvents();
    }
    if(message && message.stopRecording) {
        recorderActive = false;
        deattachEvents();
        browser.runtime.sendMessage(chrome.runtime.id, {
            message: "StopRecording",
        });
    }
    if (message && message.closed) {
        recorderActive = false;
        deattachEvents();
        browser.runtime.sendMessage(chrome.runtime.id, {
            message: "DeattachRecorder",
        });
    }

    if(message.name === 'recorderAttr'){
        browser.runtime.sendMessage(chrome.runtime.id, {
            type: 'recorderAttr',
            data: message.data
        });
    }

    if(message.name === "updateCPAttr"){
        browser.runtime.sendMessage(chrome.runtime.id, {
            type: "updateCPAttr",
            data: message.data
        });
    }

    if (message && message.type === 'downloadReport' && message.data) {
        var csv = "";
        var isWindowsOS = window.navigator.userAgent.includes('Windows');

        message.data.forEach(function (row) {
            csv += isWindowsOS ? row.join(",") : row.join("\t");
            csv += "\n";
        });

        var a = window.document.createElement("a");
        a.href = window.URL.createObjectURL(new Blob([csv], { type: 'data:application/vnd.ms-excel;base64,' }));
        if(isWindowsOS) {
            a.download = `${message.fileName}.csv`;
        } else {
            a.download = `${message.fileName}.xls`;
        }

        // Append anchor to body.
        document.body.appendChild(a);
        a.click();

        // Remove anchor from body
        document.body.removeChild(a);
    }

    tempXpath = ""; //resetting it
    this.indexes = [];
    this.matchIndex = [];
    if (_document) {
        if ((message.xpath || message.xpath === "")) {
            if (message.name.includes("highlight-element")) {
                if (!message.xpath[1]) {
                    message.name = 'xpath';
                } else if (message.xpath[1].charAt(0).includes("/") || message.xpath[1].charAt(0).includes("(")) {
                    message.name = 'xpath';
                } else {
                    message.name = 'css';
                }
                highlightElements(message.name, message.xpath[1], message.xpath[2], message.xpath[3]);
            }
        }
        
        if (message.name === "xpath") {
            var ele = _document.querySelector('[xpath="' + message.index + '"]');
            if (ele) {
                var outlineOrBorder = "outline";
                //ele.style.outline= "2px dotted orangered !important";
                ele.style.cssText = outlineOrBorder+':2px dotted orangered !important';    
                ele.scrollIntoViewIfNeeded();
            }
        }
        
        if (message.name === "xpath-remove") {
            var ele = _document.querySelector('[xpath="' + message.index + '"]');
            if (ele) {
                if(ele.tagName.toLowerCase().includes("svg")){
                    ele.style.border = "";
                }else{
                    ele.style.outline = "";
                }
            }
        }
        if (message.name === "css") {
            var ele = _document.querySelector('[css="' + message.index + '"]');
            if (ele) {
                var outlineOrBorder = "outline";
                // ele.style.outline= "2px dotted orangered !important";
                ele.style.cssText = outlineOrBorder+':2px dotted orangered !important';    
                ele.scrollIntoViewIfNeeded();
            }
        }
        if (message.name === "css-remove") {
            var ele = _document.querySelector('[css="' + message.index + '"]');
            if (ele) {
                if(ele.tagName.toLowerCase().includes("svg")){
                    ele.style.border = "";
                }else{
                    ele.style.outline = "";
                }
            }
        }
        message.xpath = "";
    }

});

function generateId(element) {
    _document = element.ownerDocument;
    if (element.id) {
        var id = element.id;
        id = removeLineBreak(id);

        var idXpath = '//*' + "[@id='" + id + "'']";
        var totalMatch = _document.evaluate(idXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
        var result = [];
        result.push(id);
        result.push(totalMatch);
        return result;
    }
}

function generateClassName(element) {
    _document = element.ownerDocument;
    if (element.className) {
        var className = element.className;
        className = removeLineBreak(className);

        var classNameXpath = '//*' + "[@class=" + className + "]";
        var totalMatch = _document.evaluate(classNameXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
        var result = [];
        result.push(className);
        result.push(totalMatch);
        return result;
    }
}

function generateName(element) {
    _document = element.ownerDocument;
    if (element.name) {
        var name = element.name;
        name = removeLineBreak(name);

        var nameXpath = '//*' + "[@name=" + name + "]";
        var totalMatch = _document.evaluate(nameXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
        var result = [];
        result.push(name);
        result.push(totalMatch);
        return result;
    }
}

function generateTagName(element) {
    _document = element.ownerDocument;

    var tagName = element.tagName.toLowerCase();

    var tagNameXpath = '//' + tagName;
    var totalMatch = _document.evaluate(tagNameXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
    var result = [];
    result.push(tagName);
    result.push(totalMatch);
    return result;

}

function generateLinkText(element) {
    _document = element.ownerDocument;
    if (element.tagName.toLowerCase() === 'a') {
        //below code will give only parent node text
        var linkText = [].reduce.call(element.childNodes, function (a, b) { return a + (b.nodeType === 3 ? b.textContent : ''); }, '').trim();
        if (linkText.length !== 0) {
            var xpath = "//a[text()='" + linkText + "']";

            if (linkText.includes("'")) {
                xpath = '//a[text()="' + linkText + '"]';
            }
            var totalMatch = _document.evaluate(xpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;

            var result = [];
            result.push(linkText);
            result.push(totalMatch);
            return result;
        }
    }
}

function generatePartialLinkText(element) {
    _document = element.ownerDocument;
    if (element.tagName.toLowerCase() === 'a') {
        // var linkText = element.childNodes[0].nodeValue.trim();
        //below code will give only parent node text
        var linkText = [].reduce.call(element.childNodes, function (a, b) { return a + (b.nodeType === 3 ? b.textContent : ''); }, '').trim();
        if (linkText.length !== 0) {
            if (linkText.length > 5) {   //sort the length only if number of characters is more than 5.
                linkText = linkText.slice(0, (linkText.length - 2)).slice(0, 20);  //max length of partial link text 20
            }

            var xpath = "//a[contains(text(),'" + linkText + "')]";

            if (linkText.includes("'")) {
                xpath = '//a[contains(text(),"' + linkText + '")]';
            }
            var totalMatch = _document.evaluate(xpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;

            var result = [];
            result.push(linkText);
            result.push(totalMatch);
            return result;
        }
    }
}

function formAbsXpath(element) {
    if (element.tagName.toLowerCase() === 'html')
        return '/html[1]';
    if (element.tagName.toLowerCase() === 'body')
        return '/html[1]/body[1]';

    var ix = 0;
    var siblings = element.parentNode.childNodes;
    for (var i = 0; i < siblings.length; i++) {
        var sibling = siblings[i];
        if (sibling === element) {
            var absXpath = formAbsXpath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
            return absXpath;
        }
        if (sibling.nodeType === 1 && sibling.tagName.toLowerCase() === element.tagName.toLowerCase()) {
            ix++;
        }
    }

    return absXpath;
}

var absXpath = "";
function generateAbsXpath(element) {

    var nodeName = element.nodeName.toLowerCase();

    if(nodeName.includes("#comment")){
        absXpath = "This is a comment and selectors can't be generated for comment."
    }else if(nodeName.includes("<pseudo:")){
        absXpath = "This is a pseudo element and selectors can't be generated for pseudo element."
    }else if(nodeName.includes("style") || nodeName.includes("script")){
        absXpath = "This is a "+nodeName+" tag. For "+nodeName+" tag, no need to write xpath. :P";  
    }else{
        absXpath = formAbsXpath(element);
    }

    var totalMatch = 0;
    try{
        totalMatch = _document.evaluate(absXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
    }catch(err){
        totalMatch = 0;
    }

    var result = [];
    result.push(absXpath);
    result.push(totalMatch);
    return result;
}


var tempXpath = "";
var indexes = [];
var matchIndex = [];
var containsFlag = false;

function isInsideIframe(node) {
    var child = true;
    var frameOrNot = node.ownerDocument;
    while (child) {
        try {
            var temp = frameOrNot.ownerDocument;
            frameOrNot = temp;
        } catch (err) {
            child = false;
        }
    }
    return frameOrNot !== document;

}

var containsText = "";
var equalsText = "";
function formRelXpath(_document, element) {
    //this will give only parent text, not the child node text
    var userAttr = attributeChoicesForXpath[0];

    var innerText = [].reduce.call(element.childNodes, function (a, b) { return a + (b.nodeType === 3 ? b.textContent : ''); }, '').trim().slice(0, 50);
    // var innerText = element.textContent.trim().slice(0,50);
    
    // innerText = "";
    if (attributeChoicesForXpath.includes("withouttext")) {
        innerText = "";
    }
    var tagName = element.tagName.toLowerCase();
    // if(tagName.includes("style") || tagName.includes("script")){
    //     return "This is "+tagName+" tag. For "+tagName+" tag, no need to write xpath. :P";  
    // }
    if (tagName.includes('svg')) {
        tagName = "*";
    }

    if (innerText.includes("'")) {
        innerText = innerText.split('  ')[innerText.split('  ').length - 1];
        containsText = '[contains(text(),"' + innerText + '")]';
        equalsText = '[text()="' + innerText + '"]';
    } else {

        innerText = innerText.split('  ')[innerText.split('  ').length - 1];
        containsText = "[contains(text(),'" + innerText + "')]";
        equalsText = "[text()='" + innerText + "']";
    }

    if (tagName.includes('html') || tagName.includes('body') || tagName.includes('head')) {
        return '//'+tagName + tempXpath;
    }
    var attr = "";
    var attrValue = "";
    var listOfAttr = {};

    if (userAttr && (!element.getAttribute(userAttr) || userAttr.toLowerCase() === "id")) {
        if(!attrArr.includes("withoutid")){
            var id = element.id;
            tempXpath = '//' + tagName + "[@id='" + id + "']" + tempXpath;
        }
        var totalMatch = _document.evaluate(tempXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
        if (totalMatch === 1) {
            return tempXpath;
        } else {
            if (innerText && element.getElementsByTagName('*').length === 0) {
                var containsXpath = '//' + tagName + containsText;
                var totalMatch = _document.evaluate(containsXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                if (totalMatch === 1) {
                    return containsXpath;
                } else {
                    tempXpath = tempXpath;
                }
            } else {
                tempXpath = tempXpath;
            }
        }
    } else if (element.attributes.length != 0) {
        if (!attrValue) {
            for (var i = 0; i < element.attributes.length; i++) {
                attr = element.attributes[i].name;
                attrValue = element.attributes[i].nodeValue;
                // if (attrValue!=null && attrValue!="" && !attr.includes("style") && !attr.includes("id") && !attr.includes("xpath")  && (attributeChoicesForXpath.includes("with"+attr) || userAttr==attr)){
                if (attrValue != null && attrValue != "" && attr !== "xpath") {
                    listOfAttr[attr] = attrValue;
                }
            }
        }
        if (userAttr in listOfAttr) {
            attr = userAttr;
            attrValue = listOfAttr[attr];
        } else if ("type" in listOfAttr) {
            attr = "type";
            attrValue = listOfAttr[attr];
        } else if ("class" in listOfAttr) {
            attr = "class";
            attrValue = listOfAttr[attr];
        } else {
            attr = Object.keys(listOfAttr)[0];
            attrValue = listOfAttr[attr];
        }
        attrValue = removeLineBreak(attrValue);  //sometime there is linespace in value so taking value before linespace.

        if (attrValue != null && attrValue != "" && attr !== "xpath") {
            var xpathWithoutAttribute = '//' + tagName + tempXpath;
            var xpathWithAttribute = "";
            if (attrValue.includes('  ')) {
                attrValue = attrValue.split('  ')[attrValue.split('  ').length - 1];
                containsFlag = true;
            }
        
            if (attrValue.charAt(0) === " " || attrValue.charAt(attrValue.length - 1) === " " || containsFlag) {
                xpathWithAttribute = '//' + tagName + "[contains(@" + attr + ",'" + attrValue.trim() + "')]" + tempXpath;
            } else {
                xpathWithAttribute = '//' + tagName + "[@" + attr + "='" + attrValue + "']" + tempXpath;
            }
        

            var totalMatch = _document.evaluate(xpathWithAttribute, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
            if (totalMatch === 1) {
                return xpathWithAttribute;
            } else if (innerText) {
                var containsXpath = '//' + tagName + containsText;
                var totalMatch = _document.evaluate(containsXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                if (totalMatch === 0) {
                    var equalsXpath = '//' + tagName + equalsText;
                    var totalMatch = _document.evaluate(equalsXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                    if (totalMatch === 1) {
                        return equalsXpath;
                    } else {
                        tempXpath = equalsXpath; //fix when contains text has comment too, like in react app
                    }
                } else if (totalMatch === 1) {
                    return containsXpath;
                } else {
                    containsXpath = xpathWithAttribute + containsText;
                    totalMatch = _document.evaluate(containsXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                    if (totalMatch === 0) {
                        var equalsXpath = xpathWithAttribute + equalsText;
                        var totalMatch = _document.evaluate(equalsXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                        if (totalMatch === 1) {
                            return equalsXpath;
                        }
                    } else if (totalMatch === 1) {
                        return containsXpath;
                    } else if (attrValue.includes('/') || innerText.includes('/')) {
                        if (attrValue.includes('/')) {
                            containsXpath = xpathWithoutAttribute + containsText;
                        }
                        if (innerText.includes('/')) {
                            containsXpath = containsXpath.replace(containsText, "");
                        }
                        tempXpath = containsXpath;
                    } else {
                        tempXpath = containsXpath;
                    }
                }
            } else {
                tempXpath = xpathWithAttribute;
                if (attrValue.includes('/')) {
                    tempXpath = "//" + tagName + xpathWithoutAttribute;
                }
            }
            // }else if(innerText && element.getElementsByTagName('*').length===0){
        } else if (innerText) {
            var containsXpath = '//' + tagName + containsText;
            var totalMatch = _document.evaluate(containsXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
            if (totalMatch === 0) {
                var equalsXpath = '//' + tagName + equalsText;
                var totalMatch = _document.evaluate(equalsXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                if (totalMatch === 1) {
                    return equalsXpath;
                }
            } else if (totalMatch === 1) {
                return containsXpath;
            }
            tempXpath = containsXpath + tempXpath;
        } else if ((attrValue == null || attrValue == "" || attr.includes("xpath"))) {
            tempXpath = "//" + tagName + tempXpath;
        }
        // }else if(attrValue=="" && innerText && element.getElementsByTagName('*').length===0 && !tagName.includes("script")){
    }else {
        tempXpath = "//" + tagName + tempXpath;
    }
    var ix = 0;

    var siblings = element.parentNode.childNodes;
    for (var i = 0; i < siblings.length; i++) {
        var sibling = siblings[i];
        if (sibling === element) {
            indexes.push(ix + 1);
            tempXpath = formRelXpath(_document, element.parentNode);
            if (!tempXpath.includes("/")) {
                return tempXpath;
            } else {
                var totalMatch = _document.evaluate(tempXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                if (totalMatch === 1) {
                    return tempXpath;
                } else {
                    tempXpath = "/" + tempXpath.replace(/\/\/+/g, '/');
                    var regSlas = /\/+/g;
                    var regBarces = /[^[\]]+(?=])/g; ////this is to get content inside all []
                    while ((match = regSlas.exec(tempXpath)) != null) {
                        matchIndex.push(match.index);
                    }
                    for (var j = 0; j < indexes.length; j++) {
                        if (j === 0) {
                            var lastTag = tempXpath.slice(matchIndex[matchIndex.length - 1]);
                            if ((match = regBarces.exec(lastTag)) != null) {
                                lastTag = lastTag.replace(regBarces, indexes[j]).split("]")[0] + "]";
                                tempXpath = tempXpath.slice(0, matchIndex[matchIndex.length - 1]) + lastTag;
                            } else {
                                tempXpath = tempXpath + "[" + indexes[j] + "]";
                            }
                        } else {
                            var lastTag = tempXpath.slice(matchIndex[matchIndex.length - (j + 1)], matchIndex[matchIndex.length - (j)]);
                            if ((match = regBarces.exec(lastTag)) != null) {
                                lastTag = lastTag.replace(regBarces, indexes[j]);
                                tempXpath = tempXpath.slice(0, matchIndex[matchIndex.length - (j + 1)]) + lastTag + tempXpath.slice(matchIndex[matchIndex.length - j]);
                            } else {
                                tempXpath = tempXpath.slice(0, matchIndex[matchIndex.length - j]) + "[" + indexes[j] + "]" + tempXpath.slice(matchIndex[matchIndex.length - j]);
                            }
                        }
                        var totalMatch = _document.evaluate(tempXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                        if (totalMatch === 1) {
                            return tempXpath.replace('//html', '');
                        }
                    }
                }
            }
        }
        if (sibling.nodeType === 1 && sibling.tagName.toLowerCase() === element.tagName.toLowerCase()) {
            ix++;
        }
    }
}

var attributeChoicesForXpath = [];

function generateRelXpath(element, attributeChoices) {
    // idChecked = withId;
    attributeChoices.includes('withoutid') ? attrArr = attrArr.replace('withid', 'withoutid') : attrArr = attrArr.replace('withoutid', 'withid'); 
    attributeChoicesForXpath = attributeChoices.split(",");
    var relXpath = "";
    var result = [];
    try{
        _document = element.ownerDocument;
    }catch{
        result.push("0 element matching.");
        result.push("0");
        return result;
    }

    
    var nodeName = element.nodeName.toLowerCase();

    if(nodeName.includes("#comment")){
        relXpath = "This is a comment and selectors can't be generated for comment."
    }else if(nodeName.includes("::")){
        relXpath = "This is a pseudo element and selectors can't be generated for pseudo element."
    }else if(nodeName.includes("style") || nodeName.includes("script")){
        relXpath = "This is a "+nodeName+" tag. For "+nodeName+" tag, no need to write xpath. :P";  
    }else{
        generateAbsXpath(element);
        try{
            if(absXpath.includes("/*[local-name")){
                relXpath = formRelXpathForSVG(_document, element);
            } else {
                relXpath = getOptimizedRelXpath(_document, element);
            }
        }catch(err){
                relXpath = absXpath; //incase any error comes in rel xpath calculation then it will return absXpath
        }
    }
    tempXpath = "";
    absXpath = "";

    try {
        var totalMatch = _document.evaluate(relXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
    } catch (err) {
        totalMatch = 0;
    }

    
    result.push(relXpath);
    result.push(totalMatch);

    //checking id and class alphanumeric
    if ((relXpath.includes("@id=") || relXpath.includes("contains(@id")) && isAttributeDynamic(relXpath, "id")){
        result.push("id");
    }
    if ((relXpath.includes("@class=") || relXpath.includes("contains(@class")) && isAttributeDynamic(relXpath, "class")){
        result.push("class");
    }
    
    return result;

    //return relXpath;
}

function getNodename(element) {
    var name = "", className;
    if (element.classList.length) {
        name = [element.tagName.toLowerCase()];
        className = element.className.trim();
        className = className.replace(/  +/g, ' ');
        name.push(className.split(" ").join("."));
        name = name.join(".")
    }
    return name;
}

function getChildNumber(node) {
    var classes = {}, i, firstClass, uniqueClasses;
    var parentNode = node.parentNode, childrenLen;
    childrenLen = parentNode.children.length;
    for (i = 0; i < childrenLen; i++) {
        if (parentNode.children[i].classList.length) {
            firstClass = parentNode.children[i].classList[0];
            if (!classes[firstClass]) {
                classes[firstClass] = [parentNode.children[i]]
            } else {
                classes[firstClass].push(parentNode.children[i])
            }
        }
    }
    uniqueClasses = Object.keys(classes).length || -1;
    var obj = {
        childIndex: -1,
        childLen: childrenLen
    }


    if (classes[Object.keys(classes)[0]] === childrenLen) {
        obj.childIndex = Array.prototype.indexOf.call(classes[node.classList[0]], node);
        obj.childLen = classes[Object.keys(classes)[0]].length;
        return obj
    } else if (uniqueClasses && uniqueClasses !== -1 && uniqueClasses !== childrenLen) {
        obj.childIndex = Array.prototype.indexOf.call(parentNode.children, node);
        obj.childLen = classes[Object.keys(classes)[0]].length;
        return obj
    } else if (uniqueClasses === -1) {
        obj.childIndex = Array.prototype.indexOf.call(parentNode.children, node);
        obj.childLen = childrenLen;
        return obj
    } else {
        return obj
    }
}


function parents(element, _array) {
    var name, index;
    if (_array === undefined) {
        _array = [];
    }
    else {
        index = getChildNumber(element);
        name = getNodename(element);
        if (name) {
            if (index.childLen >= 1 && index.childIndex !== -1) {
                name += ":nth-child(" + (index.childIndex + 1) + ")"
            }
            _array.push(name);
        } else if (_array.length < 5) {
            name = element.tagName.toLowerCase();
            if (index.childIndex !== -1) {
                name += ":nth-child(" + (index.childIndex + 1) + ")"
            }
            _array.push(name);
        }
    }
    if (element.tagName !== 'BODY') return parents(element.parentNode, _array);
    else return _array;
}


function generateCSS(el) {

    var result = [];
    var totalMatch = 0;
    var cssSelector = "";

    if (!el) {
        cssSelector = "element is inside iframe & it is not supported by ChroPath currently. Please write CSS manually.";
        totalMatch = 0;
    }

    var tagName = el.tagName.toLowerCase();
    if (tagName.includes("style") || tagName.includes("script") || tagName.includes("svg")) {
        cssSelector = "This is " + tagName + " tag. For " + tagName + " tag, no need to write selector. :P";
        totalMatch = 0;
    }

    if (el.id !== '') {
        cssSelector = "#" + el.id;
    }else if(tagName.includes("body") || tagName.includes("head") || tagName.includes("html")){
        cssSelector = tagName;
    }else {
        var path = parents(el, []);
        path = path.reverse();
        var lastNode = path.slice(path.length - 1, path.length);
        var _path = path.slice(0, path.length - 1);
        var cssSelector = "";
        if (_path.length != 0) {
            cssSelector = _path.join(" ") + " > " + lastNode;
        }
        else {  //hack for body tag which is the 1st tag in html page
            cssSelector = lastNode;
        }
    }

    try {
        var elements = _document.querySelectorAll(cssSelector); //css
        totalMatch = elements.length;
    } catch (err) {
        totalMatch = 0;
    }
    result.push(cssSelector);
    result.push(totalMatch);
    return result;
}


// function insertPseudoElementInIframes() {
//     var iframes = document.querySelectorAll("iframe");
//     for (var i = 0; i < iframes.length; i++) {
//         var _document = iframes[i].contentDocument;
//         if (_document) {
//             var x = _document.createElement("input");
//             x.style.display = "none";
//             x.setAttribute('id', 'chropathFrame' + i);
//             var bodyEle = _document.querySelector('body');
//             bodyEle.appendChild(x);
//         }
//     }
// }

// function deletePseudoElementFromIframes() {
//     var iframes = document.querySelectorAll("iframe");
//     for (var i = 0; i < iframes.length; i++) {
//         if (iframes[i].contentDocument) {
//             var ele = iframes[i].contentDocument.querySelector('#chropathFrame' + i);
//             ele.parentNode.removeChild(ele);
//         }
//     }
// }

function generateLabel(element) {
    _document = element.ownerDocument;
    var insideIframe = _document !== document ? "(inside iframe)" : "";

    var tagsForLabel = ["button","input", "meter", "output","progress","select","textarea"];

    var attr = "";
    var attrValue = "";
    var listOfAttr = {};
    var label = "";
    var tagName = element.nodeName.toLowerCase();
    if(tagName.includes('path') || tagName=="g"){
        while(!element.nodeName.toLowerCase().includes("svg")){
            element = element.parentElement;
            tagName = element.nodeName.toLowerCase();
            if(tagName.includes("svg")){
              break;
            }
        }
    }
    
    if(tagName.includes('svg')){
        element = element.parentElement;  
    }
    
    if(tagName.includes("pseudo")){
        var parentClass = element.parentElement.className;
        if(parentClass.includes("icon")){
            label = parentClass.replace(/-/g,"");
        }else{
            label = getComputedStyle(element, '').getPropertyValue('content');
        }
        return label.trim() + insideIframe;
    }else if ((tagsForLabel.includes(tagName)) && element.id) {
        try {
            label = _document.querySelector("label[for='" + element.id + "']").textContent;
            //label = label.replace(/ /g, ""); //delete all blank space between words
            return label.trim() + insideIframe;
        } catch (err) {
        }
    } else if (tagName.includes('style') || tagName.includes('script') 
         || tagName.includes('body') || tagName.includes('html') || tagName.includes('head')
        || tagName.includes('link') || tagName.includes('meta') || tagName.includes('title') || tagName.includes('comment')) {
        try {
            if(element.className){
                label = element.className.split(" ")[0];
            }else if(element.id){
                label = element.id;
            }else{
                label = tagName + "Tag";
            }
            //label = label.replace(/ /g, ""); //delete all blank space between words
            return label.trim() + insideIframe;
        } catch (err) {
        }
    }

    if (tagName.includes('label')) {
        label = [].reduce.call(element.childNodes, function (a, b) { return a + (b.nodeType === 3 ? b.textContent : ''); }, '').trim();
    } else if (element.attributes.length != 0) {
        if (!attrValue) {
            for (var i = 0; i < element.attributes.length; i++) {
                attr = element.attributes[i].name;
                attrValue = element.attributes[i].nodeValue;
                if (attrValue != null && attrValue != "" && !attr.includes("style") && !attr.includes("id") && !attr.includes("xpath")) {
                    listOfAttr[attr] = attrValue;
                }
            }
        }
        var textContent = [].reduce.call(element.childNodes, function (a, b) { return a + (b.nodeType === 3 ? b.textContent : ''); }, '').trim();
        attr = "";
        attrValue = "";
        if ("placeholder" in listOfAttr) {
            attr = "placeholder";
            attrValue = listOfAttr[attr];
        } else if(textContent){
            attrValue = textContent;
        }else if ("name" in listOfAttr) {
            attr = "name";
            attrValue = listOfAttr[attr];
        } else if ("value" in listOfAttr) {
            attr = "value";
            attrValue = listOfAttr[attr];
        } else if ("aria-label" in listOfAttr) {
            attr = "aria-label";
            attrValue = listOfAttr[attr];
        } else if ("title" in listOfAttr) {
            attr = "title";
            attrValue = listOfAttr[attr];
        } else if ("alt" in listOfAttr) {
            attr = "alt";
            attrValue = listOfAttr[attr];
        } else if ("for" in listOfAttr) {
            attr = "for";
            attrValue = listOfAttr[attr];
        } else if ("data-label" in listOfAttr) {
            attr = "data-label";
            attrValue = listOfAttr[attr];
        } else if ("date-fieldlabel" in listOfAttr) {
            attr = "date-fieldlabel";
            attrValue = listOfAttr[attr];
        } else if ("data-displaylabel" in listOfAttr) {
            attr = "data-displaylabel";
            attrValue = listOfAttr[attr];
        } else if ("role" in listOfAttr) {
            attr = "role";
            attrValue = listOfAttr[attr];
        }
        label = attrValue;
        if(!label){
            var iconTypes = ["search","remove","delete","close","cancel","plus","add","subtract","minus","cart","home","logo","notification","globe"]
            var className = element.className.toLowerCase();
            if(className){
                for(var i=0; i<iconTypes.length; i++){
                    if(className.includes(iconTypes[i])){
                         label = iconTypes[i]+" icon";
                    }
                }
            }
        }
    }

    if (!label || label.length < 3) {
        label = [].reduce.call(element.childNodes, function (a, b) { return a + (b.nodeType === 3 ? b.textContent : ''); }, '').trim();
        label = label?label:element.textContent.trim();

        // var tempElement = element; 
        if(!label){

            // while (tempElement){
            //     var pseudo = window.getComputedStyle(tempElement, ':before');
            //     var pseudoValue = pseudo.getPropertyValue("content");
            //     if(!pseudoValue.includes("none")){
            //         label = pseudoValue;
            //         break;
            //     }else{
            //         tempElement=tempElement.firstElementChild;
            //     }
            // }
            var w = new WebPage(document);
            try{
                label = w.getLabel(element);
            }catch(err){
                
            }
            var is_label_has_duplication = false;
            if (label && label.text && label.text.length) {
                var len = label && label.text && Math.round(label.text.length / 2);
                var first_half_label = label.text.slice(0, len);
                is_label_has_duplication = first_half_label == label.text.slice(len);
            }

            if (is_label_has_duplication) {

                label.text = first_half_label;
                label = label.text;
            } 
            label = label ? label.text : "";           
        }
        label = label?label:element.parentElement.textContent.trim();

    }

    if (!label) {
        element = element.parentElement;
        label = generateLabel(element);
        //label = tagName + "Tag";
    }
    label = label?label:"";
    label = label.includes("inside iframe")?label:label + insideIframe;
    //label = label.replace(/ /g, ""); //delete all blank space between words
    return label.trim();
}

function getOptimizedRelXpath(_document, element) {
    let relXpath = "";
    try {
        relXpath = formRelXpath(_document, element);
    } catch (err) {
        tempXpath = "";
        attributeChoicesForXpath = ["withoutid", "withoutclass"];
        relXpath = formRelXpath(_document, element);
    }
    let doubleForwardSlash = /\/\/+/g; //regex to find double forward slash
    let numOfDoubleForwardSlash = 0;
    try {
        numOfDoubleForwardSlash = relXpath.match(doubleForwardSlash).length;
    } catch (err) { }

    if (relXpath === undefined) {
        relXpath = "It might be pseudo element/comment/inside iframe from different src. XPath doesn't support for them.";
    }
    return relXpath;
}

function formRelXpathForSVG(_document, element) {
    //this will give only parent text, not the child node text
    var userAttr = attributeChoicesForXpath[0];

    var tagName = element.tagName.toLowerCase();

    if (tagName.includes('svg')) {
        tagFormat = "//*[local-name()='" + tagName;
    } else {
        tagFormat = "//*[name()='" + tagName;
    }

    if (tagName.includes('svg')) {
        try {
            var relXpath = tempXpath;
            tempXpath = "";
            indexes = [];
            tempXpath = getOptimizedRelXpath(_document, element.parentNode) + "//*[local-name()='svg']" + relXpath;
            indexes = [];
        } catch (err) {
        }
        return tempXpath;
    }

    var attr = "";
    var attrValue = "";
    var listOfAttr = {};
    var numberOfAttr = "";
    try {
        element.attributes.removeNamedItem("xpath");
        numberOfAttr = element.attributes.length;
    } catch (err) {
        numberOfAttr = element.attributes.length;
    }
    if ((!element.getAttribute(userAttr) || userAttr.toLowerCase() === "id")) {
        var id = element.id;
        id = removeLineBreak(id);

        tempXpath = tagFormat + "' and @id='" + id + "']" + tempXpath;
        // if(tagName.includes('svg')){
        var totalMatch = _document.evaluate(tempXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
        if (totalMatch === 1) {
            return tempXpath;
        }
        // } 


    } else if (numberOfAttr > 0) {
        if (!attrValue) {
            for (var i = 0; i < element.attributes.length; i++) {

                attr = element.attributes[i].name;
                attrValue = element.attributes[i].nodeValue;

                // if (attrValue!=null && attrValue!="" && !attr.includes("style") && !attr.includes("id") && !attr.includes("xpath")  && (attributeChoicesForXpath.includes("with"+attr) || userAttr==attr)){
                if (attrValue != null && attrValue != "" && (attr !== "style" || userAttr === "style") && attr !== "id" && attr !== "xpath") {
                    listOfAttr[attr] = attrValue.trim().slice(0, 10);
                }
            }
        }
        if (Object.keys(listOfAttr).length > 0) {
            if (userAttr in listOfAttr) {
                attr = userAttr;
                attrValue = listOfAttr[attr];
            } else if ("type" in listOfAttr) {
                attr = "type";
                attrValue = listOfAttr[attr];
            } else if ("class" in listOfAttr) {
                attr = "class";
                attrValue = listOfAttr[attr];
            } else {
                attr = Object.keys(listOfAttr)[0];
                attrValue = listOfAttr[attr];
            }

            attrValue = removeLineBreak(attrValue);  //sometime there is linespace in value so taking value before linespace.

            if (attrValue != null && attrValue != "" && attr !== "xpath") {
                var xpathWithAttribute = "";
                if (attrValue.includes('  ')) {
                    attrValue = attrValue.split('  ')[attrValue.split('  ').length - 1];
                    containsFlag = true;
                }
                if (attrValue.includes("'")) {
                    tempXpath = tagFormat + '" and contains(@' + attr + ',"' + attrValue + '")]' + tempXpath;
                } else {
                    tempXpath = tagFormat + "' and contains(@" + attr + ",'" + attrValue + "')]" + tempXpath;
                }
                var totalMatch = _document.evaluate(tempXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                if (totalMatch === 1) {
                    return tempXpath;
                }

            } else if ((attrValue == null || attrValue == "" || attr.includes("xpath"))) {
                tempXpath = tagFormat + "'" + tempXpath;
                var totalMatch = _document.evaluate(tempXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                if (totalMatch === 1) {
                    return tempXpath;
                }
            }
        }
    } else {
        tempXpath = tagFormat + "']" + tempXpath;
        var totalMatch = _document.evaluate(tempXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
        if (totalMatch === 1) {
            return tempXpath;
        }
    }
    var ix = 0;
    var siblings = element.parentNode.childNodes;
    for (var i = 0; i < siblings.length; i++) {
        var sibling = siblings[i];
        if (sibling === element) {
            indexes.push(ix + 1);
            tempXpath = formRelXpathForSVG(_document, element.parentNode);
            if (!tempXpath.includes("/")) {
                return tempXpath;
            } else {
                var totalMatch = _document.evaluate(tempXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                if (totalMatch === 1) {
                    return tempXpath;
                } else {
                    var svgChildsWithIndexes = absXpath.split("/*");
                    var svgChildsWithoutIndexes = tempXpath.split("/*");
                    for (var j = svgChildsWithIndexes.length - 1; j > 0; j--) {
                        tempXpath = tempXpath.replace(svgChildsWithoutIndexes[j], svgChildsWithIndexes[j]);
                        var totalMatch = _document.evaluate(tempXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                        if (totalMatch === 1) {
                            return tempXpath;
                        }
                    }
                }
            }
        }
        if (sibling.nodeType === 1 && sibling.tagName.toLowerCase() === element.tagName.toLowerCase()) {
            ix++;
        }
    }
}

var eventHandlers = {};

function addListeners(handlerName, eventName, handler, options) {
    handler.handlerName = handlerName;
    if (!options) options = false;
    let key = options ? ('C_' + eventName) : eventName;
    if (!eventHandlers[key]) {
        eventHandlers[key] = [];
    }
    eventHandlers[key].push(handler);
};

function parseEventKey(eventKey) {
    if (eventKey.match(/^C_/)) {
        return { eventName: eventKey.substring(2), capture: true };
    } else {
        return { eventName: eventKey, capture: false };
    }
}

// This part of code is copyright by Software Freedom Conservancy(SFC)
function attachEvents() {
    if (this.attached) {
        return;
    }
    this.attached = true;
    this.eventListeners = {};
    var self = this;
    for (let eventKey in eventHandlers) {
        var eventInfo = parseEventKey(eventKey);
        var eventName = eventInfo.eventName;
        var capture = eventInfo.capture;

        // create new function so that the variables have new scope.
        function register() {
            var handlers = eventHandlers[eventKey];
            var listener = function (event) {
                for (var i = 0; i < handlers.length; i++) {
                    handlers[i].call(self, event);
                }
            };
            this.window.document.addEventListener(eventName, listener, capture);
            this.eventListeners[eventKey] = listener;

            var iframes = document.getElementsByTagName('iframe');
            if(iframes){
                for (var i = 0; i < iframes.length; i++) {
                    if(iframes[i].contentDocument) {
                        iframes[i].contentDocument.addEventListener(eventName, listener, capture);
                    }
                }
            }
        }

        register.call(this);
        browser.runtime.sendMessage(chrome.runtime.id, {
            data: ``,
            message: 'AttachRecorder',
        });
    }
}

function deattachEvents() {
    if (!this.attached) {
        return;
    }
    this.attached = false;
    for (let eventKey in this.eventListeners) {
        var eventInfo = parseEventKey(eventKey);
        var eventName = eventInfo.eventName;
        var capture = eventInfo.capture;
        this.window.document.removeEventListener(eventName, this.eventListeners[eventKey], capture);
    }
    delete this.eventListeners;
}


// function attachEvents() {
//     console.log("Recorder Attached")
//     for(key in events) {
//         window.addEventListener(key, events[key]);
//     }
//     browser.runtime.sendMessage(chrome.runtime.id, {
//         data: ``,
//         message: 'AttachRecorder',
//     });
// };

// function deattachEvents() {
//     console.log("Recorder Deattached")
//     for(key in events) {
//         window.removeEventListener(key, events[key]);
//     }
//     browser.runtime.sendMessage(chrome.runtime.id, {
//         data: ``,
//         message: 'DeattachRecorder',
//     });
// };


window.onload = function () {
    browser.runtime.sendMessage(chrome.runtime.id, {
        type: 'verification',
        data: []
    });
};

function isAlphaNumeric(value) {
    var regAlpha = /[a-zA-Z]/; //regex to check if there is only alphabates in string
    var regNum = /\d/; //regex to check if there is any digit in string
    if ((regAlpha.test(value) && regNum.test(value)) || regNum.test(value)) {
        return true;
    } else {
        return false;
    }
}

var recorderCommands = {
    "addSelection": "select",
    "clickAt": "Click on",
    "doubleClickAt": "Double click on",
    "rightClick": "Right click on",
    "select": "select",
    "sendKeys": "Hit Enter",
    "submit": "Hit Enter",
    "type": "Enter"
}
function record(command, target, value = "", neglectXpath) {
    if (neglectXpath) {
        browser.runtime.sendMessage(chrome.runtime.id, {
            data: recorderCommands[command],
            type: 'windowEvent',
            URL: window.location.href,
            dataText: "",
            relXpath: ''
        });
        return false;
    }

    var label = generateLabel(target);
    try{
        var relXpath = generateRelXpath(target, attrArr);
    } catch(e){
        try{
            var relXpath = generateAbsXpath(target);
        } catch(e){
            return false;
        }
    }
    if (label) {
        label = label.slice(0, 30);
        browser.runtime.sendMessage(chrome.runtime.id, {
            data: `${recorderCommands[command] + " " + label}`,
            type: 'windowEvent',
            URL: window.location.href,
            dataText: value,
            relXpath: relXpath ? relXpath[0] : '',
            planeLabel: label
        });
    }
}

function getIframeXpath(doc){
    var  allIframes= document.querySelectorAll("iframe");
    var iframeDoc = doc;
    for(var i=0; i<allIframes.length; i++){
        if(allIframes[i].contentDocument==doc){
            var iframeXpath = generateRelXpath(allIframes[i],",withid,withclass,withname,withplaceholder,withtext");
            _document = iframeDoc; //assigning back tha _document same as iframe doc
            return iframeXpath;
        }
    }
}


function isAttributeDynamic(xpath, attr){
    var conatinsRegex = new RegExp("@"+attr+",'(.*?)'", 'g');
    var equalRegex = new RegExp("@+"+attr+"+='(.*?)'", 'g');
    var containsMatch = xpath.match(conatinsRegex);
    var equalMatch = xpath.match(equalRegex);
    return isAlphaNumeric(containsMatch)?true:isAlphaNumeric(equalMatch);
}


var typeTarget;
var typeLock = 0;
var eventCaptured = 0;
var prevTargetElement = null;


var inputTypes = ["text", "password", "file", "datetime", "datetime-local", "date", "month", "time", "week", "number", "range", "email", "url", "search", "tel", "color"];
addListeners("type", "change", function(event) {
    if (event.target.tagName && !preventType && typeLock == 0 && (typeLock = 1)) {
        // END
            prevTargetElement = event.target;
            var tagName = event.target.tagName.toLowerCase();
            var type = event.target.type;
            if ("input" == tagName && inputTypes.indexOf(type) >= 0) {
                if (event.target.value.length > 0) {
                    record("type", (event.target), event.target.value);
                    eventCaptured = 1;
                    if (enterTarget != null) {
                        var tempTarget = event.target.parentElement;
                        var formChk = tempTarget.tagName.toLowerCase();
                        while (formChk != "form" && formChk != "body") {
                            tempTarget = tempTarget.parentElement;
                            formChk = tempTarget.tagName.toLowerCase();
                        }
                        if (formChk == "form" && (tempTarget.hasAttribute("id") || tempTarget.hasAttribute("name")) && (!tempTarget.hasAttribute("onsubmit"))) {
                            record("sendKeys", (enterTarget), null, true);
                        } else
                            record("sendKeys", (enterTarget), null, true);
                        enterTarget = null;
                    }
                    // END
                } else {
                    record("type", (event.target), event.target.value);
                }
            } else if ("textarea" == tagName) {
                record("type", (event.target), event.target.value);
            }
        }
        typeLock = 0
});

addListeners("type", "input", function(event) {
    typeTarget = event.target;
});

var preventClickTwice =false;
var clickCounter = 0;

addListeners("clickAt", "click", function(event) {
    eventCaptured = 0;
    clickCounter++;

    if (event.button == 0 && !preventClick && event.isTrusted) {
        if (!preventClickTwice && clickCounter === 1) {
            var top = event.pageY,
                left = event.pageX;
            var element = event.target;
            do {
                top -= element.offsetTop;
                left -= element.offsetLeft;
                element = element.offsetParent;
            } while (element);
            var target = event.target;
            var attrType = target.getAttribute("type");
            var parentTag=target.parentNode.tagName;
            for(var i=0; i<3; i++){
                try{
                    var tempParent = target.parentNode;
                    if(tempParent.tagName == "FORM"){
                        parentTag = tempParent.tagName;
                    }
                }catch(err){}
            }

            if((target.nodeName == "INPUT" || target.nodeName == "SELECT" && (attrType == "text" || attrType == "email" || attrType == "password" || attrType == "tel"
                || attrType == "number" || (parentTag == "FORM" && !attrType))  && attrType != "radio" && attrType != "checkbox")
                /*|| target.nodeName == "LABEL" */|| target.nodeName == "FORM" || target.nodeName == "BODY") {
            } else {
                prevTargetElement = event.target;
                record("clickAt", (event.target));
            }
            preventClickTwice = true;
        }
        setTimeout(function() { preventClickTwice = false; clickCounter = 0; }, 200);
    }
}, true);
//END

addListeners("doubleClickAt", "dblclick", function(event) {
    clickCounter = 0;
    var element = event.target;;
    if(/*element.tagName == "LABEL" || */element.tagName == "FORM" || element.tagName == "BODY") {
    } else {
        record("doubleClickAt", (event.target));
    }
}, true);


var focusTarget = null;
var focusValue = null;
var tempValue = null;
var preventType = false;
var inp = document.getElementsByTagName("input");
for (var i = 0; i < inp.length; i++) {
    if (inputTypes.indexOf(inp[i].type) >= 0) {
        inp[i].addEventListener("focus", function(event) {
            focusTarget = event.target;
            focusValue = focusTarget.value;
            tempValue = focusValue;
            preventType = false;
        });
        inp[i].addEventListener("blur", function(event) {
            focusTarget = null;
            focusValue = null;
            tempValue = null;
        });
    }
}


var preventClick = false;
var enterTarget = null;
var varenterValue = null;
var tabCheck = null;
addListeners("sendKeys", "keydown", function(event) {
    if (event.target.tagName) {
        var key = event.keyCode;
        var tagName = event.target.tagName.toLowerCase();
        var type = event.target.type;
        if (tagName == "input" && inputTypes.indexOf(type) >= 0) {
            prevTargetElement = event.target;
            if (key == 13) {
                enterTarget = event.target;
                enterValue = enterTarget.value;
                var tempTarget = event.target.parentElement;
                var formChk = tempTarget.tagName.toLowerCase();
                if (tempValue == enterTarget.value && tabCheck == enterTarget) {
                    record("sendKeys", (enterTarget), null, true);
                    enterTarget = null;
                    preventType = true;
                } else if (focusValue == enterTarget.value) {
                    while (formChk != "form" && formChk != "body") {
                        tempTarget = tempTarget.parentElement;
                        formChk = tempTarget.tagName.toLowerCase();
                    }
                    if (formChk == "form" && (tempTarget.hasAttribute("id") || tempTarget.hasAttribute("name")) && (!tempTarget.hasAttribute("onsubmit"))) {
                        if (tempTarget.hasAttribute("id"))
                            record("submit", "id=" + tempTarget.id, "", true);
                        else if (tempTarget.hasAttribute("name"))
                            record("submit", "name=" + tempTarget.name, "", true);
                    } else
                        record("sendKeys", (enterTarget), null, true);
                    enterTarget = null;
                }
                if (typeTarget.tagName && !preventType && (typeLock = 1)) {
                    // END
                        var tagName = typeTarget.tagName.toLowerCase();
                        var type = typeTarget.type;
                        if ("input" == tagName && inputTypes.indexOf(type) >= 0) {
                            if (typeTarget.value.length > 0) {
                                record("type", (typeTarget), typeTarget.value);
                                if (enterTarget != null) {
                                    var tempTarget = typeTarget.parentElement;
                                    var formChk = tempTarget.tagName.toLowerCase();
                                    while (formChk != "form" && formChk != "body") {
                                        tempTarget = tempTarget.parentElement;
                                        formChk = tempTarget.tagName.toLowerCase();
                                    }
                                    if (formChk == "form" && (tempTarget.hasAttribute("id") || tempTarget.hasAttribute("name")) && (!tempTarget.hasAttribute("onsubmit"))) {
                                        if (tempTarget.hasAttribute("id"))
                                            record("submit", [
                                                ["id=" + tempTarget.id, "id"]
                                            ], "", true);
                                        else if (tempTarget.hasAttribute("name"))
                                            record("submit", [
                                                ["name=" + tempTarget.name, "name"]
                                            ], "", true);
                                    } else
                                        record("sendKeys", (enterTarget), null, true);
                                    enterTarget = null;
                                }
                                // END
                            } else {
                                record("type", (typeTarget), typeTarget.value);
                            }
                        } else if ("textarea" == tagName) {
                            record("type", (typeTarget), typeTarget.value);
                        }
                    }
                preventClick = true;
                setTimeout(function() {
                    preventClick = false;
                }, 500);
                setTimeout(function() {
                    if (enterValue != event.target.value) enterTarget = null;
                }, 50);
            }

            var tempbool = false;
            if ((key == 38 || key == 40) && event.target.value != "") {
                if (focusTarget != null && focusTarget.value != tempValue) {
                    tempbool = true;
                    tempValue = focusTarget.value;
                }
                if (tempbool) {
                    record("type", (event.target), tempValue);
                }

                setTimeout(function() {
                    tempValue = focusTarget.value;
                }, 250);

                if (key == 38) record("sendKeys", (event.target), "", true);
                else record("sendKeys", (event.target), "", true);
                tabCheck = event.target;
            }
            if (key == 9) {
                if (tabCheck == event.target) {
                    record("sendKeys", (event.target), "", true);
                    preventType = true;
                }
            }
        }
    }
}, true);

addListeners("contextMenu", "contextmenu", function(event) {
    var element = event.target;;
    if(/*element.tagName == "LABEL" || */element.tagName == "FORM" || element.tagName == "BODY") {
    } else {
        record("rightClick", (event.target));
    }
}, true);
// END

var checkFocus = 0;
addListeners("editContent", "focus", function(event) {
    var editable = event.target.contentEditable;
    if (editable == "true") {
        getEle = event.target;
        contentTest = getEle.innerHTML;
        checkFocus = 1;
    }
}, true);
// END

browser.runtime.sendMessage({
    attachRecorderRequest: true
}).catch(function(reason){
    // Failed silently if receiveing end does not exist
});

function getOptionLocator(option) {
    var label = option.text.replace(/^ *(.*?) *$/, "$1");
    if (label.match(/\xA0/)) { // if the text contains &nbsp;
        return "label=regexp:" + label.replace(/[\(\)\[\]\\\^\$\*\+\?\.\|\{\}]/g, function(str) {
                return "\\" + str
            })
            .replace(/\s+/g, function(str) {
                if (str.match(/\xA0/)) {
                    if (str.length > 1) {
                        return "\\s+";
                    } else {
                        return "\\s";
                    }
                } else {
                    return str;
                }
            });
    } else {
        return label;
    }
};

function findClickableElement(e) {
    if (!e.tagName) return null;
    var tagName = e.tagName.toLowerCase();
    var type = e.type;
    if (e.hasAttribute("onclick") || e.hasAttribute("href") || tagName == "button" ||
        (tagName == "input" &&
            (type == "submit" || type == "button" || type == "image" || type == "radio" || type == "checkbox" || type == "reset"))) {
        return e;
    } else {
        if (e.parentNode != null) {
            return findClickableElement(e.parentNode);
        } else {
            return null;
        }
    }
};
//select / addSelect / removeSelect
addListeners("select", "focus", function(event) {
    if (event.target.nodeName) {
        var tagName = event.target.nodeName.toLowerCase();
        if ("select" == tagName && event.target.multiple) {
            var options = event.target.options;
            for (var i = 0; i < options.length; i++) {
                if (options[i]._wasSelected == null) {
                    // is the focus was gained by mousedown event, _wasSelected would be already set
                    options[i]._wasSelected = options[i].selected;
                }
            }
        }
    }
},true);

addListeners("select", "change", function(event) {
    if (event.target.tagName) {
        var tagName = event.target.tagName.toLowerCase();
        if ("select" == tagName) {
            prevTargetElement = event.target;
            if (!event.target.multiple) {
                var option = event.target.options[event.target.selectedIndex];
                record("select", (event.target), getOptionLocator(option));
            } else {
                var options = event.target.options;
                for (var i = 0; i < options.length; i++) {
                    if (options[i]._wasSelected == null) {}
                    if (options[i]._wasSelected != options[i].selected) {
                        var value = getOptionLocator(options[i]);
                        if (options[i].selected) {
                            record("addSelection", (event.target), value, true);
                        } else {
                            record("removeSelection", (event.target), value, true);
                        }
                        options[i]._wasSelected = options[i].selected;
                    }
                }
            }
        }
    }
});

function getText(element) {
    var text = "";

    var isRecentFirefox = (browserVersion.isFirefox && browserVersion.firefoxVersion >= "1.5");
    if (isRecentFirefox || browserVersion.isKonqueror || browserVersion.isSafari || browserVersion.isOpera) {
        text = getTextContent(element);
    } else if (element.textContent) {
        text = element.textContent;
    } else if (element.innerText) {
        text = element.innerText;
    }

    text = normalizeNewlines(text);
    text = normalizeSpaces(text);

    return text.trim();
}

//self
function getTextContent(element, preformatted) {
    if (element.style && (element.style.visibility == "hidden" || element.style.display == "none")) return "";
    if (element.nodeType == 3 /*Node.TEXT_NODE*/ ) {
        var text = element.data;
        if (!preformatted) {
            text = text.replace(/\n|\r|\t/g, " ");
        }
        return text;
    }
    if (element.nodeType == 1 /*Node.ELEMENT_NODE*/ && element.nodeName != "SCRIPT") {
        var childrenPreformatted = preformatted || (element.tagName == "PRE");
        var text = "";
        for (var i = 0; i < element.childNodes.length; i++) {
            var child = element.childNodes.item(i);
            text += getTextContent(child, childrenPreformatted);
        }
        // Handle block elements that introduce newlines
        // -- From HTML spec:
        //<!ENTITY % block
        //     "P | %heading; | %list; | %preformatted; | DL | DIV | NOSCRIPT |
        //      BLOCKQUOTE | F:wORM | HR | TABLE | FIELDSET | ADDRESS">
        //
        // TODO: should potentially introduce multiple newlines to separate blocks
        if (element.tagName == "P" || element.tagName == "BR" || element.tagName == "HR" || element.tagName == "DIV") {
            text += "\n";
        }
        return text;
    }
    return "";
}

/**
 * Convert all newlines to \n
 */
//self
function normalizeNewlines(text) {
    return text.replace(/\r\n|\r/g, "\n");
}

/**
 * Replace multiple sequential spaces with a single space, and then convert &nbsp; to space.
 */
//self
function normalizeSpaces(text) {
    // IE has already done this conversion, so doing it again will remove multiple nbsp
    if (browserVersion.isIE) {
        return text;
    }

    // Replace multiple spaces with a single space
    // TODO - this shouldn"t occur inside PRE elements
    text = text.replace(/\ +/g, " ");

    // Replace &nbsp; with a space
    var nbspPattern = new RegExp(String.fromCharCode(160), "g");
    if (browserVersion.isSafari) {
        return replaceAll(text, String.fromCharCode(160), " ");
    } else {
        return text.replace(nbspPattern, " ");
    }
}
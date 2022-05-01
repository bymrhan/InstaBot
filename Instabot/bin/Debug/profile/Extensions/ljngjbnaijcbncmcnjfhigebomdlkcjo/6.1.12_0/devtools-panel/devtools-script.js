/**
 * Created by sanjay kumar on 5/12/16.
 */

var openedRecorder = false;
var openUploadModal = false;
var userEmail = 'Anonymous';
var SMsteps = [];
var SMstepsWithOutCmd = [];
var CPstepsWithOutCmd = [];
var CPsteps = [];
var backgroundPageConnection = chrome.runtime.connect({
    name: "devtools-page"
});
var smartMaintenancePlaceholder = "1. Open that webpage whose xpaths need to verify.\r\n2. Click on Editor icon.\r\n3. Update the driver command.\r\n4. Paste the selectors page or complete script in the box.\r\n5. Click on Ok.\r\n6. CP will show all the xpaths with their occurrence.\r\n7. You can also import/export the selectors file.";

var themeName = window.chrome.devtools.panels.themeName;
var iconColor = "grey";
if(themeName==="dark"){
    document.querySelector("#cssFile").setAttribute("href","devtoolsForDarkTheme.css");
    iconColor = "orange";
}else{
  document.querySelector("#cssFile").setAttribute("href","devtoolsForDefaultTheme.css");
  iconColor = "grey";
}

var OS = window.navigator.userAgent.includes('Mac')?"mac":"windows";
var browserLang = window.navigator.language;
var relXpathMatchingNodeLeft = "-18px";
var attrCheckbox = document.querySelectorAll(".attributeChoice");
if(OS.includes('mac')){
    document.querySelector(".selector-edit-box").style.width = 'calc(100% - 88px)';
    document.querySelector(".attributeChoice.user").style.width = 'calc(100% - 354px)';
    document.querySelector("label").style.margin = '4px 6px 3px 4px';
    // document.querySelector(".id-xpath").style.margin = '0px 0px 0px 8px';
    document.querySelector(".boxTitle").style.margin = '0px 2px 2px 0px';
    document.querySelector(".boxTitle").style.padding = '3px';
    if(browserLang.includes("zh")){ //this is fix for chinese language...chinese language code is zh
        document.querySelector(".selector-edit-box").style.width = 'calc(100% - 94px)';
        for(var i=0; i<5; i++){
            document.querySelectorAll(".selector-type")[i].style.width = '63px';
            document.querySelectorAll(".box.jsSelector")[i].style.width = 'calc(100% - 150px)';
        }
    }
    relXpathMatchingNodeLeft = "-18px";
    document.querySelector(".toggle-btn").style.margin = "-3px 0px 0px 6px";
    document.querySelector(".toggle-btn").style.lineHeight = "30px";
    document.querySelectorAll(".attributeChoice");
    for(var i=0; i<attrCheckbox.length-1; i++){
        attrCheckbox[i].style.verticalAlign = "sub";
    }
    document.querySelector(".uploadModalIcon").innerText = "click to upload downloaded xpath xls file.";

}else{
    document.querySelector(".selector-edit-box").style.width = 'calc(100% - 85px)';
    document.querySelector(".attributeChoice.user").style.width = 'calc(100% - 352px)';
    document.querySelector("label").style.margin = '4px 0px 3px 6px';
    // document.querySelector(".id-xpath").style.margin = '0px 0px 0px 12px';
    document.querySelector(".boxTitle").style.margin = '0px 0px 2px 0px';
    document.querySelector(".boxTitle").style.padding = '0px';
    relXpathMatchingNodeLeft = "-16px";
    document.querySelector(".toggle-btn").style.margin = "-6px 0px 0px 6px";
    document.querySelector(".toggle-btn").style.lineHeight = "29px";
    for(var i=0; i<attrCheckbox.length-1; i++){
        attrCheckbox[i].style.verticalAlign = "middle";
    }
    document.querySelector(".uploadModalIcon").innerText = "click to upload downloaded xpath csv file.";
}

var showTotalCount = false;
var showTotalResults = function(count) {
    var totalCountElem = document.querySelector(".jsTotalCount");
    var xpathOrCss = document.querySelector(".boxTitle").value;
    var inputBoxValue = document.querySelector(".jsXpath").value;
    try{
        if((count).includes("blank") || (count.length===1 && captureButton.className.includes("red")) || !inputBoxValue){
                totalCountElem.className += " hideCountMsg";
        }else{
            totalCountElem.classList.remove("hideCountMsg");
            var xpathValue = document.querySelector(".jsXpath").value;
            if(count.length === 0){
                totalCountElem.textContent = count.length+" element matching.";
            }else if(xpathValue==="/" || xpathValue==="." || xpathValue==="/."){
                totalCountElem.textContent = "It's default DOM.";
            }else if(xpathValue==="//."){
                totalCountElem.textContent = count.length+" matching all nodes.";
            }else{
                if(count.length===1){
                    totalCountElem.textContent = count.length+" element matching.";
                }else{
                    totalCountElem.textContent = count.length+" elements matching.";
                }
            }
        }
    }catch(err){

    }
    showTotalCount = false;
};

var showAllMatchingNode = function(allNode) {
    var nodeDom = document.querySelector("#chroPathEleContainer");
    var xpathOrCss = document.querySelector(".boxTitle").value.toLocaleLowerCase();
    var inputBoxValue = document.querySelector(".jsXpath").value;
    if(xpathOrCss.includes('xpath') || (xpathOrCss.includes('selectors') && !inputBoxValue) || inputBoxValue.charAt(0).includes('/')){
        xpathOrCss = "xpath";
    }else{
        xpathOrCss = "css";
    }
    nodeDom.innerHTML = "";
    if(allNode!="blank" && allNode[0].includes("<")){
        for (var i=1; i<=allNode.length; i++) {
            allNode[i-1] = allNode[i-1] ? allNode[i-1] : "";
            if(allNode[i-1]){
                var domStr = allNode[i-1];
                domStr = domStr.replace(/(\r\n|\n|\r)/gm,""); //replace new line with blank
                var elementToCreate = "";
                if(domStr.match(/^<td/) || domStr.match(/^<th/)) {
                  elementToCreate = "tr";
                } else if(domStr.match(/^<tr/)) {
                  elementToCreate = "tbody";
                } else if(domStr.match(/^<tbody/)) {
                  elementToCreate = "table";
                } else if(domStr.match(/^<body/)) {
                  domStr = domStr.replace('<body','<bodytag').replace('body>','bodytag>');
                  elementToCreate = "li";
                } else {
                  elementToCreate = "li";
                }
                var dummyElement = createElement(elementToCreate);
                dummyElement.innerHTML = domStr;

                var treeStructure = convertToTreeStructure(dummyElement, "parent closed");
                treeStructure.setAttribute(xpathOrCss, i);
                nodeDom.appendChild(treeStructure);

                
            }
        }
    }else{
        for (var i=1; i<=allNode.length; i++) {
            var dummyElement = createElement(elementToCreate);
            dummyElement.innerHTML = allNode[i-1];

            var treeStructure = convertToTreeStructure(dummyElement, "parent closed");
            treeStructure.setAttribute(xpathOrCss, i);
            nodeDom.appendChild(treeStructure);
        }
    }
};

var createDummyElement = function() {
   var domStr = '<nav></nav>';
  var dummyElement = createElement("div");
  dummyElement.innerHTML = domStr;
  var resultElem = document.querySelector(".result");  
  var treeStructure = convertToTreeStructure(dummyElement, "parent closed", domStr);
  resultElem.appendChild(treeStructure);
};

var selectElements = function(xpathOrCss, onChange) {
    attributeChoicesOption();
    var xpath = [xpathOrCss, document.querySelector(".jsXpath").value, onChange, ''+attributeChoices];
    if(!onChange){
        xpathOrCss = xpathOrCss.toLowerCase().includes("selectors")?"relXpath":xpathOrCss;
        xpath = [xpathOrCss, document.querySelector(".jsSelector."+xpathOrCss.substring(0,3)).getAttribute(xpathOrCss.toLowerCase()), false, ''+attributeChoices];
    }else{
        xpath = [xpathOrCss, document.querySelector(".jsXpath").value, onChange, ''+attributeChoices];        
    }
    clearElements();
    backgroundPageConnection.postMessage({
        name: "highlight-element",
        tabId: chrome.devtools.inspectedWindow.tabId,
        xpath: xpath
    });   
};

var secondPageUrl = "xyz";
backgroundPageConnection.onMessage.addListener(function(message) {
    var wrong;
    var iframe;
    var notIframe;
    var suggestedSelector;
    var xpathOrCss = document.querySelector(".boxTitle").value;
    var userSelectorValue = document.querySelector(".jsXpath").value;
    var iframeIcon = document.querySelector(".iframeIcon");
    var inputBox = document.querySelector(".xpath-input");
    var suggestedXpathContainer = document.querySelector(".selectorsContainer.suggestedXpath");
    var iframeXpathContainer = document.querySelector(".selectorsContainer.iframeXpath");
    suggestedXpathContainer.style.display="none";
    try{
        wrong  = (message.count).includes("wrongXpath");
        iframe = (message.count).includes("iframe");
        notIframe = (message.count).includes("notIframe");
        suggestedSelector = (message.count).includes("suggestedSelector");
    }
    catch(err){
    }   

    if(iframe){
        iframeIcon.style.display="block";
        inputBox.style.width = "calc(100% - 68px)";
        inputBox.style.marginLeft = "68px";
        var iframeXpathBox = document.querySelector(".jsSelector.iframeXpath");       
        iframeXpathContainer.style.display="block";
        if(message.count[1]===undefined){
            iframeXpathContainer.style.display="none";
        }else{
            //message.count[1][0] = addPrefix.className.includes('inactive')?message.count[1][0]:addPreCommandInSelector(message.count[1][0]);
            iframeXpathBox.innerText = addPrefix.className.includes('inactive')?message.count[1][0]:addPreCommandInSelector(message.count[1][0]);;
            iframeXpathBox.setAttribute("title",message.count[1][0]);
            document.querySelector(".numberOfMatchingNodes.iframeXpath").textContent = message.count[1][1];
        }
    }else if(suggestedSelector){
        var suggestedXpathBox = document.querySelector(".jsSelector.suggestedXpath");       
        suggestedXpathContainer.style.display="block";
        if(message.count[1]===undefined){
            suggestedXpathContainer.style.display="none";
        }else{
            message.count[1][0] = addPrefix.className.includes('inactive')?message.count[1][0]:addPreCommandInSelector(message.count[1][0]);
            suggestedXpathBox.innerText = message.count[1][0];
            suggestedXpathBox.setAttribute("title",message.count[1][0]);
            document.querySelector(".numberOfMatchingNodes.suggestedXpath").textContent = message.count[1][1];
        }
    }else{        
        if(wrong){
            // suggestedXpathContainer.style.display="none";
            highlightWrongXpath();
            message.count !== 'wrongXpath' && showTotalResults(message.count);
            return; 
        }else{
            removeWrongXpath();
            if(showTotalCount){
                showTotalResults(message.count);
            }
            try{
                if(document.querySelector(".jsXpath").value || message.count.length===1){
                    showAllMatchingNode(message.count);
                }
            }catch(err){

            }
            if(message.event) {
                if(message.event === "shown") {
                    selectElements(xpathOrCss, false);
                }
            }
        }
    }
    //scroll selectors to top 
    document.querySelector(".selectorsBlock").scrollTop=0;
});

function appendElementsCount(obj) {
    let ele = document.getElementById(obj.id); 
    let countClass = nodesColor(obj.elementCount);
    
    ele.textContent = `${obj.elementCount}`;
    ele.classList.add(countClass);

};

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {

    if(request.type === "elementsCount") {
        appendElementsCount(request);
    }

    if(request.message === "generate-selector" && !captureButton.className.includes("red")) {
        generateSelectors();
    }

    if(request.message === 'StopRecording') {
        document.querySelector('.recorderButton').classList.remove('redBlink');
    }

    if(request.message === 'AttachRecorder') {
        document.querySelector('.recorderButton').classList.add('redBlink');
        openedRecorder = true;
        updateRecorderAttr();
    }
    if(request.message === 'DeattachRecorder') {
        document.querySelector('.recorderButton').classList.remove('redBlink');
        openedRecorder = false;
    }
});

function updateRecorderAttr() {

    // var userAttr = userAttrName.value.trim();
    // var idChecked = idCheckbox.checked?"withid":"withoutid";
    var idChecked = idAttr.checked;
    var classChecked = classAttr.checked;
    var nameChecked = nameAttr.checked;
    var placeholderChecked = placeholderAttr.checked;
    var textChecked = textCheckbox.checked;

    backgroundPageConnection.postMessage({
        name: "recorderAttr",
        tabId: chrome.devtools.inspectedWindow.tabId,
        data: {
            idChecked,
            classChecked,
            nameChecked,
            placeholderChecked,
            textChecked,
            placeholderText: preCommandInput.value
        }
    });
};

backgroundPageConnection.postMessage({
    name: "init",
    tabId: chrome.devtools.inspectedWindow.tabId,
    contentScript: "../content-script/contentScript.js",
    contentCSS: "../content-script/contentScript.css"
});

document.addEventListener("DOMContentLoaded", async  function() {
    
    var inputBox = document.querySelector(".jsXpath");
    var attributeChoiceBox = document.querySelector(".attributeChoice.user");
    preCommandInput.style.visibility = "hidden";
    var copyButton = document.querySelector(".header-copy-btn");
    inputBox.focus();
    var boxTitle = document.querySelector(".boxTitle");
    
    boxTitle.addEventListener("change", function(event){
        let relXpath = document.getElementById('relXpathSelector');
        if(event.target.value === 'relXpath'){
            relXpath.classList.add('listPosition');
        }else {
            relXpath.classList.remove('listPosition');
        }

    });
    
    inputBox.addEventListener("search", function(event){
        if(!document.querySelector(".jsXpath").value){
            generateSelectors();
        }
    });
    
    inputBox.addEventListener("keyup", function(event){
            var xpathOrCss = boxTitle.value;
            var key = event.which || event.keyCode;
            
            if (key === 13) { 
                showTotalCount = true;
                selectElements(xpathOrCss, true); //here passing true to tell CP to suggest selectors
            }else if(document.querySelector(".jsXpath").value){
                checkWrongXpath();
            }
            
    });


    attributeChoiceBox.addEventListener("keyup", function(event){
            var key = event.which || event.keyCode;
            
            if (key === 13) { 
                generateSelectors();
                generateSuggestedXpath();
            }
    });

    preCommandInput.addEventListener("keyup", function(event){
            var key = event.which || event.keyCode;

            this.value = this.value.replace(/“/g,'"').replace(/”/g,'"');
            
            if (key === 13) {
                this.value.replace(/xpathvalue/i, 'xpathvalue'); 
                if(!this.value.toLowerCase().includes('xpathvalue')) {
                    this.classList.add('wrongXpath');
                    document.querySelector('.helpIcon').style.visibility = "visible";
                    showSnackbar('xpathValue keyword should be there in the command.');
                    return;
                }
                generateSelectors();
                generateSuggestedXpath();

                if(smartMaintenance.classList.contains('defaultSmartMaintenance')) {
                    updateSMSteps();
                }

                if(captureButton.classList.contains("red")) {
                    updateChroPathSteps();
                }

            }

            if(!this.value.toLowerCase().includes('xpathvalue')) {
                this.classList.add('wrongXpath');
                document.querySelector('.helpIcon').style.visibility = "visible";
                addPrefix.classList.add('inactive');
                addPrefix.classList.remove('active');
            }else if(this.value.toLowerCase().includes('xpathvalue')) {
                this.classList.remove('wrongXpath');
                document.querySelector('.helpIcon').style.visibility = "hidden";
                addPrefix.classList.remove('inactive');
                addPrefix.classList.add('active');
            }
    });

    addClickHandlers();  
    clickToCopyBoxValue();

    clickToCopyIframeXpath();
    clickToEditIframeXpath();

    clickToCopySuggestedXpath();
    clickToEditSuggestedXpath();

    clickToCopyRelXpath();
    clickToEditRelXpath();

    clickToCopyId();
    clickToEditId();

    clickToCopyName();
    clickToEditName();

    clickToCopyClassName();
    clickToEditClassName();

    clickToCopyCss(); 
    clickToEditCss(); 

    clickToCopyLinkText(); 
    clickToEditLinkText(); 

    clickToCopyPartialLinkText(); 
    clickToEditPartialLinkText(); 

    clickToCopyTagName();
    clickToEditTagName();

    clickToCopyAbsXpath(); 
    clickToEditAbsXpath(); 

    setTimeout(() => {
    }, 2000)

});


function generateAbsXpath(){
    var xpathOrCss = document.querySelector(".boxTitle").value.toLowerCase();
    var absXpath = "";
    var totalMatchingNode = "";
    var absXPath = chrome.devtools.inspectedWindow.eval('generateAbsXpath($0)', { useContentScriptContext: true }, function(result) {
        var inputBox = document.querySelector(".jsSelector.abs");
        var absXpathContainer = document.querySelector(".selectorsContainer.absXpath");
        if(result===undefined){
            absXpath = "This element might be inside iframe from different src. Currently ChroPath doesn't support for them.";
            totalMatchingNode = "0";
            if(!xpathOrCss.includes("abs")){
                absXpathContainer.style.display="none";
            }
        }else{
            absXpath = result[0];
            totalMatchingNode = result[1];
        }
        inputBox.setAttribute("absXpath", absXpath);
        inputBox.setAttribute("title", absXpath);

        absXpath = addPrefix.className.includes('inactive')?absXpath:addPreCommandInSelector(absXpath);
        inputBox.innerText = absXpath;

        var count = document.querySelector(".numberOfMatchingNodes.absXpath");
        count.textContent = totalMatchingNode;
        count.style.backgroundColor = totalMatchingNode=="1"?"#15b515":totalMatchingNode=="0"?"#ff0000":"#f78f06";
    
        if(xpathOrCss.includes("abs")){
            selectElements(xpathOrCss, false);
            document.querySelector(".numberOfMatchingNodes.absXpath").parentElement.style.width = "26px";
        }
        if(totalMatchingNode == "0" && !xpathOrCss.includes("abs")){
            absXpathContainer.style.display="none";
        }
    });
}

function generateCss(){
    var xpathOrCss = document.querySelector(".boxTitle").value;
    var totalMatchingNode = "";
    var css = chrome.devtools.inspectedWindow.eval('generateCSS($0)', { useContentScriptContext: true }, function(result) {
        var inputBox = document.querySelector(".jsSelector.css");
        var cssContainer = document.querySelector(".selectorsContainer.cssSelector");
        var count = document.querySelector(".numberOfMatchingNodes.cssSelector");
        cssContainer.style.display="";
        if(result===undefined || result[1]==0){
            inputBox.textContent = "This element might be pseudo element/comment/inside iframe from different src. Currently ChroPath doesn't support for them.";
            count.textContent = "0";
            if(!xpathOrCss.includes("css")){
                cssContainer.style.display="none";
            }
        }else{
            inputBox.setAttribute("css", result[0]);
            inputBox.setAttribute("title", result[0]);
            result[0] = addPrefix.className.includes('inactive')?result[0]:addPreCommandInSelector(result[0]);
            result[0] = result[0].includes("By.xpath")?result[0].replace("By.xpath", "By.cssSelector"):result[0].includes("By(xpath")?result[0].replace("By(xpath", "By(cssSelector"):result[0].includes("ByXPath")?result[0].replace("ByXPath", "ByCssSelector"):result[0].includes("XPath")?result[0].replace("XPath", "CssSelector"):result[0].includes("Xpath")?result[0].replace("Xpath", "CssSelector"):result[0].includes("XPATH")?result[0].replace("XPATH", "CSSSELECTOR"):result[0].replace("xpath","cssSelector");
            
            inputBox.innerText = result[0];
            totalMatchingNode = result[1];
            
            count.textContent = totalMatchingNode;
            count.style.backgroundColor = totalMatchingNode=="1"?"#15b515":totalMatchingNode=="0"?"#ff0000":"#f78f06";

            if(xpathOrCss.includes("css")){
                selectElements(xpathOrCss, false);
                document.querySelector(".numberOfMatchingNodes.cssSelector").parentElement.style.width = "26px";
            }
            if(totalMatchingNode == "0" && !xpathOrCss.includes("css")){
                cssContainer.style.display="none";
            }
        }
    });
}

function generateId(){
    var id = chrome.devtools.inspectedWindow.eval('generateId($0)', { useContentScriptContext: true }, function(result) {
        var inputBox = document.querySelector(".jsSelector.id");
        var idContainer = document.querySelector(".selectorsContainer.id");
        idContainer.style.display="";
        if(result===undefined || result[1]===0){
            idContainer.style.display="none";
        }else{
            //linkTextHeight = 25;
            inputBox.setAttribute("selector", result[0]);
            inputBox.setAttribute("title", result[0]);
            result[0] = addPrefix.className.includes('inactive')?result[0]:addPreCommandInSelector(result[0]);
            result[0] = result[0].includes("By.xpath")?result[0].replace("By.xpath", "By.id"):result[0].includes("By(xpath")?result[0].replace("By(xpath", "By(id"):result[0].includes("ByXPath")?result[0].replace("ByXPath", "ById"):result[0].includes("XPath")?result[0].replace("XPath", "Id"):result[0].includes("Xpath")?result[0].replace("Xpath", "Id"):result[0].includes("XPATH")?result[0].replace("XPATH", "ID"):result[0].replace("xpath", "id");
            inputBox.innerText = result[0];
            var totalMatchingNode = result[1];
            var count = document.querySelector(".numberOfMatchingNodes.id");
            count.textContent = totalMatchingNode;
            count.style.backgroundColor = totalMatchingNode=="1"?"#15b515":totalMatchingNode=="0"?"#ff0000":"#f78f06";
        }
    });
}

function generateClassName(){
    var className = chrome.devtools.inspectedWindow.eval('generateClassName($0)', { useContentScriptContext: true }, function(result) {
        var inputBox = document.querySelector(".jsSelector.className");
        var classNameContainer = document.querySelector(".selectorsContainer.className");
        classNameContainer.style.display="";
        if(result===undefined || result[1]===0){
            classNameContainer.style.display="none";
        }else{
            //linkTextHeight = 25;
            inputBox.setAttribute("selector", result[0]);
            inputBox.setAttribute("title", result[0]);
            result[0] = addPrefix.className.includes('inactive')?result[0]:addPreCommandInSelector(result[0]);
            result[0] = result[0].includes("By.xpath")?result[0].replace("By.xpath", "By.className"):result[0].includes("By(xpath")?result[0].replace("By(xpath", "By(className"):result[0].includes("ByXPath")?result[0].replace("ByXPath", "ByClassName"):result[0].includes("XPath")?result[0].replace("XPath", "ClassName"):result[0].includes("Xpath")?result[0].replace("Xpath", "ClassName"):result[0].includes("XPATH")?result[0].replace("XPATH", "CLASSNAME"):result[0].replace("xpath", "className");
            inputBox.innerText = result[0];
            var totalMatchingNode = result[1];
            var count = document.querySelector(".numberOfMatchingNodes.className");
            count.textContent = totalMatchingNode;
            count.style.backgroundColor = totalMatchingNode=="1"?"#15b515":totalMatchingNode=="0"?"#ff0000":"#f78f06";
        }
    });
}

function generateName(){
    var name = chrome.devtools.inspectedWindow.eval('generateName($0)', { useContentScriptContext: true }, function(result) {
        var inputBox = document.querySelector(".jsSelector.name");
        var nameContainer = document.querySelector(".selectorsContainer.name");
        nameContainer.style.display="";
        if(result===undefined || result.length===0){
            // result[0] = "couldn't find unique name.";
            nameContainer.style.display="none";
        }else{
            //linkTextHeight = 25;
            inputBox.setAttribute("selector", result[0]);
            inputBox.setAttribute("title", result[0]);
            result[0] = addPrefix.className.includes('inactive')?result[0]:addPreCommandInSelector(result[0]);
            result[0] = result[0].includes("By.xpath")?result[0].replace("By.xpath", "By.name"):result[0].includes("By(xpath")?result[0].replace("By(xpath", "By(name"):result[0].includes("ByXPath")?result[0].replace("ByXPath", "ByName"):result[0].includes("XPath")?result[0].replace("XPath", "Name"):result[0].includes("Xpath")?result[0].replace("Xpath", "Name"):result[0].includes("XPATH")?result[0].replace("XPATH", "NAME"):result[0].replace("xpath", "name");
            inputBox.innerText = result[0];
            var totalMatchingNode = result[1];
            var count = document.querySelector(".numberOfMatchingNodes.name");
            count.textContent = totalMatchingNode;
            count.style.backgroundColor = totalMatchingNode=="1"?"#15b515":totalMatchingNode=="0"?"#ff0000":"#f78f06";
        }
    });
}

function generateTagName(){
    var tagName = chrome.devtools.inspectedWindow.eval('generateTagName($0)', { useContentScriptContext: true }, function(result) {
        var inputBox = document.querySelector(".jsSelector.tagName");
        var tagNameContainer = document.querySelector(".selectorsContainer.tagName");
        tagNameContainer.style.display="";
        if(result===undefined || result[1]===0){
            // result = "couldn't find unique tagName.";
            tagNameContainer.style.display="none";
        }else{
            //linkTextHeight = 25;
            inputBox.setAttribute("selector", result[0]);
            inputBox.setAttribute("title", result[0]);
            result[0] = addPrefix.className.includes('inactive')?result[0]:addPreCommandInSelector(result[0]);
            result[0] = result[0].includes("By.xpath")?result[0].replace("By.xpath", "By.tagName"):result[0].includes("By(xpath")?result[0].replace("By(xpath", "By(tagName"):result[0].includes("ByXPath")?result[0].replace("ByXPath", "ByTagName"):result[0].includes("XPath")?result[0].replace("XPath", "TagName"):result[0].includes("Xpath")?result[0].replace("Xpath", "TagName"):result[0].includes("XPATH")?result[0].replace("XPATH", "TAGNAME"):result[0].replace("xpath", "tagName");
            inputBox.innerText = result[0];
            var totalMatchingNode = result[1];
            var count = document.querySelector(".numberOfMatchingNodes.tagName");
            count.textContent = totalMatchingNode;
            count.style.backgroundColor = totalMatchingNode=="1"?"#15b515":totalMatchingNode=="0"?"#ff0000":"#f78f06";
        }
         //set the width of matching node numbers
         setWidthOfSelectorHeader();
    });
}

function generateLinkText(){
    var linkText = chrome.devtools.inspectedWindow.eval('generateLinkText($0)', { useContentScriptContext: true }, function(result) {
        var inputBox = document.querySelector(".jsSelector.linkText");
        var linkTextContainer = document.querySelector(".selectorsContainer.linkText");
        linkTextContainer.style.display="";
        if(result===undefined || result[1]===0){
            // result = "couldn't find unique linkText.";
            linkTextContainer.style.display="none";
        }else{
            //linkTextHeight = 25;
            inputBox.setAttribute("selector", result[0]);
            inputBox.setAttribute("title", result[0]);
            result[0] = addPrefix.className.includes('inactive')?result[0]:addPreCommandInSelector(result[0]);
            result[0] = result[0].includes("By.xpath")?result[0].replace("By.xpath", "By.linkText"):result[0].includes("By(xpath")?result[0].replace("By(xpath", "By(linkText"):result[0].includes("ByXPath")?result[0].replace("ByXPath", "ByLinkText"):result[0].includes("XPath")?result[0].replace("XPath", "LinkText"):result[0].includes("Xpath")?result[0].replace("Xpath", "LinkText"):result[0].includes("XPATH")?result[0].replace("XPATH", "LINKTEXT"):result[0].replace("xpath", "linkText");
            inputBox.innerText = result[0];
            var totalMatchingNode = result[1];
            var count = document.querySelector(".numberOfMatchingNodes.linkText");
            count.textContent = totalMatchingNode;
            count.style.backgroundColor = totalMatchingNode=="1"?"#15b515":totalMatchingNode=="0"?"#ff0000":"#f78f06";
        }
    });
}

function generatePartialLinkText(){
    var partialLinkText = chrome.devtools.inspectedWindow.eval('generatePartialLinkText($0)', { useContentScriptContext: true }, function(result) {
        var inputBox = document.querySelector(".jsSelector.partialLinkText");
        var partialLinkTextContainer = document.querySelector(".selectorsContainer.partialLinkText");
        partialLinkTextContainer.style.display="";
        if(result===undefined || result[1]===0){
            // result = "couldn't find unique partialLinkText.";
            partialLinkTextContainer.style.display="none";
        }else{
            // partialLinkTextHeight = 25;
        
            inputBox.setAttribute("selector", result[0]);
            inputBox.setAttribute("title", result[0]);
            result[0] = addPrefix.className.includes('inactive')?result[0]:addPreCommandInSelector(result[0]);
            result[0] = result[0].includes("By.xpath")?result[0].replace("By.xpath", "By.partialLinkText"):result[0].includes("By(xpath")?result[0].replace("By(xpath", "By(partialLinkText"):result[0].includes("ByXPath")?result[0].replace("ByXPath", "ByPartialLinkText"):result[0].includes("XPath")?result[0].replace("XPath", "PartialLinkText"):result[0].includes("Xpath")?result[0].replace("Xpath", "PartialLinkText"):result[0].includes("XPATH")?result[0].replace("XPATH", "PARTIALLINKTEXT"):result[0].replace("xpath", "partialLinkText");
            inputBox.innerText = result[0];
            var totalMatchingNode = result[1];
            var count = document.querySelector(".numberOfMatchingNodes.partialLinkText");
            count.textContent = totalMatchingNode;
            count.style.backgroundColor = totalMatchingNode=="1"?"#15b515":totalMatchingNode=="0"?"#ff0000":"#f78f06";
        }
    });
}

function updateGAEvents() {
    var idChecked = idAttr.checked?"withid":"withoutid";
    var classChecked = classAttr.checked?"withclass":"withoutclass";
    var nameChecked = nameAttr.checked?"withname":"withoutname";
    var placeholderChecked = placeholderAttr.checked;
    var textChecked = textCheckbox.checked;
};

function generateSelectors() {
    
    var idChecked = idAttr.checked?"withid":"withoutid";
    var classChecked = classAttr.checked?"withclass":"withoutclass";
    var nameChecked = nameAttr.checked?"withname":"withoutname";
    var placeholderChecked = placeholderAttr.checked;
    var textChecked = textCheckbox.checked;
    
    attributeChoices = [idChecked,classChecked,nameChecked];
    var relXpathContainer = document.querySelector(".selectorsContainer.relXpath");
    var idContainer = document.querySelector(".selectorsContainer.id");
    var cssContainer = document.querySelector(".selectorsContainer.cssSelector");
    var classNameContainer = document.querySelector(".selectorsContainer.className");
    var nameContainer = document.querySelector(".selectorsContainer.name");
    var linkTextContainer = document.querySelector(".selectorsContainer.linkText");
    var partialLinkTextContainer = document.querySelector(".selectorsContainer.partialLinkText");
    var absXpathContainer = document.querySelector(".selectorsContainer.absXpath");
    var tagNameContainer = document.querySelector(".selectorsContainer.tagName");

    toggleElement = document.querySelector(".toggle-btn");
    if(toggleElement.classList.contains("active")){
        
        var inputBox = document.querySelector(".jsXpath");
        var userSelectorValue = document.querySelector(".jsXpath").value;
        var xpathOrCss = document.querySelector(".boxTitle").value;
        var copyButton = document.querySelector(".header-copy-btn");
        inputBox.focus();
        var boxTitle = document.querySelector(".boxTitle");
        if(themeName==="dark"){
            boxTitle.style.backgroundColor = "#e8b215";
        }else{
            boxTitle.style.backgroundColor = "#000000";
        }
        
        if(xpathOrCss.includes("selectors") && !captureButton.className.includes("red")){
            relXpathContainer.style.display="";
            idContainer.style.display="";
            cssContainer.style.display="";
            classNameContainer.style.display="";
            nameContainer.style.display="";
            linkTextContainer.style.display="";
            partialLinkTextContainer.style.display="";
            absXpathContainer.style.display="";
            tagNameContainer.style.display="";
        }
        
        if(xpathOrCss.includes("selectors") || !xpathOrCss){
            //document.querySelector(".jsXpath").value="";
            inputBox.setAttribute("placeholder"," type selector and press enter");
            copyButton.setAttribute("title","click to copy selector value from box");
            
            generateColoredRelXpath();
            generateCss();
            generateAbsXpath();
            generateId();
            generateClassName();
            generateName();
            generateLinkText();
            generatePartialLinkText();
            generateTagName();
        }else if(xpathOrCss.includes("rel")){
            relXpathContainer.style.display="";
            idContainer.style.display="none";
            cssContainer.style.display="none";
            classNameContainer.style.display="none";
            nameContainer.style.display="none";
            linkTextContainer.style.display="none";
            partialLinkTextContainer.style.display="none";
            absXpathContainer.style.display="none";
            tagNameContainer.style.display="none";
            generateColoredRelXpath();
        }else if(xpathOrCss.includes("abs")){
            relXpathContainer.style.display="none";
            idContainer.style.display="none";
            cssContainer.style.display="none";
            classNameContainer.style.display="none";
            nameContainer.style.display="none";
            linkTextContainer.style.display="none";
            partialLinkTextContainer.style.display="none";
            absXpathContainer.style.display="";
            tagNameContainer.style.display="none";
            generateAbsXpath();
        }else if(xpathOrCss.includes("css")){
            relXpathContainer.style.display="none";
            idContainer.style.display="none";
            cssContainer.style.display="";
            classNameContainer.style.display="none";
            nameContainer.style.display="none";
            linkTextContainer.style.display="none";
            partialLinkTextContainer.style.display="none";
            absXpathContainer.style.display="none";
            tagNameContainer.style.display="none";
            generateCss(); 
        }   
    }
}

var attributeChoices = [];
// var idCheckbox = document.querySelector(".id-xpath");
var idAttr = document.querySelector(".attributeChoice.id");
var classAttr = document.querySelector(".attributeChoice.class");
var nameAttr = document.querySelector(".attributeChoice.name");
var placeholderAttr = document.querySelector(".attributeChoice.placeholder");
var userAttrName = document.querySelector(".attributeChoice.user");
var textCheckbox = document.querySelector(".attributeChoice.textXpath");
var preCommandInput = document.querySelector(".pre-command");

userAttrName.addEventListener("keyup", function(event){
    var userAttr = userAttrName.value.trim();
    chrome.storage.local.set({'userAttrName':userAttr}, function(){});

});

chrome.storage.local.get(['userAttrName'], function(result){
    userAttrName.value = result.userAttrName==undefined?"":result.userAttrName;
});

function attributeChoicesOption(){
    var userAttr = userAttrName.value.trim();
    // var idChecked = idCheckbox.checked?"withid":"withoutid";
    var idChecked = idAttr.checked?"withid":"withoutid";
    var classChecked = classAttr.checked?"withclass":"withoutclass";
    var nameChecked = nameAttr.checked?"withname":"withoutname";
    var placeholderChecked = placeholderAttr.checked?"withplaceholder":"withoutplaceholder";
    var textChecked = textCheckbox.checked?"withtext":"withouttext";

    attributeChoices = [userAttr, idChecked,classChecked,nameChecked,placeholderChecked,textChecked];
}

function generateColoredRelXpath(){
    attributeChoicesOption();
    var relXpath = "";
    var totalMatchingNode = "";
    var xpathOrCss = document.querySelector(".boxTitle").value.toLowerCase();
    var relXPath = chrome.devtools.inspectedWindow.eval('generateRelXpath($0, "'+attributeChoices+'")', { useContentScriptContext: true }, function(result) {
        var inputBox = document.querySelector(".jsSelector.rel");
        if(result===undefined){
            relXpath = "This element might be inside iframe from different src. Currently ChroPath doesn't support for them.";
            totalMatchingNode = "0";
        }else{
            relXpath = result[0];
            totalMatchingNode = result[1];
        }

        inputBox.setAttribute("selectors", relXpath);
        inputBox.setAttribute("relXpath", relXpath);
        inputBox.setAttribute("title", relXpath);

        var preCommandValue = preCommandInput.value.trim();
        preCommandValue = preCommandValue.replace(/“/g,'"').replace(/”/g,'"');
        var p1 = "";
        var p2 = "";
        if(!addPrefix.className.includes('inactive') && result!==undefined && preCommandValue){
            if(preCommandValue.includes('xpathvalue')){
                p1 = preCommandValue.split("xpathvalue")[0];
                p2 = preCommandValue.split("xpathvalue")[1];
            }else if(preCommandValue.includes('xpathValue')){
                p1 = preCommandValue.split("xpathValue")[0];
                p2 = preCommandValue.split("xpathValue")[1];
            }else if(preCommandValue.includes('cssValue')){
                p1 = preCommandValue.split("cssValue")[0];
                p2 = preCommandValue.split("cssValue")[1];
            }else if(preCommandValue.includes('cssvalue')){
                p1 = preCommandValue.split("cssvalue")[0];
                p2 = preCommandValue.split("cssvalue")[1];
            }else if(preCommandValue.includes('cssSelectoValue')){
                p1 = preCommandValue.split("cssSelectoValue")[0];
                p2 = preCommandValue.split("cssSelectoValue")[1];
            }else if(preCommandValue.includes('cssselectovalue')){
                p1 = preCommandValue.split("cssselectovalue")[0];
                p2 = preCommandValue.split("cssselectovalue")[1];
            }else{
                p1 = preCommandValue.split(`"`)[0]+'"';
                p2 = '"'+preCommandValue.split(`"`)[2];
                // p2 = '"'+p2temp.split(`"`)[1];
            }
        }
        
        inputBox.innerHTML = "";
        var v0 = "//";

        var p1Tag = createElement("span", "p1-label");
        p1Tag.innerText = p1;
        inputBox.appendChild(p1Tag);

        var v0Tag = createElement("span", "v0-label");
        v0Tag.innerText = v0;
        inputBox.appendChild(v0Tag);

        var slash = "";
        var splitXpath = "";
        if(relXpath.slice(2).includes('//')){
            splitXpath = relXpath.split('//')
            slash = "//";
        }else if(relXpath.slice(2).includes('/')){
            splitXpath = relXpath.slice(1).split('/');
            slash = "/";
        }else{
            splitXpath = relXpath.split('//');
        }


        if(!relXpath.includes("[")){
            inputBox.removeChild(v0Tag);
            var absTag = createElement("span", "abs-label");
            absTag.innerText = relXpath;
            inputBox.appendChild(absTag);
        }else{
            for(var i = 1; i < splitXpath.length; i++){
                var v1 = "";
                if(!splitXpath[i].includes("[")){
                    if(i===1){
                        v1 = splitXpath[i];
                    }else{
                        v1 = slash+splitXpath[i];
                    }
                    var v1Tag = createElement("span", "v1-label");
                    v1Tag.innerText = v1;
                    inputBox.appendChild(v1Tag);
                }else{
                    
                    if(i===1){
                        v1 = splitXpath[i].split("[")[0]+"[";
                    }else{
                        v1 = slash+splitXpath[i].split("[")[0]+"[";
                    }
                    var v1Tag = createElement("span", "v1-label");
                    v1Tag.innerText = v1;
                    inputBox.appendChild(v1Tag);
                    
                    if(!splitXpath[i].split("[")[1].includes("'") || splitXpath[i].split("'").length>3){
                        var v8Tag = createElement("span", "v4-label");
                        // var v8 = splitXpath[i].split("[")[1];
                        var v8 = splitXpath[i].substr(splitXpath[i].indexOf('[')+1);
                        v8Tag.innerText = v8;
                        inputBox.appendChild(v8Tag);
                    }else {
                        var v2 = splitXpath[i].split("[")[1].split("'")[0]+"'";
                        var v3 = splitXpath[i].split("[")[1].split("'")[1];
                        var v4 = "'"+splitXpath[i].split("[")[1].split("'")[2];
                        var v2Tag = createElement("span", "v2-label");
                        v2Tag.innerText = v2.includes(undefined)?"":v2;
                        inputBox.appendChild(v2Tag);

                        var v3Tag = createElement("span", "v3-label");
                        v3Tag.innerText = v3.includes(undefined)?"":v3;
                        inputBox.appendChild(v3Tag);

                        var v4Tag = createElement("span", "v4-label");
                        v4Tag.innerText = v4.includes(undefined)?"":v4;
                        inputBox.appendChild(v4Tag);

                        if(splitXpath[i].split("[").length > 2){
                            
                            if("["+splitXpath[i].split("[")[2].split("'")[0].length>1){
                                var v5 = "["+splitXpath[i].split("[")[2].split("'")[0]+"'";
                                var v6 = splitXpath[i].split("[")[2].split("'")[1];
                                var v7 = "'"+splitXpath[i].split("[")[2].split("'")[2];

                                var v5Tag = createElement("span", "v2-label");
                                v5Tag.innerText = v5.includes(undefined)?"":v5;
                                inputBox.appendChild(v5Tag);

                                var v6Tag = createElement("span", "v3-label");
                                v6Tag.innerText = v6.includes(undefined)?"":v6;
                                inputBox.appendChild(v6Tag);

                                var v7Tag = createElement("span", "v4-label");
                                v7Tag.innerText = v7.includes(undefined)?"":v7;
                                inputBox.appendChild(v7Tag);
                            }else{
                                var v5 = "["+splitXpath[i].split("[")[2].split("'")[0];
                                var v5Tag = createElement("span", "v2-label");
                                v5Tag.innerText = v5.includes(undefined)?"":v5;
                                inputBox.appendChild(v5Tag);
                            }
                        }
                    }
                }
            }
        }
        var p2Tag = createElement("span", "p2-label");
        p2Tag.innerText = p2;
        inputBox.appendChild(p2Tag);
        document.querySelector(".numberOfMatchingNodes.relXpath").textContent = totalMatchingNode;

        document.querySelector(".numberOfMatchingNodes.relXpath").style.backgroundColor = totalMatchingNode=="1"?"#15b515":totalMatchingNode=="0"?"#ff0000":"#f78f06";

        var alertTitle = "";
        var alertIcon = document.querySelector(".alertIcon");
        var alertToolTip = document.querySelector(".alert.toolTip");
        var matchingNodesContainer = document.querySelector(".relXpath span.matchingNodesContainer");
        alertIcon.style.display="none";
        matchingNodesContainer.style.marginLeft = "0px";
        if(result){
            if(result[2] || result[3]) {
                alertIcon.style.display="";
                matchingNodesContainer.style.marginLeft = relXpathMatchingNodeLeft;
                if(result[2] && result[3]){
                    alertTitle = "id & class both look dynamic. Uncheck the id & class checkbox to generate rel xpath without them if it is generated with them.";
                }else if(result[2]){
                    alertTitle = result[2]+" looks dynamic. Uncheck the "+result[2]+ " checkbox/delete the "+result[2]+" attribute from attribute box to generate rel xpath without "+result[2]+" if it is generated with "+result[2]+".";
                }else {
                    alertIcon.style.display="none";
                } 
                alertToolTip.innerText=alertTitle;
            }
        }
        selectElements(xpathOrCss, false);
        if(xpathOrCss.includes("rel")){
            document.querySelector(".numberOfMatchingNodes.relXpath").parentElement.style.width = "26px";
        }
    });
}

var highlightWrongXpath = function() {
    var inputBox = document.querySelector(".xpath-input");
    inputBox.className += " wrongXpath";
};

var removeWrongXpath = function() {
    try{
        var inputBox = document.querySelector(".xpath-input.wrongXpath");
        inputBox.classList.remove("wrongXpath");
    }
    catch(err){
    }
};

var checkWrongXpath = function(){
    var inputBox = document.querySelector(".jsXpath");
    var xpathValue = inputBox.value;
    var totalCountElem = document.querySelector(".jsTotalCount");
    var xpathOrCss = document.querySelector(".boxTitle").value;
    if(xpathOrCss.includes('XPath') || (xpathOrCss.includes('selectors') && !xpathValue) || xpathValue.charAt(0).includes('/') || xpathValue.substr(0,2).includes('./') || xpathValue.charAt(0).includes('(') || xpathValue==='.'){
        xpathOrCss = "XPath";
    }else{
        xpathOrCss = "CSS";
    }
    if(!xpathValue){
        totalCountElem.className += " hideCountMsg";
        selectElements(xpathOrCss, false);
        clearElements();
    }
    if(inputBox.getAttribute("class").includes("wrongXpath")){
        removeWrongXpath();
    }

    if(xpathValue){
        try{
            if(xpathOrCss.includes("XPath")){
                elements = document.evaluate(xpathValue, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            }else if(xpathOrCss==="CSS"){
                elements = document.querySelectorAll(xpathValue);
            }
        }catch(err){
            highlightWrongXpath();    
        }
    }   
}

var clearElements = function(){
    var listElements = document.querySelector("#chroPathEleContainer");
    var countElement = document.querySelector(".jsTotalCount");
    countElement.innerHTML = "";
    listElements.innerHTML = "";
}

chrome.devtools.panels.elements.onSelectionChanged.addListener(function(){
    if(!captureButton.className.includes("red")){
        generateSelectors();
    }
});

function changeBackground(event) {
    var color = event.target.value;
    document.body.style.background = color;
}

// document.querySelector(".theme-color").addEventListener("change",changeBackground);

var createElement = function(elementName, classList) {
  var element = document.createElement(elementName);
  
  if(classList) {
    element.setAttribute("class", classList);
  }
  
  return element;
}

var elementRegEx = /(?:^(<.+?>)(.+)(<\/.+?>)$)|(?:^(<.+?>)$)/;
    
var getOpenCloseTag = function(element) {
  var matches = elementRegEx.exec(element.outerHTML);
  var openTag = '', closeTag = '';
  if(matches) {
    openTag = matches[1] ? matches[1] : matches[0];
    closeTag = matches[3] ? matches[3] : '';
  }
  return {
    openTag: openTag,
    closeTag: closeTag
  };
};

var getTextNodeWrapper = function (textNode) {
  /* get wrapper node for a text node */
  var wrapper = createElement("div", "child level-padding");
  wrapper.innerText = textNode.textContent;
  return wrapper;
}

var getWrapperNode = function(element, classList) {
  var openCloseTag = getOpenCloseTag(element);
  
  if(element.nodeType === Node.TEXT_NODE) {
    /* text node, just wrap in a div and return */
    return getTextNodeWrapper(element);
  }
  
  if((element.childNodes && element.childNodes.length === 0) && !element.textContent) {
    /* reached a leaf node */
    classList = "leaf-node level-padding";
  }
  
  /* add open tag */
  var wrapper = createElement("div", classList);
  var openTagText = createElement("span", "open-tag-label");
  openTagText.innerText = openCloseTag.openTag;
  wrapper.appendChild(openTagText);
  
  /* get children tags */
  if((element.childNodes && element.childNodes.length > 0) || element.textContent) {
    /* element has children, recursively parse them */
    childElements = convertToTreeStructure(element, "child level-padding closed");
    wrapper.appendChild(childElements)
  }
  
  /* add close tag */
  var closeTagText = createElement("span", "close-tag-label");
  closeTagText.innerText = openCloseTag.closeTag;
  wrapper.appendChild(closeTagText);
  return wrapper;
};

var convertToTreeStructure = function (node, classList) {
  var element, openTag;
  var childElements, wrapper;
  if(!node.childElementCount) {
    /* reached a text node */
    classList = "text-node level-padding";
    wrapper = createElement("div", classList);
    wrapper.innerText = node.textContent;
    return wrapper;
  }
 
  if(node.childNodes.length > 1) {
    /* loop & recurse through all children */
    var children = node.childNodes;
    var parentWrapper = createElement("div", (classList + " children-cont"));
    for(var i = 0; i < children.length; i++) {
      element = children[i];
      wrapper = getWrapperNode(element, "child closed");
      parentWrapper.appendChild(wrapper);
    }
    return parentWrapper;
  } else {
    /* element has only one child */
    element = node.childNodes[0];
    wrapper = getWrapperNode(element, classList);
    return wrapper;
  }
};

var onClickHandler = function(event) {
  event.preventDefault();
  event.stopPropagation();
  var target = event.target;
  var idName = target.id;
  if(!idName.includes("chroPathEleContainer")){
    if(document.querySelector(".selectedNode")){
      if(themeName==="dark"){
        document.querySelector(".selectedNode").style.backgroundColor="#2f2d2d8c";
      }else{
        document.querySelector(".selectedNode").style.backgroundColor="white";
      }
      document.querySelector(".selectedNode").classList.remove("selectedNode");
    }
    target.classList.add("selectedNode");
    target.style.backgroundColor="#9e9e9e5c";
  }
  var classes = target.className;
  
   if(!classes.includes("open-tag-label") && !classes.includes("close-tag-label") && classes.length!=0 && !idName.includes("chroPathEleContainer")){
      if(classes) {
        if(classes.indexOf("open") !== -1) {
          target.classList.remove("open");
          target.classList.add("closed");
        } else {
          target.classList.add("open");
          target.classList.remove("closed");
        }
      } else {
        target.classList.add("open");
      }
   }
}; 


var addClickHandlers = function() {
  var parentElement = document.querySelector("#chroPathEleContainer");
  parentElement.addEventListener("click", onClickHandler);
};


var clickToCopyBoxValue = function() {
  var copyText = document.querySelector(".header-copy-btn");
  copyText.addEventListener("click", copyBoxValueToClipboard);
  copyText.addEventListener("click", showCopied);
};
var copyBoxValueToClipboard = function() {
    var text = document.querySelector(".xpath-input.jsXpath");
    text.select();
    document.execCommand("Copy");  
}

var clickToCopyRelXpath = function() {
    var copyText = document.querySelector(".relCopyButton");

    copyText.addEventListener("click", copyRelXpathToClipboard);
    copyText.addEventListener("click", showCopied);
};

var copyRelXpathToClipboard = function() {
    copyToClipboard(".jsSelector.rel");

}

var clickToCopyIframeXpath = function() {
  var copyText = document.querySelector(".iframeCopyButton");
  copyText.addEventListener("click", copyIframeXpathToClipboard);
  copyText.addEventListener("click", showCopied);
};

var copyIframeXpathToClipboard = function() {
    copyToClipboard(".jsSelector.iframeXpath");
}

var clickToCopySuggestedXpath = function() {
  var copyText = document.querySelector(".suggestedCopyButton");
  copyText.addEventListener("click", copySuggestedXpathToClipboard);
  copyText.addEventListener("click", showCopied);
};

var copySuggestedXpathToClipboard = function() {
    copyToClipboard(".jsSelector.suggestedXpath");
}

var clickToCopyId = function() {
  var copyText = document.querySelector(".idCopyButton");

  copyText.addEventListener("click", copyIdToClipboard);
  copyText.addEventListener("click", showCopied);
};

var copyIdToClipboard = function() {
    copyToClipboard(".jsSelector.id");

}

var clickToCopyClassName = function() {
  var copyText = document.querySelector(".classNameCopyButton");

  copyText.addEventListener("click", copyClassNameToClipboard);
  copyText.addEventListener("click", showCopied);
};

var copyClassNameToClipboard = function() {
    copyToClipboard(".jsSelector.className");
}

var clickToCopyName = function() {
  var copyText = document.querySelector(".nameCopyButton");
  copyText.addEventListener("click", copyNameToClipboard);
  copyText.addEventListener("click", showCopied);
};

var copyNameToClipboard = function() {
    copyToClipboard(".jsSelector.name");
}

var clickToCopyTagName = function() {
  var copyText = document.querySelector(".tagNameCopyButton");
  copyText.addEventListener("click", copyTagNameToClipboard);
  copyText.addEventListener("click", showCopied);
};

var copyTagNameToClipboard = function() {
    copyToClipboard(".jsSelector.tagName");
}

var clickToCopyAbsXpath = function() {
  var copyText = document.querySelector(".absCopyButton");
  copyText.addEventListener("click", copyAbsXpathToClipboard);
  copyText.addEventListener("click", showCopied);
};
var copyAbsXpathToClipboard = function() {
    copyToClipboard(".jsSelector.abs");
}

var clickToCopyCss = function() {
  var copyText = document.querySelector(".cssCopyButton");

  copyText.addEventListener("click", copyCssToClipboard);
  copyText.addEventListener("click", showCopied);
};
var copyCssToClipboard = function() {
    copyToClipboard(".jsSelector.css");

}

var clickToCopyLinkText = function() {
  var copyText = document.querySelector(".linkTextCopyButton");
  copyText.addEventListener("click", copyLinkTextToClipboard);
  copyText.addEventListener("click", showCopied);
};
var copyLinkTextToClipboard = function() {
    copyToClipboard(".jsSelector.linkText");
}

var clickToCopyPartialLinkText = function() {
  var copyText = document.querySelector(".partialLinkTextCopyButton");
  copyText.addEventListener("click", copyPartialLinkTextToClipboard);
  copyText.addEventListener("click", showCopied);
};
var copyPartialLinkTextToClipboard = function() {
    copyToClipboard(".jsSelector.partialLinkText");
}

function addPreCommandInSelector(selectorsValue){
    var preCommandValue = preCommandInput.value.trim();
    preCommandValue = preCommandValue.replace(/“/g,'"').replace(/”/g,'"');
    
    var finalValue = "";
    if(preCommandValue.includes('xpathvalue') || preCommandValue.includes('xpathValue')){
        finalValue = preCommandValue.includes('xpathvalue')?preCommandValue.replace("xpathvalue", selectorsValue):preCommandValue.replace("xpathValue", selectorsValue);
    }else if(preCommandValue){
        // var tempV1 = preCommandValue.split(`"`)[1];
        // var v1 = tempV1.split(`"`)[0];

        // if(v1){
        //     finalValue = preCommandValue.replace(v1, selectorsValue);
        // }else{
            finalValue = preCommandValue.split(`"`)[0]+'"'+selectorsValue+'"'+preCommandValue.split(`"`)[2]
        //}
    }else{
        finalValue = selectorsValue;
    }
    return finalValue;
}

function copyToClipboard(elementSelectorToCopy) {
  var text = document.querySelector(elementSelectorToCopy);
  
  let textarea = document.createElement('textarea');
  textarea.id = 't';
  // Optional step to make less noise on the page, if any!
  textarea.style.height = 0;
  // Now append it to your page somewhere, I chose <body>
  document.body.appendChild(textarea);
  // Give our textarea a value of whatever inside the div of id=containerid
  textarea.value = text.innerText;

  // Now copy whatever inside the textarea to clipboard
  let selector = document.querySelector('#t');
  selector.select();
  document.execCommand('copy');
  // Remove the textarea
  document.body.removeChild(textarea);
}

function copyAllRowsToClipboard(elementSelectorToCopy) {
  var text = document.querySelector(elementSelectorToCopy);
  
  let textarea = document.createElement('textarea');
  textarea.id = 't';
  // Optional step to make less noise on the page, if any!
  textarea.style.height = 0;
  // Now append it to your page somewhere, I chose <body>
  document.body.appendChild(textarea);
  // Give our textarea a value of whatever inside the div of id=containerid
  var allRows = document.querySelectorAll(".selectorValue");
  
  if(captureButton.className.includes("grey")){
    for(var i=1; i<allRows.length; i++){
        let value = allRows[i].innerText.split(' ').length > 1 ? allRows[i].innerText.split(' ').slice(1).join('') : allRows[i].innerText;
        textarea.value = textarea.value+"\n"+(value.length > 3 ? value : '');
    }
  } else {
    for(var i=1; i<allRows.length; i++){
        textarea.value = textarea.value+"\n"+allRows[i].innerText;
    } 
  }

  let selector = document.querySelector('#t');
  selector.select();
  document.execCommand('copy');
  // Remove the textarea
  document.body.removeChild(textarea);
}

var clickToEditIframeXpath = function() {
  var editText = document.querySelector(".iframeEditButton");
  editText.addEventListener("click", editIframeXpath);
};
var editIframeXpath = function() {
  editSelector(".jsSelector.iframeXpath");
}

var clickToEditSuggestedXpath = function() {
  var editText = document.querySelector(".suggestedEditButton");
  editText.addEventListener("click", editSuggestedXpath);
};
var editSuggestedXpath = function() {
  editSelector(".jsSelector.suggestedXpath");
}

var clickToEditRelXpath = function() {
  var editText = document.querySelector(".relEditButton");
  editText.addEventListener("click", editRelXpath);
};
var editRelXpath = function() {
  editSelector(".jsSelector.rel");
}

var clickToEditId = function() {
  var editText = document.querySelector(".idEditButton");
  editText.addEventListener("click", editId);
};
var editId = function() {
  editSelector(".jsSelector.id");
}

var clickToEditName = function() {
  var editText = document.querySelector(".nameEditButton");
  editText.addEventListener("click", editName);
};
var editName = function() {
  editSelector(".jsSelector.name");
}

var clickToEditClassName = function() {
  var editText = document.querySelector(".classNameEditButton");
  editText.addEventListener("click", editClassName);
};
var editClassName = function() {
  editSelector(".jsSelector.className");
}

var clickToEditAbsXpath = function() {
  var editText = document.querySelector(".absEditButton");
  editText.addEventListener("click", editAbsXpath);
};
var editAbsXpath = function() {
  editSelector(".jsSelector.abs");
}

var clickToEditCss = function() {
  var editText = document.querySelector(".cssEditButton");
  editText.addEventListener("click", editCss);
};
var editCss = function() {
  editSelector(".jsSelector.css");
}

var clickToEditLinkText = function() {
  var editText = document.querySelector(".linkTextEditButton");
  editText.addEventListener("click", editLinkText);
};
var editLinkText = function() {
  editSelector(".jsSelector.linkText");
}

var clickToEditPartialLinkText = function() {
  var editText = document.querySelector(".partialLinkTextEditButton");
  editText.addEventListener("click", editPartialLinkText);
};
var editPartialLinkText = function() {
  editSelector(".jsSelector.partialLinkText");
}

var clickToEditTagName = function() {
  var editText = document.querySelector(".tagNameEditButton");
  editText.addEventListener("click", editTagName);
};
var editTagName = function() {
  editSelector(".jsSelector.tagName");
}

var editSelector = function(selectorToEdit) {
  var selectorValue = document.querySelector(selectorToEdit).innerText;
  var inputBox = document.querySelector(".jsXpath");
  inputBox.focus();
  document.execCommand("selectAll");
  document.execCommand("insertText", false, selectorValue);
}

function buttonMouseHover(ele, imgSrc){
    // ele.style.boxShadow= "0 2px 2px 0 black"; 
    ele.style.outline= "0.01em solid #73bde2f2";
    ele.style.backgroundImage= "url('../assets/"+imgSrc+"')";
}
function buttonMouseOut(ele, imgSrc){
    if(themeName==="dark"){
        imgSrc = imgSrc.replace("grey","orange");
    }
    ele.style.boxShadow="";
    ele.style.outline= "";
    ele.style.backgroundImage= "url('../assets/"+imgSrc+"')";
}

function selectorContainerMouseHover(ele){
    if(themeName==="dark"){
        ele.style.backgroundColor = "#6f6868";
    }else{
        ele.style.backgroundColor = "#e3e8ea";
    }
}
function selectorContainerMouseOut(ele){
    ele.style.backgroundColor = "";
}

// var newFeatureBanner = document.querySelector("#newFeatureBanner");
//   newFeatureBanner.addEventListener("mouseover", function() {
//   this.stop();
// });

// newFeatureBanner.addEventListener("mouseout", function() {
//   this.start();
// });

// // enable this to remove the review request msg
// setTimeout(function(){ document.querySelector(".reviewRequest").style.display="none"; 
//   document.querySelector("#chroPathEleContainer").style.height = 'calc(100% - 60px)';
// }, 15000);

var toggleElement = document.querySelector(".toggle-btn");
var buttons = document.querySelectorAll('button');
toggleElement.addEventListener("click", function() {
  if(this.classList.contains("active")) {
    this.classList.remove("active");
    this.classList.add("inactive");
    for(var i=0; i<buttons.length; i++){
        buttons[i].disabled = true;
    }
    
  } else {
    this.classList.remove("inactive");
    this.classList.add("active"); 
    for(var i=0; i<buttons.length; i++){
        buttons[i].disabled = false;
    }
  }
  var toggleBtnToolTip = document.querySelector(".toggle.toolTip");
  if(this.classList.contains("inactive")){
    toggleBtnToolTip.textContent = "click to enable ChroPath";
    var xpathOrCss = 'xpath';
    var onChange = false;
    var xpath = [xpathOrCss, '', onChange];
      backgroundPageConnection.postMessage({
          name: "highlight-element",
          tabId: chrome.devtools.inspectedWindow.tabId,
          xpath: xpath
      });
  } else{
    //multiSelectorDiv.style.display="none";
    toggleBtnToolTip.textContent = "click to disable ChroPath";
    generateSelectors();
  }
});

chrome.storage.local.get(['classChecked'], function(result){
    classAttr.checked=result.classChecked==undefined?true:result.classChecked;
});
chrome.storage.local.get(['nameChecked'], function(result){
    nameAttr.checked=result.nameChecked==undefined?true:result.nameChecked;
});
chrome.storage.local.get(['placeholderChecked'], function(result){
    placeholderAttr.checked=result.placeholderChecked==undefined?true:result.placeholderChecked;
});
chrome.storage.local.get(['idChecked'], function(result){
    idAttr.checked=result.idChecked==undefined?true:result.idChecked;
});
// chrome.storage.local.get(['idCheckboxChecked'], function(result){
//     idCheckbox.checked=result.idCheckboxChecked==undefined?true:result.idCheckboxChecked;
// });
chrome.storage.local.get(['textCheckboxChecked'], function(result){
    textCheckbox.checked=result.textCheckboxChecked==undefined?true:result.textCheckboxChecked;
});

classAttr.addEventListener("click", function() { 
    var classChecked = classAttr.checked;
    chrome.storage.local.set({'classChecked':classChecked}, function(){
    });
    generateColoredRelXpath();
    generateSuggestedXpath();
    updateGAEvents();
});

nameAttr.addEventListener("click", function() { 
    var nameChecked = nameAttr.checked;
    chrome.storage.local.set({'nameChecked':nameChecked}, function(){
    });

    generateColoredRelXpath();
    generateSuggestedXpath();
    updateGAEvents();
});

placeholderAttr.addEventListener("click", function() { 
    var placeholderChecked = placeholderAttr.checked;
    chrome.storage.local.set({'placeholderChecked':placeholderChecked}, function(){
    });

    generateColoredRelXpath();
    generateSuggestedXpath();
    updateGAEvents();
});

idAttr.addEventListener("click", function() { 
    var idChecked = idAttr.checked;
    chrome.storage.local.set({'idChecked':idChecked}, function(){
    });    
    generateColoredRelXpath();
    generateSuggestedXpath();
    updateGAEvents();
});

textCheckbox.addEventListener("click", function() { 
    var textCheckboxChecked = textCheckbox.checked;
    chrome.storage.local.set({'textCheckboxChecked':textCheckboxChecked}, function(){
    });

    generateColoredRelXpath();
    generateSuggestedXpath();
    updateGAEvents();
});


function generateSuggestedXpath(){
    var xpathOrCss = document.querySelector(".boxTitle").value;
    var userSelectorValue = document.querySelector(".jsXpath").value;
    if(userSelectorValue){
        selectElements(xpathOrCss, true);
    }
}

function updateCPSteps(allSteps) {
    deleteAllRow();
    allSteps ? 
        allSteps.forEach((stps) => {
            insRow(stps.label, stps.selector);
        })
    :
        CPsteps.forEach((stps) => {
            insRow(stps.label, stps.selector);
        });
};

function updateColumnsColor(colr) {
    var cols = document.querySelector('#tableRow').getElementsByTagName('th');
    for(var i=0; i<cols.length; i++) {
        cols[i].style.backgroundColor = colr;
        cols[i].style.color = "black";
    }
};


var captureButton = document.querySelector(".captureButton");
var selectorsBlock = document.querySelector(".selectorsBlock");
var chroPathEleContainer = document.querySelector("#chroPathEleContainer");
var multiSelectorDiv = document.querySelector("#multiSelectorDiv");
var tableRow = document.querySelector('#tableRow');
var copyAll = document.querySelector('.copyAll');
var deleteAll = document.querySelector('.deleteAll');
var insertRow = false;

captureButton.addEventListener("click", function() {
    deleteAllRow();
    document.querySelector('.label-header').style.display = 'table-cell';
    selectorHeader.innerText = 'Selectors';
    // tablePlaceholder.textContent = 'No selector recorded yet. \r\n Please inspect elements or click on DOM nodes to record selectors.';
    tablePlaceholder.textContent ='1. Inspect elements or click on DOM nodes one by one to record xpaths for many. \r\n2. Turn on the driver command to generate xpath with command. \r\n3. Set the attribute to generate xpath with required attribute. \r\n4. Click on Copy All button present in header to copy all xpaths. \r\n5. Click on export icon to download the recorded data.';
    tutorialLink.setAttribute("href","https://youtu.be/EuLtm7OVLDE");
    tutorialTooltip.textContent = "How to generate automation code.";
    resetSmart.textContent = 'click for smart maintenance.';
    smartMaintenance.classList.remove('defaultSmartMaintenance');
    openModal.style.display = 'none';
    importButton.style.display = 'none';
    tableRow.style.backgroundColor = "#b8dab1";
    copyAll.style.left = '45px';
    deleteAll.style.left = '75px';
    // updateColumnsColor("#b8dab1");
    updateColumnsColor("#b8dab1");

    var xpathOrCss = document.querySelector(".boxTitle").value.toLocaleLowerCase();
    var captureTooltip = document.querySelector(".capture.toolTip");
    if(captureButton.className.includes("grey")){
        captureButton.classList.add("red");
        captureButton.classList.remove("grey");
        captureButton.style.backgroundImage= "url('../assets/capture_red.svg')";
        captureTooltip.textContent = "click to stop recording and go back to home page."
    }else{
        captureButton.classList.add("grey");
        captureButton.classList.remove("red");
        captureButton.style.backgroundImage= "url('../assets/capture_"+iconColor+".svg')";
        captureTooltip.textContent = "click to generate automation code/multiple xpaths."
    }

    selectElements(xpathOrCss, false);

    if(captureButton.className.includes("red") && toggleElement.classList.contains("active")){
        // document.querySelector(".userFormLink").style.display="none"; 
        selectorsBlock.style.display="none";
        try{
            chroPathEleContainer.style.display="none";
        }catch(err){}
        multiSelectorDiv.style.display="block";
        
        chrome.devtools.panels.elements.onSelectionChanged.addListener(function(){
            if(captureButton.className.includes("red") && toggleElement.classList.contains("active")){
                insertRow = true;
                var onChange = false;
                
                attributeChoicesOption();

                var selector = "";
                var tempSelector = "";
                var label = ""; 
                var selectorValue = chrome.devtools.inspectedWindow.eval('generateRelXpath($0, "'+attributeChoices+'")', { useContentScriptContext: true }, function(result) {
                    
                    if(result!==undefined){
                        xpath = ["xpath", result[0], onChange];
                        backgroundPageConnection.postMessage({
                            name: "highlight-element",
                            tabId: chrome.devtools.inspectedWindow.tabId,
                            xpath: xpath
                        });                       
                    }
                    tempSelector = result[0];
                    if(addPrefix.className.includes('inactive') || !preCommandInput.value.trim()){
                        selector = result[0];
                    }else {
                        selector = addPreCommandInSelector(result[0]);
                    }
                });
                
                
                var labelName = chrome.devtools.inspectedWindow.eval('generateLabel($0)', { useContentScriptContext: true }, function(result) {
                    var inputBox = document.querySelector(".labelName");
                    if(result===undefined){
                        result = "This element might be pseudo element/comment/inside iframe from different src. Currently ChroPath doesn't support for them.";
                    }
                    // label = result;
                    label = result?result.slice(0, 30):selector;
                    if(insertRow && captureButton.className.includes("red") && toggleElement.classList.contains("active") && selector!==undefined){
                        CPstepsWithOutCmd.push({ label, selector: tempSelector });
                        CPsteps.push({ label, selector });
                        insRow(label, selector);
                    }
                });
            }
        });

        updateCPSteps();

    }else{
        multiSelectorDiv.style.display="none";
        var xpathOrCss = document.querySelector(".boxTitle").value;
        selectorsBlock.style.display="";    
        chroPathEleContainer.style.display="";
    }


    if(preCommandInput.style.visibility === "hidden"){
        document.querySelector('#selectorHeader').textContent = "XPath";
        
    }else {
        document.querySelector('#selectorHeader').textContent = "Command";

    }

});

var smartMaintenance = document.getElementById('smartMaintenance');
var selectorHeader = document.getElementById('selectorHeader');
var tablePlaceholder = document.querySelector('.tablePlaceholder');
var resetSmart = document.querySelector('.resetSmart');
var tutorialLink = document.querySelector('.tutorialLink');
var tutorialTooltip = document.querySelector(".tutorial.tooltip");

smartMaintenance.addEventListener('click', smartMaintenanceScreen, true);

function smartMaintenanceScreen(e) {
    deleteAllRow();
    if(!captureButton.className.includes("grey")) {
        captureButton.click();
    }
    var multiSelectorDiv = document.querySelector("#multiSelectorDiv");
    var selectorsBlock = document.querySelector(".selectorsBlock");
    var chroPathEleContainer = document.querySelector("#chroPathEleContainer");
    var labelHeader = document.querySelector('.label-header');

    selectorsBlock.style.display="none";
    chroPathEleContainer.style.display="none";
    multiSelectorDiv.style.display="block";
    labelHeader.style.display = 'none';
    selectorHeader.innerText = 'XPath';
    // tablePlaceholder.innerText = 'Paste all the xpath or upload the xpath xls file to verify all xpath in single shot';
    tablePlaceholder.innerText = smartMaintenancePlaceholder;
    openModal.style.display = '';
    importButton.style.display = '';
    tableRow.style.backgroundColor = "#f3d476";
    copyAll.style.left = '20px';
    deleteAll.style.left = '60px';
    updateColumnsColor("#f3d476");
    tutorialLink.setAttribute("href","https://youtu.be/T2PtPbzaJws");
    tutorialTooltip.textContent = "Smart Maintenance Tutorial";

    if(this.classList.contains('defaultSmartMaintenance')) {
        document.querySelector(".selectorsBlock").style.display="";
        document.querySelector("#chroPathEleContainer").style.display="";
        document.querySelector("#multiSelectorDiv").style.display="none";
        resetSmart.textContent = 'click to verify all selectors in single shot';
        this.classList.remove('defaultSmartMaintenance');
    }else {
        this.classList.add('defaultSmartMaintenance');
        resetSmart.textContent = 'click to go back to home page';
        // this.style.backgroundImage = 'url(maintenance_blue.svg)';
        appendRows(SMsteps, true);
    }

};

function insRow(label, selector) {
  var x = document.querySelector('#multiSelectorTable tbody');
  var new_row = x.rows[0].cloneNode(true);
  new_row.style.display="";
  var len = x.rows.length;

  var inp1 = new_row.cells[1];
  inp1.id += len;
  inp1.innerHTML = label;

  inp1.addEventListener('input', function(e) {
    if(e.data) {
        this.classList.remove("removeOutline");
    }else {
        this.classList.add("removeOutline");
    }
});
  
  var inp2 = new_row.cells[2];
  inp2.id += len;
  inp2.addEventListener('input', function(e) {
      if(e.data) {
        if(addPrefix.classList.contains("inactive")) {
            var rowIndex = this.parentNode.rowIndex;
            CPstepsWithOutCmd[rowIndex - 2].selector = this.innerText;
            CPsteps[rowIndex - 2].selector = this.innerText;
            this.classList.remove("removeOutline")
        }
      }else {
          this.classList.add("removeOutline")
      }
  });
  if(selector && selector.toLowerCase().includes('labelvalue')){
    selector = selector.replace(/labelvalue/i, toCamelCase(label));
  }
  inp2.textContent = selector;
  
  x.appendChild(new_row);
  insertRow = false;
  
  updateTotalRowsCount();
}

function toCamelCase(s){
    return s
        .replace(/_/g, " ")
        .replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
        .replace(/\s/g, '')
        .replace(/^(.)/, function($1) { return $1.toLowerCase(); });
}

document.querySelector('#multiSelectorTable').addEventListener("click", function(ev) {
    var rowIndex = ev.target.parentNode.parentNode.rowIndex;
   if(ev.target.id.includes("delButton")){
        deleteRow(rowIndex);
   }else if(ev.target.id === "row-copy-btn"){
        var selectorId = ev.target.parentNode.parentNode.querySelector('.selectorValue').id;
        copyToClipboard("#"+selectorId);
        showCopied();
    }else if(ev.target.id === "row-edit-btn"){
        let selectorValue = ev.target.parentNode.parentNode.querySelector('.selectorValue').innerText;
        let inputBox = document.querySelector(".jsXpath");
        inputBox.focus();
        document.execCommand("selectAll");
        document.execCommand("insertText", false, selectorValue);
    }else if(ev.target.id === "row-edit-btn-SM") {
        let selectorValue = ev.target.parentNode.parentNode.querySelector('.selectorValue').innerText;
        let val = selectorValue.split(' ').length > 1 ? selectorValue.split(' ').slice(1).join('') : selectorValue;
        let inputBox = document.querySelector(".jsXpath");
        inputBox.focus();
        document.execCommand("selectAll");
        document.execCommand("insertText", false, val);
    } else if(ev.target.id === "row-copy-btn-SM") {
        var selectorId = ev.target.parentNode.parentNode.querySelector('.selectorValue').id;
        copyToClipboardSM("#"+selectorId);
        showCopied();
    }
});

function copyToClipboardSM(elementSelectorToCopy){
    var text = document.querySelector(elementSelectorToCopy);
  
    let textarea = document.createElement('textarea');
    textarea.id = 't';
    // Optional step to make less noise on the page, if any!
    textarea.style.height = 0;
    // Now append it to your page somewhere, I chose <body>
    document.body.appendChild(textarea);
    // Give our textarea a value of whatever inside the div of id=containerid
    textarea.value = text.innerText.split(' ').length > 1 ? text.innerText.split(' ').slice(1).join('') : text.innerText;
  
    // Now copy whatever inside the textarea to clipboard
    let selector = document.querySelector('#t');
    selector.select();
    document.execCommand('copy');
    // Remove the textarea
    document.body.removeChild(textarea);
};

function rowAction(id){
    var rowButton = document.querySelectorAll("#"+id);
    var totalRows = rowButton.length;
    
    for(var i=0; i<totalRows; i++ ){
        rowButton[i].addEventListener("click", function() {
        if(id.includes("delButton")){   
             
            deleteRow(this);
            return;
        }else if(id.includes("copy")){

        }else if(id.includes("edit")){

        }   
    });

    }
}

function deleteRow(rowIndex) {
    document.getElementById('multiSelectorTable').deleteRow(rowIndex);
    updateTotalRowsCount();
 
    if(smartMaintenance.classList.contains('defaultSmartMaintenance')){
        SMstepsWithOutCmd.splice(rowIndex - 2, 1);
		SMsteps.splice(rowIndex - 2, 1);
        appendRows(SMsteps, true);

    }

    if(captureButton.className.includes("red")) {
        CPstepsWithOutCmd.splice(rowIndex - 2, 1);
        CPsteps.splice(rowIndex - 2, 1);
    }

}

function deleteAllRow() {
  var allRows = document.querySelectorAll("tr");
  for(var i=2; i<allRows.length; i++){
    document.getElementById('multiSelectorTable').deleteRow(2);  
  }  
  document.querySelector(".tablePlaceholder").style.display = "";
  updateTotalRowsCount();
}

var copyAllButton = document.querySelector(".copyAllButton");

copyAllButton.addEventListener("click", function() {
    copyAllRowsToClipboard();
    this.addEventListener("click", showCopied);
});


var deleteAllButton = document.querySelector(".deleteAllButton");

deleteAllButton.addEventListener("click", function() {
    deleteAllRow();

    if(smartMaintenance.classList.contains('defaultSmartMaintenance')){
        SMstepsWithOutCmd = [];
        SMsteps = [];
    }

    if(captureButton.className.includes("red")) {
        CPsteps = [];
        CPstepsWithOutCmd = [];
    }

});

function showSnackbar(msg) {

    let showWarn = document.querySelector('#snackbar');
    showWarn.innerText = msg;
    showWarn.className = "show";
    setTimeout(function(){ showWarn.className = showWarn.className.replace("show", ""); }, 2000);

};

var exportButton = document.querySelector(".exportButton");

exportButton.addEventListener("click", function() {
    if(document.getElementById('tableBody').rows.length > 1){
        exportSelectors("multiSelectorTable", "test");
    }else {
        showSnackbar("No data to save");
    }
});

function openFileUploadModal() {
    chrome.storage.local.get(['preCommandValue'], async  function(result){
        customCommand.value = await result.preCommandValue==undefined?'driver.findElement(By.xpath("xpathvalue"))':result.preCommandValue;
    });
    submitBtn.textContent = 'Next';
    document.getElementById('enterNewTitle').style.display = 'none';
    document.getElementById('addNewTitle').textContent = "Upload XPath file";
    document.getElementById('imgupload').style.display = 'none';
    // document.getElementById('addNewTitleLabel').textContent = "Please enter steps values.";

    var modal = document.getElementById('addNewModal');
    modal.style.display = "block";
    document.getElementById("enterNewTitle").focus();
    
    // to clear input value
    document.getElementById("enterNewTitle").value = '';

    checkXpathInputCommand();
};

function checkXpathInputCommand() {
    setTimeout(() => {
        if(!customCommand.value.toLowerCase().includes('xpathvalue')){
            customCommand.classList.add('wrongXpath');
            customCommand.style.backgroundColor = "#FF6347";
        }else if(customCommand.value.toLowerCase().includes('xpathvalue')){
            customCommand.classList.remove('wrongXpath');
            customCommand.style.backgroundColor = "#FFF";
        }
    }, 100);
};

var fileToRead = document.getElementById("imgupload");

fileToRead.addEventListener("change", function(evt) {
    var selectedFile = evt.target.files[0];
    var reader = new FileReader();
    var command =  document.getElementById('customCommand').value.trim();
    var toggle = document.getElementById('inputToggle');
    reader.onload = function(event) {
        var data = event.target.result;
        var workbook = XLSX.read(data, {
            type: 'binary'
        });
        workbook.SheetNames.forEach(function(sheetName) {
        
            var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
            document.querySelector('.label-header').style.display = 'none';
            if(toggle.classList.contains('active')) {
                let filterd = [...XL_row_object];
                SMsteps = filterd.map(stp => {
                    let data = stp["Label"];
                    let xpath = stp["XPath"] || stp["Command"];     
                    let generatedXpath = extractXpath(xpath, command);
                    return {
                        Step: data,
                        XPath: generatedXpath
                    }
                });
                SMstepsWithOutCmd = [...SMsteps];        
                appendRows(SMsteps, true);
            }else {
                SMsteps = [...XL_row_object];
                SMstepsWithOutCmd = SMsteps.map(stp => {
                    let data = stp["Label"];
                    let xpath = stp["XPath"] || stp["Command"];     
                    return {
                        Step: data,
                        XPath: xpath
                    }
                });
                appendRows(SMstepsWithOutCmd, true);
            }
            // var json_object = JSON.stringify(XL_row_object);
            
            // document.getElementById("jsonObject").innerHTML = json_object;

        })
    };

    reader.onerror = function(event) {
        console.error("File could not be read! Code " + event.target.error.code);
    };

    reader.readAsBinaryString(selectedFile);
    fileToRead.value = '';

}, false);

function nodesColor(no) {
    switch(no) {
        case 0:
            return 'nodesCountZero';
        case 1:
            return 'nodesCountOne';
        default:
            return 'nodesCountDef';
    }
};


function appendRows(arr, bool) {
    deleteAllRow();
    try {
        arr.forEach(async (row, ind) => {
            var rowCount = document.getElementById('tableBody').rows.length;
            tableBody.innerHTML += `
                <tr>
                    <td id='s-no'></td>
                    <td style="display:${ bool ? 'none' : '' }" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" contenteditable="true" id="labelData${rowCount}" class="label editableContent">
                        ${row[Object.keys(row)[0]] || ''}
                    </td>
                    <td autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" contenteditable="true" id="selectorData${rowCount}" class="selectorValue editableContent">
                        <span class='nodesCount' id="occurrence${rowCount}">0</span>
                        ${row['XPath'] || ''}
                    </td>
                    <td id="actionBtn">
                        <button id="row-copy-btn-SM" title="click to copy relative XPath"></button>
                        <button id="row-edit-btn-SM" title="click to edit relative XPath"></button>
                        <button id="delButton"></button>
                    </td>
                </tr>
            `;
            await backgroundPageConnection.postMessage({
                name: "calcElements",
                tabId: chrome.devtools.inspectedWindow.tabId,

                data: { xpath: SMstepsWithOutCmd[ind]['XPath'] || '', id: `occurrence${rowCount}` }
            });
            addChangeHandler(`occurrence${rowCount}`);
        });
    
        updateTotalRowsCount();

    } catch(err) {
        console.warn(err, "Error")
    }
};

function addChangeHandler(id){
    let ele = document.getElementById(id);
    ele.parentNode.addEventListener('input', function(e) {
        if(e.data) {
            if(addPrefix.classList.contains("inactive")) {
                var rowIndex = this.parentNode.rowIndex;
                var txt = this.innerText.slice(this.innerText.indexOf(" ")+1);
                SMstepsWithOutCmd[rowIndex-2].XPath = txt;
                SMsteps[rowIndex-2].XPath = txt;
                ele.parentElement.classList.remove("removeOutline");
            }
        }else {
            ele.parentElement.classList.add("removeOutline");
        }
    });
}

// var headTr = document.getElementById('tableRow');
function updateNodesCount(bool, nodeVals, labelVal) {
    try {
        var nodes = document.querySelectorAll('.nodesCount'); 
        if(bool) {
            for(let i=0; i<nodes.length; i++) {
                nodes[i].innerHTML = '';
            }
        }else {
            for(let i=0; i<nodes.length; i++) {
                nodes[i].innerHTML = nodeVals[i];
            }
        }
    }catch(err) {
        console.warn(err, "ERR");
    }
};


function downloadFile(label, nodeVals, xpathVal) {
    var header = [];
    var data = [];
    var isWindowsOS = window.navigator.userAgent.includes('Windows');
    
    xpathVal.forEach((xpath, ind) => {
        if(smartMaintenance.classList.contains('defaultSmartMaintenance')){
            header = [[ "XPath", 'Occurrence' ]];
            data.push([xpath, nodeVals[ind]]);
        }else {
            if(preCommandInput.style.visibility === "hidden"){
                header = [[ "Label", "XPath" ]];
            }else {
                header = [[ "Label", "Command" ]];
            }
            data.push([label[ind], xpath]);
        }
    });
    var testCase = header.concat(data);
    var csv = "";

    testCase.forEach(function (row) {
        row = [`${row[0]}`.trim(), `${row[1]}`];
        csv += isWindowsOS ? row.join(",") : row.join("\t");
        csv += "\n";
    });

    var a = window.document.createElement("a");
    a.href = window.URL.createObjectURL(new Blob([csv], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;' }));

    if(isWindowsOS) {
        a.download = `download.csv`;
    } else {
        a.download = `download.xls`;
    }

    // Append anchor to body.
    document.body.appendChild(a);
    a.click();

    // Remove anchor from body
    document.body.removeChild(a);

    a = null;

};

var exportSelectors = (function(table,name) {
    let nodesCounts = document.querySelectorAll('.nodesCount');
    let labels = document.querySelectorAll('.label');
    let XPaths = document.querySelectorAll('.selectorValue');
    let labelVal = [];
    let nodeVals = [];
    let xpathVals = [];
    for(let i=1; i<labels.length; i++) {
        labelVal.push(labels[i].textContent);
    }
    for(let i=0; i<nodesCounts.length; i++) {
        nodeVals.push(nodesCounts[i].textContent);
    }
    
    
    updateNodesCount(true, nodeVals, labelVal);
    
    for(let i=1; i<XPaths.length; i++) {
        xpathVals.push(XPaths[i].textContent);
    }
    
    downloadFile(labelVal, nodeVals, xpathVals);
    
    updateNodesCount(false, nodeVals, labelVal);
});

function updateSMSteps() {
    SMsteps = SMstepsWithOutCmd.map(stp => {
        return {
            Step: stp.Step,
            XPath: preCommandInput.value.trim().replace(/xpathvalue/i, stp.XPath)
        }
    });

    appendRows(SMsteps, true);
}

function updateChroPathSteps() {
    CPsteps = CPstepsWithOutCmd.map(stp => {
        return {
            label: stp.label,
            selector: preCommandInput.value.trim().replace(/xpathvalue/i, stp.selector)
        }
    });

    updateCPSteps(CPsteps);
};

var addPrefix = document.querySelector(".addPrefix");
var totalCount = document.querySelector(".total-count");
addPrefix.addEventListener("click", async function() {
    if(preCommandInput.style.visibility === "hidden"){

        document.querySelector('#selectorHeader').textContent = "Command";

        if(preCommandInput.value.toLowerCase().includes('xpathvalue')) {
            this.classList.remove("inactive");
            this.classList.add("active"); 
        }
        this.style.backgroundImage= "url('../assets/addPrefix_blue.svg')";
        preCommandInput.style.visibility = "visible"; 

        if(preCommandInput.value.toLowerCase().includes('xpathvalue')) {
            if(smartMaintenance.classList.contains('defaultSmartMaintenance')) {
                let inputCmd =  preCommandInput.value.split('"')[0];
                if(SMsteps[0] && !SMsteps[0].XPath.includes(inputCmd) && !SMsteps[0].XPath.toLowerCase().includes(inputCmd)) {
                
                    SMsteps = SMsteps.map(stp => {
                        return {
                            Step: stp.Step,
                            XPath: preCommandInput.value.trim().replace(/xpathvalue/i, stp.XPath)
                        }
                    });
            
                    appendRows(SMsteps, true);
                }
            }else if(captureButton.classList.contains("red")) {
                let inputCmd =  preCommandInput.value.split('"')[0];
                if(CPsteps[0] && !CPsteps[0].selector.includes(inputCmd)) {
                    CPsteps = CPsteps.map(stp => {
                        return {
                            label: stp.label,
                            selector: preCommandInput.value.trim().replace(/xpathvalue/i, stp.selector)
                        }
                    });
            
                    updateCPSteps(CPsteps);
                }
            }
    
            if(selectorsBlock.offsetParent && preCommandInput.value.toLowerCase().includes('xpathvalue')) {
                removeAttrCommands(true);
            }
    
        }
        if(!preCommandInput.value.toLowerCase().includes('xpathvalue')) {
            preCommandInput.classList.add('wrongXpath');
            document.querySelector('.helpIcon').style.visibility = "visible";
        }
        
    }else {

        document.querySelector('#selectorHeader').textContent = "XPath";
        this.classList.remove("active");
        this.classList.add("inactive");
        this.style.backgroundImage= "url('../assets/addPrefix_"+iconColor+".svg')";
        preCommandInput.style.visibility = "hidden"; 

        if(preCommandInput.value.toLowerCase().includes('xpathvalue')) {
            if(smartMaintenance.classList.contains('defaultSmartMaintenance')) {
    
                let allXpaths = SMsteps.map(stp => stp.XPath);
                let extractCommands = await extractAllCommands(preCommandInput.value.trim(), allXpaths.join(''));
                SMsteps = SMsteps.map((stp, ind) => {
                    return {
                        label: stp.label,
                        XPath: extractCommands[ind][1]
                    }
                });
    
                appendRows(SMsteps, true);
            
            }else if(captureButton.classList.contains("red")) {     
                
                // let allXpaths = CPsteps.map(stp => stp.selector);
                // let extractCommands = await extractAllCommands(preCommandInput.value.trim(), allXpaths.join(''));
                CPsteps = CPstepsWithOutCmd.map((stp, ind) => {
                    return {
                        label: stp.label,
                        selector: stp.selector
                    }
                });
                updateCPSteps(CPsteps);
    
            }
            if(selectorsBlock.offsetParent) {
                removeAttrCommands(false);
            }
        }

        document.querySelector('.helpIcon').style.visibility = "hidden";

    }
});

async function removeAttrCommands(bool) {
    let elements = document.querySelectorAll('.jsSelector');
    let relElement = document.querySelector('.rel');

    if(bool) {
        for(let i=0; i<elements.length; i++){
            if(elements[i].offsetParent && !elements[i].classList.contains('rel')){
                let eleCommand = elements[i].dataset.command;
                let inputValue = preCommandInput.value.trim();
                if(preCommandInput.value.toLowerCase().indexOf('xpath') !== preCommandInput.value.toLowerCase().lastIndexOf('xpath')){
                    inputValue = preCommandInput.value.trim().replace('xpath', eleCommand);
                }
                if(!elements[i].textContent.includes(preCommandInput.value.replace(/”|“/g,'"').replace('xpath', elements[i].dataset.command).replace(/”|“/g,'"').split('"')[0])){
                    elements[i].textContent = inputValue.replace(/xpathvalue/i, elements[i].textContent)
                }
            }
        }
        if(relElement.offsetParent){
            
            let startInd = preCommandInput.value.toLowerCase().trim().indexOf("xpathvalue");
            let diff = preCommandInput.value.trim().length - startInd;
            let first = preCommandInput.value.trim().slice(0, startInd);
            let second = preCommandInput.value.trim().slice(-diff + 10);

            document.querySelector('.p1-label').textContent = first;
            document.querySelector('.p2-label').textContent = second;

        }
    }else {
        for(let i=0; i<elements.length; i++){
            if(elements[i].offsetParent && !elements[i].classList.contains('rel')){
                let val = elements[i].textContent;
                let eleCommand = elements[i].dataset.command;
                let inputValue = preCommandInput.value.trim();
                if(preCommandInput.value.toLowerCase().indexOf('xpath') !== preCommandInput.value.toLowerCase().lastIndexOf('xpath')){
                    inputValue = preCommandInput.value.trim().replace(/xpath/i, eleCommand);
                }
                let command = await extractAllCommands(inputValue.replace(/”|“/g,'"'), val.replace(/”|“/g,'"'));
                if(command[0]){
                    elements[i].textContent = command[0][1];
                }
            }
        }


        if(relElement.offsetParent){
            
            document.querySelector('.p1-label').textContent = '';
            document.querySelector('.p2-label').textContent = '';
        
        }

    }
};


var settingBtn = document.querySelector(".setting_btn");
var attributeOption = document.querySelector(".attributeOption");

function updateTotalRowsCount(){
    var selectorsCount = document.querySelector(".selectorsCount");
    var totalRows = document.querySelectorAll("tr").length-2;

    if(totalRows>0){
        document.querySelector(".tablePlaceholder").style.display = "none";
    }else{
        document.querySelector(".tablePlaceholder").style.display = "";
    }
    selectorsCount.innerText = "("+totalRows+")";
}


// setTimeout(function(){ document.querySelector(".userFormLink").style.display="none"; 
// }, 20000);

// setTimeout(function(){ document.querySelector(".version").style.display="inline"; 
// }, 20000);

function showCopied(){
    var top="";
    var elementClass = event.target.className;
    var copyToolTip = document.querySelector(".popuptext");
    copyToolTip.textContent = elementClass.includes("header")?"box value is copied":elementClass.includes("iframe")?"iframe XPath is copied":elementClass.includes("suggested")?"CP suggested XPath is copied":elementClass.includes("rel")?"Rel XPath is copied":elementClass.includes("id")?"id is copied":elementClass.includes("name")?"name is copied":elementClass.includes("tagName")?"tagName is copied":elementClass.includes("class")?"className is copied":elementClass.includes("abs")?"Abs XPath is copied":elementClass.includes("css")?"copied cssSelector":elementClass.includes("linkText")?"copied linkText":elementClass.includes("partialLinkText")?"copied partialLinkText":"copied selector's value";
    
    if(event.target.id.includes("row-copy-btn")){
        copyToolTip.style.right = "62px";
        top =  event.target.parentNode.offsetTop+87;
    }else if(event.target.className.includes("copyAllButton")){
        copyToolTip.style.left = "216px";
        top =  "130px";
    }else{
        top = event.target.offsetTop+1;
        top = top>156?156:top;
        copyToolTip.style.left = "24px";
    }
    
    copyToolTip.classList.add("show");
    copyToolTip.style.top = top;
    setTimeout(function(){copyToolTip.classList.remove("show"); copyToolTip.style.left = "";copyToolTip.style.right = "";}, 500);
}

record.addEventListener('click', function() {
    if(openedRecorder) {
        backgroundPageConnection.postMessage({
            name: 'active',
            tabId: chrome.devtools.inspectedWindow.tabId,
            index: null
        });    

        return;
    }
    this.classList.add('redBlink');
    
    backgroundPageConnection.postMessage({
        name: 'openRecorder',
        tabId: chrome.devtools.inspectedWindow.tabId,
        index: null
    })
})


var resetConfigBtn = document.querySelector(".reset-btn");

resetConfigBtn.addEventListener("click", function() {
    idAttr.checked = true;
    classAttr.checked = true;
    nameAttr.checked = true;
    placeholderAttr.checked = true;
    userAttrName.value = "";
    textCheckbox.checked = true;
    preCommandInput.value = 'driver.findElement(By.xpath("xpathvalue"))';
});


function setWidthOfSelectorHeader(){
    setTimeout(function(){  
        var temp = 1;
        var allMatchingNodeNumber = document.querySelectorAll(".numberOfMatchingNodes");
        for(var i=0; i<allMatchingNodeNumber.length; i++){
            temp = allMatchingNodeNumber[i].textContent.length>temp?allMatchingNodeNumber[i].textContent.length:temp;
        }
        for(var i=0; i<allMatchingNodeNumber.length; i++){
            document.querySelectorAll(".matchingNodesContainer")[i].style.width = temp===3?"35px":temp===4?"41px":temp===5?"47px":"26px";
        } 
    }, 150);
}


var openModal = document.querySelector('.openModal');
var importButton = document.querySelector('.importButton');
var closeIcon = document.getElementById('modalClose');
var cancelBtn = document.getElementById('modal-cancel');
var submitBtn = document.getElementById("btn-submit");
var commandValidation = document.getElementById('commandValidation');
var customCommand = document.getElementById('customCommand');
var changeIconButton = document.getElementById('changeIconButton');

openModal.addEventListener('click', openDataUploadModal);

importButton.addEventListener('click', function() {
    openUploadModal = true;
    openFileUploadModal();
    // document.querySelector('#imgupload').click();
});

function openDataUploadModal() {
    chrome.storage.local.get(['preCommandValue'], function(result){
        customCommand.value = result.preCommandValue==undefined?'driver.findElement(By.xpath("xpathvalue"))':result.preCommandValue;
    });
    submitBtn.textContent = 'Ok';
    openUploadModal = false;

    document.getElementById('enterNewTitle').style.display = 'block';
    document.getElementById('imgupload').style.display = 'none';

    document.getElementById('addNewTitle').textContent = "Enter selectors page or complete script";
    // document.getElementById('addNewTitleLabel').textContent = "Please enter steps values.";
    document.getElementById('btn-submit').classList.add("submit-case");
    document.getElementById('btn-submit').classList.remove("submit-case");

    var modal = document.getElementById('addNewModal');
    modal.style.display = "block";
    document.getElementById("enterNewTitle").focus();
    
    // to clear input value
    document.getElementById("enterNewTitle").value = '';
    
    checkXpathInputCommand();
};


function closeAddNewModal() {
    var modal = document.getElementById('addNewModal');
    modal.style.display = "none";
    // var showtext = document.getElementById('textcuation')
    // showtext.style.display = 'none';
}

closeIcon.addEventListener('click', function () {

    closeAddNewModal();
    // var showtext = document.getElementById('textcuation')
    // showtext.style.display = 'none';

}, false);

cancelBtn.addEventListener('click', function () {
    closeAddNewModal();
}, false);

function extractXpath(xpath, command){
    if(command) {
        var startInd = command.toLowerCase().indexOf("xpathvalue");
        if(startInd < 0){ 
            return null;
        }
        var diff = command.length - startInd;
        return xpath.slice(startInd, -diff + 10);
    }
    return xpath;
}

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

function findMatches(regex, str, matches = []) {
    const res = regex.exec(str)
    res && matches.push(res) && findMatches(regex, str, matches)
    return matches
}
 

function extractAllCommands(command, str ) {
    try {
        return new Promise((res, rej) => {
    
            if(command) {
                var startInd = command.toLowerCase().indexOf("xpathvalue");
                var diff = command.length - startInd;
                var first = escapeRegExp(command.slice(0, startInd));
                var second = escapeRegExp(command.slice(-diff + 10));
                let re = new RegExp(first+'(.*?)'+second, 'gi');

                // Usage
                const matches = findMatches(re, str)
                res(matches);
            }
        });
    } catch(err) {
        rej(err);
    }
};
customCommand.addEventListener('keyup', clearInputField, false);
submitBtn.addEventListener('click', showXpaths, false);

function clearInputField(e) {
    commandValidation.style.display = 'none';
    chrome.storage.local.set({'preCommandValue':e.target.value}, function(){});
    if(!this.value.toLowerCase().includes('xpathvalue')){
        commandValidation.style.display = 'inline-block';
        this.classList.add('wrongXpath');
        this.style.backgroundColor = "#FF6347";
    }else if(this.value.toLowerCase().includes('xpathvalue')){
        commandValidation.style.display = 'none';
        this.classList.remove('wrongXpath');
        this.style.backgroundColor = "#FFF";
    }
};

async function showXpaths() {
    if(!captureButton.className.includes("grey")){
        smartMaintenanceScreen();
    }
    
    if(document.getElementById('inputToggle').classList.contains('active') && !document.getElementById('customCommand').value.toLowerCase().includes('xpathvalue')){
        commandValidation.style.display = 'inline-block';
        return;
    }

    if(document.getElementById("enterNewTitle").offsetParent && !document.getElementById("enterNewTitle").value.length) {
        return;
    }

    if(!document.getElementById('customCommand').value.trim() && document.getElementById('inputToggle').classList.contains('active'))
        return;

    if(openUploadModal) {

        document.querySelector('#imgupload').click();

        
    } else{


        let allXpaths = document.getElementById('enterNewTitle').value.replace(/”|“/g,'"');
        let customCommand =  document.getElementById('customCommand').value.trim().replace(/”|“/g,'"');
        let bool = document.getElementById('inputToggle');
        if(bool.classList.contains('inactive')){
            
            let splitLabels = allXpaths.trim().split(/\r?\n/).filter(labl => labl !== '');
            SMsteps = splitLabels.map(xpath => {
                return {
                    Step: '-',
                    XPath: xpath
                }
            });
    
            document.querySelector('.label-header').style.display = 'none';
            selectorHeader.innerText = 'XPath';
            tablePlaceholder.innerText = smartMaintenancePlaceholder;
            resetSmart.textContent = 'click to go back to default view';
            tutorialLink.setAttribute("href","https://youtu.be/T2PtPbzaJws");
            tutorialTooltip.textContent = "Smart Maintenance Tutorial";
    
            SMstepsWithOutCmd = [...SMsteps];
            appendRows(SMsteps, true);

        }else {
            let extractCommands = await extractAllCommands(customCommand, allXpaths);
            if(extractCommands) {
                let xpathArr = allXpaths.trim().split(/\r?\n/);
                // var patt = new RegExp(customCommand, 'g');
                // let splitLabels = bool ? allLabels.trim().split(/\r?\n/).filter(labl => labl !== '') : [];
                SMsteps = extractCommands.map(xpath => {
                    let generatedXpath =  xpath[1];
                    return {
                        Step: '-',
                        XPath: generatedXpath
                    }
                });
        
                document.querySelector('.label-header').style.display = 'none';
                selectorHeader.innerText = 'XPath';
                tablePlaceholder.innerText = smartMaintenancePlaceholder;
                resetSmart.textContent = 'click to go back to default view';
                tutorialLink.setAttribute("href","https://youtu.be/T2PtPbzaJws");
                tutorialTooltip.textContent = "Smart Maintenance Tutorial";
                
                SMstepsWithOutCmd = [...SMsteps];
                appendRows(SMsteps, true);
            }
        }
        allXpaths.value = '';
    
    }
    closeAddNewModal();
}

var toggleElement = document.getElementById('inputToggle');

toggleElement.addEventListener("click", function() {

    if(this.classList.contains("active")) {
    
        this.classList.remove("active");
        this.classList.add("inactive");
        document.getElementById('customCommand').style.display = 'none';
        commandValidation.style.display = 'none';
        
    } else {

        this.classList.remove("inactive");
        this.classList.add("active"); 
        document.getElementById('customCommand').style.display = 'block';
    }
});
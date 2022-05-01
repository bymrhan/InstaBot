var recordButton = document.getElementById('record');
var recordIcon = document.getElementById('recordIcon');
var element = document.getElementById('records-grid');
var helperText = document.getElementById('helperText');
var save_btn = document.getElementById('save_btn');
var toggleElement = document.getElementById('inputToggle');
var xpathInput = document.getElementById('xpathInput'); 
var clearTestCase = document.getElementById('clearTestCase');
var alwaysTop = document.getElementById('alwaysTop');

var copyAllButton = document.querySelector(".copyAllButton");
var copyAllXpath = document.querySelector('.copyAllXpath');
var copyAllData = document.querySelector('.copyAllData');

var toggleHeader = document.getElementById('toggleHeader');
var fileName = document.querySelector('#downloadFileName');

var idAttr = document.querySelector('.idAttr');
var classAttr = document.querySelector('.classAttr');
var nameAttr = document.querySelector('.nameAttr');
var placeholder = document.querySelector('.placeholder');
var textXpath = document.querySelector('.text-xpath');

var checkboxes = document.querySelectorAll(".attributeChoice");
var tablePlaceholder = document.querySelector('.tablePlaceholder');

var pauseBtnToolTip = document.querySelector(".pauseBtn.toolTip");
var toggleToolTip = document.querySelector(".toggle.toolTip");

tablePlaceholder.innerText="1. Now keep performing your manual steps on your website.\r\n2. All your actions will be recorded here.\r\n3. For each step relative xpath will be generated along with driver command.\r\n4. You can update the driver command or turn off.\r\n5. Once you are done, save the test case or copy all rows by clicking on header copy icon.\r\n6. By default it will save file with First test case name but you can update this.";

var recording = true;
var steps = [];
var xpathText = '';
var senderId = '';
var atttrArr = `[, withid,withclass,withname,withplaceholder,withtext]`;

var interval = null;

var userEmail = 'Anonymous';

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    senderId = sender.tab.id;
    if(message && message.type === 'windowEvent' && recording && message.data !== 'Click on aTag') {
        
        if(!Boolean(steps.length)) {
            steps.push({ step: 'Open website', relXpath: '', dataText: message.URL, planeLabel: message.URL });
        }

        steps.push({ step: message.data, relXpath: message.relXpath, dataText: message.dataText, planeLabel: message.planeLabel });
        displayRows();

        notifyMe('ChroPath', message.data);

    }

    if(message && message.type === 'recorderAttr'){
        setAttr(message.data);
    }
    
    if(message && message.type === "verification" && recording) {
        senderId ? browser.tabs.sendMessage(senderId, { openRecorder: true }) : null;
    }
   
    // if(message && message.data) {
    //     browser.tabs.query({}).then((tabs) => {

    //         var recorderWindow = tabs.find((a) => a.title === "ChroPath Studio");

    //         window.chrome.windows.update(recorderWindow.windowId,{
    //             state: "normal", //minimized
    //         });

    //     });
    // }
});

function displayRows () {
    element.innerHTML = null;
    document.querySelector(".tablePlaceholder").style.display = "none";
    var secondTr = Boolean(toggleElement.classList.contains('active'));

    if(steps && steps.length) {

        var commandWithDriver = command = "";
        if(secondTr && xpathInput.value && xpathInput.value.toLowerCase().includes('xpathvalue')) {
            for(let i = 0; i < steps.length; i++) {
                commandWithDriver = command = "";
                let detectLabel = false;
                if(steps[i].relXpath && steps[i].relXpath.length){
                    command = xpathInput.value.replace(/xpathvalue/i, steps[i].relXpath);
                    commandWithDriver = xpathInput.value.replace(/xpathvalue/i, `${steps[i].relXpath}`);
                }
                if(xpathInput.value && xpathInput.value.toLowerCase().includes('labelvalue')){
                    detectLabel = true;
                }
                element.innerHTML += `
                <tr class="tableRow">
                    <td class='fixedColumns'>
                        <div class='tableData'>${i + 1}</div>
                    </td>    
                    <td class='fixedColumns'>
                        <div title="${steps[i].step}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" contenteditable="true" class='tableData allSteps'>${steps[i].step}</div>
                    </td>
                    <td title="${steps[i].dataText}" class='fixedColumns'>
                        <div autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" contenteditable="true" class='tableData dataCol'>${steps[i].dataText}</div>
                    </td>
                    <td class='fixedColumnsEven'>
                        <div class="tableData xpathData" autocomplete="off" id="label-${i}" autocorrect="off" autocapitalize="off" spellcheck="false" contenteditable="true" title="${command}">${commandWithDriver}</div>
                    </td>
                    <td id="actionCol">
                        <button id='addStep'></button>
                        <button id='delButton'></button>
                    </td>
                </tr>
                `;
                if(detectLabel){
                    document.querySelector(`#label-${i}`).textContent = commandWithDriver.replace(/labelvalue/i, toCamelCase(steps[i].planeLabel));
                }
            }
        } else {
            for(let i = 0; i < steps.length; i++) {
                element.innerHTML += `
                <tr class="tableRow">
                    <td class='fixedColumns'>
                        <div class='tableData'>${i + 1}</div>
                    </td>
                    <td class='fixedColumns'>
                        <div title="${steps[i].step}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" contenteditable="true" class='tableData allSteps'>${steps[i].step}</div>
                    </td>
                    <td title="${steps[i].dataText}" class='fixedColumns'>
                        <div autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" contenteditable="true" class='tableData dataCol'>${steps[i].dataText}</div>
                    </td>
                    <td class='fixedColumnsEven'>
                        <div autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" contenteditable="true" title="${steps[i].relXpath}" class="tableData xpathData xpathColor">${steps[i].relXpath}</div>
                    </td>
                    <td id="actionCol">
                        <button id='addStep'></button>
                        <button id='delButton'></button>
                    </td>
                </tr>
                `;
            }
        }
    }
    clickCell();
    if(steps.length==0){
        document.querySelector(".tablePlaceholder").style.display = "";
    }
};

function toCamelCase(s){
    return s
        .replace(/_/g, " ")
        .replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
        .replace(/\s/g, '')
        .replace(/^(.)/, function($1) { return $1.toLowerCase(); });
}

function clickCell() {
    var row = document.getElementById('records-grid').rows;
    for (var i = 0; i < row.length; i++) {
        row[i].cells[4].childNodes[3].addEventListener('click', function(e){
            var rowIndex = this.parentNode.parentNode.rowIndex;
            // row.parentNode.removeChild(row);
            steps.splice(rowIndex - 1, 1);
            displayRows();
        });
        row[i].cells[4].childNodes[1].addEventListener('click', function(e){

            var rowIndex = this.parentNode.parentNode.rowIndex;
            steps.splice(rowIndex, 0, { step: '', relXpath: '', dataText: '' });
            displayRows();
            
        });
        row[i].childNodes[7].addEventListener('input', function(e) {
            if(e.data) {
                var rowIndex = this.parentNode.rowIndex;
                steps[rowIndex-1].relXpath = this.innerText;
                this.childNodes[1].classList.remove('removeOutline');
            } else {
                this.childNodes[1].classList.add('removeOutline');
            }
        });
        row[i].childNodes[3].addEventListener('input', function(e) {
            if(e.data) {
                
                var rowIndex = this.parentNode.rowIndex;
                steps[rowIndex-1].step = this.innerText;
                this.childNodes[1].classList.remove('removeOutline');
            } else {
                this.childNodes[1].classList.add('removeOutline');
            }
        });
        row[i].childNodes[5].addEventListener('input', function(e) {
            if(e.data) {
                var rowIndex = this.parentNode.rowIndex;
                steps[rowIndex-1].dataText = this.innerText;
                this.childNodes[1].classList.remove('removeOutline');
            } else {
                this.childNodes[1].classList.add('removeOutline');
            }
        });
    }
};

toggleElement.addEventListener("click", function() {
    let ele = document.querySelector('.inputFeildContainer');
    let updatetitle = document.querySelector('#updatetitle');

    if(this.classList.contains("active")) {
    
        this.classList.remove("active");
        this.classList.add("inactive");
        
        xpathInput.classList.add('hidden');
        xpathInput.classList.remove('show');
        toggleToolTip.textContent = "Click to enable command";
        // this.title = "Click to enable custom xpath";

        helperText.innerText = "Add custom driver command";

        toggleHeader.innerText = 'Xpath';


        ele.classList.remove('showElement');
        ele.classList.add('remove');

        updatetitle.title = 'Click to copy all xpaths';
      
    } else {

        this.classList.remove("inactive");
        this.classList.add("active"); 
        toggleToolTip.textContent = "Click to disable command";

        xpathInput.classList.add('show');
        xpathInput.classList.remove('hidden');

        helperText.innerText = "";

        toggleHeader.innerText = 'Command';


        ele.classList.add('showElement');
        ele.classList.remove('remove');

        updatetitle.title = 'Click to copy all commands';

    }
    displayRows();
});

recordButton.addEventListener('click', function (e) {
    if(recording){

        recording = false;
        recordIcon.style.backgroundImage = "url(../../assets/stopped.svg)";
        pauseBtnToolTip.textContent = "Click to start recording.";        

        senderId ? browser.tabs.sendMessage(senderId, { stopRecording: true }) : null;
    
    }
    else {
    
        recording = true;
        recordIcon.style.backgroundImage = "url(../../assets/pause_grey.svg)";
        pauseBtnToolTip.textContent = "Click to stop recording.";

        senderId ? browser.tabs.sendMessage(senderId, { openRecorder: true }) : null;
    
    }
    return;
});


save_btn.addEventListener('click', function(e) {
    
    var xpathHeader = toggleToolTip.textContent.includes("Click to enable command")?"XPath":"Command";

    if(steps && steps.length) {
        var header = [[ "Step", "Data", xpathHeader ]];
        let stps = document.querySelectorAll('.allSteps');
        let dataCol = document.querySelectorAll('.dataCol');
        let xpathData = document.querySelectorAll('.xpathData');

        let data = steps.map((stp, ind) => {
            return {
                relXpath: xpathData[ind].innerText,
                dataText: dataCol[ind].innerText,
                step: stps[ind].innerText,
            }
        });
        data = data.map(stp =>  [ stp.step, stp.dataText, stp.relXpath ]);
        var testCase = header.concat(data);
        var name = fileName.innerText.replace(/\s/g, '');

        browser.tabs.sendMessage(senderId, {
            type: "downloadReport",
            data: testCase,
            fileName: name || 'testcase'
        });
        
        
    }else {
        showSnackbar('No data to save');
    }

});

function showSnackbar(msg){

    let showWarn = document.querySelector('#snackbar');
    showWarn.innerText = msg;
    showWarn.className = "show";
    setTimeout(function(){ showWarn.className = showWarn.className.replace("show", ""); }, 2000);

}

xpathInput.addEventListener('keyup', function(e) {

    xpathText = e.target.value;

    if(e.keyCode == 13) {
        if(!this.value.toLowerCase().includes('xpathvalue')){
            this.classList.add('wrongXpath');
            showSnackbar('xpathValue keyword should be there in the command.');
            return;
        }
        displayRows();
        updateCPAttr();
    }
    if(!this.value.toLowerCase().includes('xpathvalue')){
        this.classList.add('wrongXpath');
    }else if(this.value.toLowerCase().includes('xpathvalue')){
        this.classList.remove('wrongXpath');
    }

});

window.onload = function(e){ 

    browser.tabs.query({}).then((tabs)=> {
        tabs.forEach(async (tab) => {
            await browser.tabs.sendMessage(tab.id, { openRecorder: true });
        });
    });

    // chrome.identity.getProfileUserInfo(function(userInfo) {
    //     userEmail = userInfo.email || 'Anonymous';
    // });

}

window.onbeforeunload = function(event) {

    // browser.tabs.sendMessage(senderId, { closed: true });
    browser.tabs.query({}).then((tabs)=> {
        tabs.forEach(async (tab) => {
            await browser.tabs.sendMessage(tab.id, { closed: true });
        });
    });
    window.removeEventListener('beforeunload');
};

function notifyMe(title, body) {
    if (Notification.permission === 'granted') {

        var notification = new Notification("AutonomIQ", {
            icon: '../../assets/cpStudio_logo.png',
            body: body
        });

        notification.onclick = function () {
            window.focus();
        };

    }

};

clearTestCase.addEventListener('click', function(e) {
    document.querySelector(".tablePlaceholder").style.display = "";
    element.innerHTML = null;
    steps = [];
});


copyAllButton.addEventListener("click", function() {
    copyAllRowsToClipboard();
});

copyAllXpath.addEventListener('click', function() {
    copyAllXpathToClipboard();
});

copyAllData.addEventListener('click', function() {
    copyAllDataToClipboard();
});


function copyAllXpathToClipboard() {
    let textarea = document.createElement('textarea');
    textarea.id = 't';
    // Optional step to make less noise on the page, if any!
    textarea.style.height = 0;
    // Now append it to your page somewhere, I chose <body>
    document.body.appendChild(textarea);
    // Give our textarea a value of whatever inside the div of id=containerid
    var allRowsData = document.querySelectorAll(".xpathData");
    for(var i=0; i<allRowsData.length; i++){
      textarea.value = textarea.value+"\n"+allRowsData[i].innerText;
    }
  
    let selector = document.querySelector('#t');
    selector.select();
    document.execCommand('copy');
    // Remove the textarea
    document.body.removeChild(textarea);
}

function copyAllDataToClipboard() {
    let textarea = document.createElement('textarea');
    textarea.id = 't';
    // Optional step to make less noise on the page, if any!
    textarea.style.height = 0;
    // Now append it to your page somewhere, I chose <body>
    document.body.appendChild(textarea);
    // Give our textarea a value of whatever inside the div of id=containerid
    var allRowsData = document.querySelectorAll(".dataCol");
    for(var i=0; i<allRowsData.length; i++){
      textarea.value = textarea.value+"\n"+allRowsData[i].innerText;
    }
  
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


    var allRowsData = document.querySelectorAll(".allSteps");
    
    for(var i=0; i<allRowsData.length; i++){
      textarea.value = textarea.value+"\n"+allRowsData[i].innerText;
    }
  
    let selector = document.querySelector('#t');
    selector.select();
    document.execCommand('copy');
    // Remove the textarea
    document.body.removeChild(textarea);
}

function attributeChoicesOption(){
    // var userAttr = userAttrName.value.trim();
    // var idChecked = idCheckbox.checked?“withid”:“withoutid”;
    var idChecked = idAttr.checked ? "withid": "withoutid";
    var classChecked = classAttr.checked ? "withclass" : "withoutclass";
    var nameChecked = nameAttr.checked ? "withname" : "withoutname";
    var placeholderChecked = placeholder.checked ? "withplaceholder" : "withoutplaceholder";
    var textChecked = textXpath.checked ? "withtext" : "withouttext";

    atttrArr =  `,${idChecked},${classChecked},${nameChecked},${placeholderChecked},${textChecked}`;
    browser.tabs.sendMessage(senderId, { attrArray: atttrArr });
}

checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', function() {
        attributeChoicesOption();
        updateCPAttr();
    });
});

function setAttr(data) {

    idAttr.checked = data.idChecked;
    classAttr.checked = data.classChecked;
    nameAttr.checked = data.nameChecked;
    placeholder.checked = data.placeholderChecked;
    textXpath.checked = data.textChecked;

    // xpathInput.value = data.placeholderText;

}


function updateCPAttr(){
    browser.tabs.sendMessage(senderId, {
        name: "updateCPAttr",
        data: {
            idChecked: idAttr.checked,
            classChecked: classAttr.checked,
            nameChecked: nameAttr.checked,
            placeholderChecked: placeholder.checked,
            textChecked: textXpath.checked,
            // placeholderText: xpathInput.value
        }
    });
};
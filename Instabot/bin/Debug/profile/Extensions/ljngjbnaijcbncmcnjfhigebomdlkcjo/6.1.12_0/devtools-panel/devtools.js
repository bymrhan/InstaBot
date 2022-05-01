/**
 * Created by sanjay kumar on 5/12/16.
 */
var backgroundPageConnection = chrome.runtime.connect({
	name: "devtools-page"
});

chrome.devtools.panels.elements.createSidebarPane("ChroPath",
          function(sidebar) {
            sidebar.setPage("../devtools-panel/devtools-content.html");
            sidebar.onShown.addListener(handleShown);
            sidebar.onHidden.addListener(handleHidden);
          }
);
function handleShown() {
  chrome.extension.sendMessage({
  	message: "generate-selector"
  });
}


function handleHidden() {
  var xpathOrCss = 'xpath';
  var onChange = false;
  var xpath = [xpathOrCss, '', onChange];
  backgroundPageConnection.postMessage({
      name: "highlight-element",
      tabId: chrome.devtools.inspectedWindow.tabId,
      xpath: xpath
  });   
}


ChroPath 6.0

ChroPath generates all possible selectors just by one click. ChroPath can also be used as Editor for selectors. It makes easy to write, edit, extract, and evaluate XPath queries on any webpage. ChroPath Studio helps to record all manual steps along with automation steps. With smart maintenance feature, all xpaths can be verified from script in single shot. ChroPath also supports iframe, multi selectors generation, dynamic attributes, generate relative xpath with custom attribute, automation script steps generation and many more.

Please contact Sanjay Kumar, ChroPath Creator & Product Evangelist at chropath@autonomiq.io for support.

How to use ChroPath:

1. Right-click on the web page, and then click Inspect.
2. In the right side of Elements tab, click on ChroPath tab which will be the last tab.
3. To generate selectors, inspect element or click on any DOM node, it will generate the unique relative XPath and all possible Selectors with their occurrences. Scroll in ChroPath panel to see all generated Selectors.
4. To evaluate XPath/CSS, type the XPath/CSS query and press enter key.
	As you enter, it will query in DOM for the relevant element/node. You can view the total number of the matching node(s) and nodes value as per their sequential occurrence. A green colour outline appears around to highlight the first matching elements and rest in blue colour in the web page.
5. If you mouse hover on any matching node in the ChroPath tab, green/blue dashed outline will convert into dotted orange red to highlight the corresponding element in the webpage.
6. If the found element is not in visible area on webpage then mouse hover on found node in ChroPath panel will scroll that element in the visible area with dotted orange red outline.
7. If found element is not highlighted but visible then on mouse hover on matching node on ChroPath tab it will highlight element with dotted orange red outline.
8. Copy the locators just by clicking on copy icon.
9. click on edit icon if want to edit any locator.

What is CP suggested XPath?

1. This is the XPath for the 1st matching node of your selector.
2. It is really helpful in multiple scenarios. For ex-
	a. If you don’t know how to write robust unique relative xpath & you have written XPath using indexes or dynamic attributes then CP will suggest the best relative xpath. 
	b. If you are trying to verify //a and it found 100 matching elements then CP suggested XPath will be the XPath for 1st link.
3. CP suggested XPath will be the robust and unique as it is generated from ChroPath relative xpath algorithm.
4. With help of this feature one can save lot of time and learn how to write robust unique relative XPath. 

Generate selectors with user attribute or with/without text

1. Enter the attribute name with which you want to generate the relative xpath in the attribute name box.
2. There are shortcuts for few attributes. For ex- If you don’t want relative xpath with id then uncheck the id checkbox, CP will generate the relative XPath without id.
3. If you want to generate XPath without text/label, just uncheck the text checkbox.
4. Your attribute preference will be saved so next time when you will open
5. CP, it will generate with the preset attributes preference. 
6. You can reset the attribute values to default by clicking on reset button.

iframe feature (*Supports only those iframe which has the same src.):
If inspected element is inside iframe, 
1. CP will show "inside iframe" text in selector box.
2. It will highlight the inspected element in orange dotted outline.
3. CP will generate xpath for the iframe inside which the inspected element exist along with xpath for inspected element.
4. If you want to verify your selector inside iframe then 1st inspect any element inside that iframe so that it get the DOM of iframe and then verify the selector.
5. Again if you want to verify any selector for a element which is outside iframe then first inspect any element which is outside iframe so that it get the top DOM and then verify the selector.

How to generate Automation code:

1. Click on the set driver command icon (+ icon, just below selector box) in ChroPath tab.
2. Now when you will generate selectors, it will generate selectors with pre-command like driver.findElement(By.xpath('xpathValue'))  appended in selectors.
3. You can also change these command. Like FindByXpath('xpathValue'). Just have the keyword 'xpathValue' in your command where you want to replace the selector value.
4. Now just by clicking on copy icon you got full automation step.
5. It will add the pre-command only when this is active, if you don't want to add pre-command click on the plus icon again.

How to generate XPaths for multiple elements in few seconds:

1. Click on the record button (circular icon) in ChroPath tab.
2. Now just inspect all the elements one by one or click on DOM node for which you want to generate the XPaths.
3. It will generate xpath along with label name.
4. You can copy, edit, delete any of the row in table.
5. Label and xpath fields are editable, so you can directly edit them there itself.
6. Click to CopyAll icon given in header to copy all xpaths value.
7. You can also export all the generated xpaths, just by clicking Export icon given in the table header in ChroPath tab.
8. At any point of time if you want to stop recording and go back to default view, just click on record button again. This will not delete your recorded selectors but if you will close the devtool then you will loose them.
9. Click on DeleteAll icon to clear all the rows.
10. You can also stop recording at anytime just by clicking on ON/OFF button.
11. Every time when you will open devtool and then ChroPath, it will be fresh window. 


How to generate multiple automation script steps in few seconds:

1. Before or after generating the multiple XPaths,  in recorder mode just click on the set driver command icon (+ icon, just below selector box) in CP tab.
2. You can update the command which you use in your framework on XPath and press enter. Here just keep the keyword “xpathValue” in where you type xpath in your command.
3. Great thing is that now you can generate the command with label as well. Just replace the label by “labelvalue” keyword in your command. For ex- @FindBy(xpath=“xpathvalue”) @CacheLookup private WebElement labelvalue;
4. If XPaths have been already generated then CP will append the command on all of them.
5. Also you can inspect more elements one by one or click on DOM node for which you want to generate the command.
6. It will generate commands along with label name.
7. Rest you have all the features like CopyAll, DeleteAll and export all the commands in xls.
8. Just single click, you can get commands for all the required elements and paste in your framework. 
9. For page object model, it’s really time saver.


How to use ChroPath Studio:
ChroPath Studio automates the manual test case writing process. Using this one can generate the manual test case as well as automation script in few seconds. It is developed on the ChroPath platform. It accelerates the testing process both manual and automation.

1. Click on the video icon (just below selector box) in ChroPath tab. You can also open CP studio from browser toolbar. Click on ChroPath logo in toolbar then there click on the video icon present in top right corner.
2. It will open a separate window which is the ChroPath Studio.
3. Now you can continue performing your manual testing and CP studio will keep recording your steps in plain english.
4. It will also generate xpath with automation command by default.
5. You can update the command as per your framework.
6. There is add and delete button in each row if you missed any step then you can add it or delete.
6. Once you are done, you can save the test case. You can rename the test case before saving it.
7. There is also copy all row button if you don't want to save file then just copy and paste in your system.
8. There is stop/record button in CP studio. If at any point you want to pause the recording then click on it.

How to use Smart Maintenance feature: Just paste complete script and it will verify all your XPath:

1. First go to that web page for which you want to verify all the XPaths.
2. Now click on Smart Maintenance icon(2nd last icon) given just below selector box in ChroPath tab.
3. There are two ways to verify all XPaths in your script-
	i) Just paste the complete script:
		a) Click on edit icon (present in smart maintenance header),
		b) Pass the same command which is used in script on XPath and just replace the xpath by xpathValue keyword. If there is no command then turn off the command option. For ex- driver.findElement(By.xpath("//input")) then pass the command as driver.findElement(By.xpath("xpathValue"))
		c) Paste the complete script in the given box and click on OK.
		d) It will show all the XPaths with their occurrences in the page.
		e) You can copy all the XPaths by clicking on CopyAll icon given in header or export them by clicking on export icon.
	ii) Upload the script/xpaths file(supported only for downloaded files from  ChroPath):
		a) Click on upload xpath xls file icon
		b) Set the command
		c) Click on next
		d) Upload the file which has the xpath values
		e) It will show all the XPaths with their occurrences in the page.

Dynamic ID/Class support:

1. CP will show alert if generate rel xpath contains alphanumeric id or class.
2. To generate relative xpath without id/class, uncheck the respective checkbox.

On/Off button:

1. If you don't want to generate selectors, turn off the button available in ChroPath tab.
2. Turn on the button to enable ChroPath again.

Dark Theme:

1. To use dark theme, go to devtools settings.
2. Change the Theme from Light to Dark.

Get selectors and editor both the options in single selector view:

1. If you want to work with any particular selector like Rel XPath only, then change the selectors drop down value to Rel XPath.
2. Here you will get Rel XPath as in separate row like default view and editor box empty to use ChroPath as editor in the same time.

UI features:

1. CopyAll and delete all button in multi selector recorder screen and smart maintenance screen.
2. Now ChroPath gives the colored relative xpath.
3. Clear all option in place of delete one by one text in selector box.
4. All important links given in footer related to ChroPath.


Note: 
1. For one selector only, change the dropdown value from selectors to rel XPath/abs Xpath/CSS sel in header.
2. Tool will add xpath/css attribute to all the matching node(s) as per their sequential occurrence. For example, a matching node appearing second in the list will have xpath=2. And if verifying CSS then it will add css=2.
3. Supports only those iframe which are from the same src.
// constants
const ATTRIBUTE_LABELS = [
    'label', 'aria-label', 'data-label',
    'data-fieldlabel', 'data-displaylabel'
];

// regular expressions
const PT_MULTISPACE = /\s+/g;
const PT_SKIP_CHARS = /[^A-Za-z0-9\s\-\.\?\(\)\[\]\{\},;]+/g;

// css selectors
const CSS_FORMS = 'form';
const CSS_DIRECT_LABELS = 'label[for],input[aria-labelledby],'
    + 'select[aria-labelledby],button[aria-labelledby],textarea[aria-labelledby],'
    + '*[aria-labelledby][role=checkbox],*[aria-labelledby][role=radio],'
    + '*[aria-labelledby][role=listbox],*[aria-labelledby][role=textbox],'
    + '*[aria-labelledby][role=button]';
const CSS_DIRECT_INPUT_ELEMENTS = 'input,select,button,textarea';
const CSS_ROLE_BASED_INPUT_ELEMENTS = '*[role=checkbox],*[role=radio],'
    + '*[role=listbox],*[role=textbox],*[role=button]';
const SIBLING_LABEL_ELEMENTS = '*[class*=label],*[class*=Label],'
    + '*[class*=LABEL],*[class*=lbl],*[class*=Lbl],*[class*=LBL],'
    + '*[name*=label],*[name*=Label],*[name*=LABEL],*[name*=lbl],'
    + '*[name*=Lbl],*[name*=LBL]';

// enums
const ElementType = Object.freeze({
    'TEXT': 1, 'RADIO': 2, 'CHECKBOX': 3, 'SELECT': 4, 'BUTTON': 5,
    'IMAGE': 6, 'EMAIL': 7, 'FILE': 8, 'PHONE': 9, 'ANCHOR': 10, 'HIDDEN': 11,
    'OTHER': 99
});
const LabelPreference = Object.freeze({
    'LEFT': 1, 'RIGHT': 2, 'CENTER': 3, 'NONE': 99
});

// class
// constructor
function WebPage(document) {
    if (!document instanceof HTMLDocument) {
        throw new Error('InvalidArgumentError: WebPage constructor -'
            + ' param "document" should be of type HTMLDocument');
    }

    this.document = document;
    this.directLabelMap = getDirectLabelMap.call(this);
}

// public methods
WebPage.prototype.getLabel = function (element) {
    if (!element instanceof HTMLElement) {
        throw new Error('InvalidArgumentError: WebPage getLabel -'
            + ' param "element" should be of type HTMLElement');
    }

    var type = getElementType(element);
    var labelPref = getLabelPreference(type);

    // turn away requests for hidden elements
    if (type === ElementType.HIDDEN || isElementHidden(element)) {
        return null;
    }

    // check if we have a direct label
    if (this.directLabelMap.has(element)) {
        return this.directLabelMap.get(element);
    }

    // find the wrapping form tag, if any
    var form = element;
    while (form = form.parentElement) {
        if (form.tagName.toLowerCase() === 'form') {
            break;
        }
    }

    var xLabel, labelMethod;
    switch (type) {
        case ElementType.ANCHOR:
            labelMethod = getAnchorLabel; break;
        case ElementType.BUTTON:
            labelMethod = getButtonLabel; break;
        case ElementType.RADIO:
        case ElementType.CHECKBOX:
            labelMethod = getRadioLabel; break;
        default:
            labelMethod = null;
    }
    var xLabel = labelMethod === null ? null : labelMethod(element);
    if (xLabel !== null) {
        return xLabel;
    }

    // possible bootstrap form layout
    if (form !== null && isFormElement(type)) {
        var parent = element, label, labelElement;
        while (parent = parent.parentElement) {
            if (parent === form) {
                break;
            }
            if ((parent.getAttribute('class') || '').indexOf('form-group')) {
                var labelElements = parent.getElementsByTagName('label');
                if (labelElements.length > 0) {
                    labelElement = labelElements[0];
                    label = textContent(labelElement);
                }
                break;
            }
        }
        if (isValidLabel(label)) {
            return { text: label, element: labelElement };
        }
    }

    // if the element is possibly wrapped by an anchor or button tag
    // the label will be the complete text inside the wrapper
    if (labelPref === LabelPreference.NONE) {
        var ancestor = getFirstAncestorByTagName(element, ['a', 'button']);
        if (ancestor !== null) {
            labelMethod = ancestor.tagName.toLowerCase() === 'a'
                ? getAnchorLabel : getButtonLabel;
            return labelMethod(ancestor);
        }
    }

    // for images
    if (type === ElementType.IMAGE) {
        xLabel = getImageLabel(element);
        if (xLabel !== null) {
            return xLabel;
        }
    }

    // handle attribute specific cases
    xLabel = getAttributeLabel(element);
    if (xLabel !== null) {
        return xLabel;
    }

    // get the element wrapper
    var maxElement = (form !== null && isFormElement(type)) ? form : null;
    var elementWrapper = getElementWrapper(element, maxElement, labelPref);

    // get label from the text content of the current element
    if (labelPref === LabelPreference.NONE) {
        label = textContent(element);
        if (isValidLabel(label)) {
            return { text: label, element: null };
        }
    }

    // if we have a head/tail text then thats our label
    labelMethod = null;
    if (labelPref === LabelPreference.scrollLeft
        || labelPref === LabelPreference.NONE) {
        labelMethod = getHeadText;
    } else if (labelPref === LabelPreference.LEFT) {
        labelMethod = getTailText;
    }
    xLabel = labelMethod === null ? null : labelMethod(elementWrapper);
    if (xLabel !== null) {
        return xLabel;
    }

    // get label from siblings
    xLabel = getLabelFromSiblings(elementWrapper, labelPref);
    if (xLabel !== null) {
        return xLabel;
    }

    // fallback cases
    switch (type) {
        case ElementType.EMAIL:
        case ElementType.FILE:
        case ElementType.PHONE:
            labelMethod = getFallbackInputLabel; break;
        case ElementType.TEXT:
            labelMethod = getFallbackTextLabel; break;
        case ElementType.SELECT:
            labelMethod = getFallbackSelectLabel; break;
        default:
            labelMethod = getFallbackAttributeLabel;
    }
    xLabel = labelMethod(element, type);
    return xLabel;
};

// private methods
function getElementType(element) {
    var tag = element.tagName.toLowerCase();
    var type = (element.getAttribute('type') || '').toLowerCase();
    var role = (element.getAttribute('role') || '').toLowerCase();

    var _type;
    switch (tag) {
        case 'input':
            switch (type) {
                case 'button':
                case 'submit':
                case 'reset':
                    _type = ElementType.BUTTON; break;
                case 'radio':
                    _type = ElementType.RADIO.break;
                case 'checkbox':
                    _type = ElementType.CHECKBOX; break;
                case 'image':
                    _type = ElementType.IMAGE; break;
                case 'email':
                    _type = ElementType.EMAIL; break;
                case 'file':
                    _type = ElementType.FILE; break;
                case 'tel':
                    _type = ElementType.PHONE; break;
                case 'hidden':
                    _type = ElementType.HIDDEN; break;
                case 'text':
                case 'password':
                case 'search':
                case 'number':
                case 'week':
                case 'url':
                default:
                    _type = ElementType.TEXT;
            }
            break;
        case 'a':
            _type = ElementType.ANCHOR; break;
        case 'img':
            _type = ElementType.IMAGE; break;
        case 'select':
            _type = ElementType.SELECT; break;
        case 'radio':
            _type = ElementType.RADIO; break;
        case 'button':
            _type = ElementType.BUTTON; break;
        case 'textarea':
            _type = ElementType.TEXT; break;
        default:
            switch (role) {
                case 'textbox':
                    _type = ElementType.TEXT; break;
                case 'radio':
                    _type = ElementType.RADIO; break;
                case 'checkbox':
                    _type = ElementType.CHECKBOX; break;
                case 'listbox':
                    _type = ElementType.SELECT; break;
                case 'button':
                    _type = ElementType.BUTTON; break;
                default:
                    _type = ElementType.OTHER;
            }
    }
    return _type;
}

function getElementWrapper(element, maxElement, labelPref) {
    // TODO: make a list of to-be-ignored tags and avoid hard-coding
    var tag = element.tagName.toLowerCase();
    var text = tag === 'select' ? '' : textContent(element);

    // check self text content
    if (labelPref === LabelPreference.NONE && text !== '') {
        return element;
    }

    // check head/tail text of appropriate siblings
    if (labelPref === LabelPreference.RIGHT
        || labelPref === LabelPreference.LEFT) {
        var siblings = getSiblings(element, labelPref);
        for (var i = 0; i < siblings.length; i++) {
            var sibling = siblings[i];
            if (sibling.tagName.toLowerCase() === 'select') {
                continue;
            }

            _sibling = cloneAndClean(sibling);
            if (isValidLabel(textContent(_sibling))) {
                return element;
            }

            var xLabel;
            if (labelPref === LabelPreference.LEFT) {
                xLabel = getHeadText(sibling);
            } else if (labelPref === LabelPreference.RIGHT) {
                xLabel = getTailText(sibling);
            }
            if (xLabel !== null) {
                return element;
            }
        }
    }

    // go up the DOM tree to find the correct wrapper
    var ancestor = element;
    do {
        if (labelPref == LabelPreference.LEFT && !isFirstSibling(ancestor)) {
            return ancestor;
        } else if (labelPref == LabelPreference.RIGHT && !isLastSibling(ancestor)) {
            return ancestor;
        }
        ancestor = ancestor.parentElement;
    } while (ancestor !== null && ancestor !== maxElement);

    // unable to find a proper wrapper
    return element;
}

function isFirstSibling(element) {
    var precedingSiblings = getSiblings(element, true);
    if (precedingSiblings.length === 0) {
        return true;
    }

    // if there is a preceding sibling with a valid text content
    // then the given element is not the first sibling
    for (var i = 0; i < precedingSiblings.length; i++) {
        var sibling = precedingSiblings[i];
        if (sibling.tagName.toLowerCase() !== 'select'
            && isValidLabel(textContent(sibling))) {
            return false;
        }
    }

    return true;
}

function isLastSibling(element) {
    var followingSiblings = getSiblings(element, false);
    if (followingSiblings.length === 0) {
        return true;
    }

    // if there is a following sibling with a valid text content
    // then the given element is not the first sibling
    for (var i = 0; i < followingSiblings.length; i++) {
        var sibling = followingSiblings[i];
        if (sibling.tagName.toLowerCase() !== 'select'
            && isValidLabel(textContent(sibling))) {
            return false;
        }
    }

    return true;
}

function isFormElement(type) {
    return type === ElementType.TEXT || type === ElementType.PHONE
        || type === ElementType.EMAIL || type === ElementType.FILE
        || type === ElementType.RADIO || type === ElementType.CHECKBOX
        || type === ElementType.SELECT;
}

function getLabelPreference(type) {
    if (type === ElementType.RADIO || type === ElementType.CHECKBOX) {
        return LabelPreference.RIGHT;
    } else if (type === ElementType.TEXT || type === ElementType.PHONE
        || type === ElementType.EMAIL || type === ElementType.FILE
        || type === ElementType.SELECT) {
        return LabelPreference.LEFT;
    }
    return LabelPreference.NONE;
}

function isTemporaryLabel(label) {
    if (label === null) {
        return true;
    }
    label = label.trim();
    return label === '' || /(?:required|mandatory|missing|error)/i.test(label);
}

function isValidLabel(label) {
    if (!!label) {
        label = label.replace(PT_SKIP_CHARS, '');
        label = label.replace(PT_MULTISPACE, ' ');
        label = label.trim();
    }
    return label !== null && typeof (label) !== 'undefined' && label !== '';
}

function isElementHidden(element) {
    return element.offsetParent === null;
}

function cloneAndClean(element, skipElement) {
    var _element = element.cloneNode(true);

    // remove select elements
    _element
        .querySelectorAll('select')
        .forEach(function (selectElement) {
            if (selectElement !== _element && selectElement !== skipElement) {
                selectElement.remove();
            }
        });

    // find & mark hidden descendants (cant be found in cloned nodes)
    var hidden = [];
    element
        .querySelectorAll('*')
        .forEach(function (descendant) {
            if (descendant !== _element && isElementHidden(descendant)) {
                hidden.push(descendant.outerHtml);
            }
        });

    // remove hiddden descendants from the clone
    _element
        .querySelectorAll('*')
        .forEach(function (descendant) {
            if (hidden.length > 0 && descendant.outerHtml === hidden[0]) {
                descendant.remove();
                hidden.shift();
            }
        });

    return _element;
}

function getFirstAncestorByTagName(element, allowedTags) {
    if (allowedTags === null || allowedTags.length === 0) {
        return null;
    }

    var ancestor = element.parentElement;
    while (ancestor !== null) {
        if (allowedTags.indexOf(ancestor.tagName.toLowerCase()) >= 0) {
            return ancestor;
        }
        ancestor = ancestor.parentElement;
    }
    return null;
}

function getSiblings(element, preceding) {
    var siblings = [];
    while (element = preceding ?
        element.previousElementSibling : element.nextElementSibling) {
        if (element.nodeType === Node.ELEMENT_NODE) {
            siblings.push(element);
        }
    }
    return siblings;
}

function textContent(element) {
    if (!element || !element instanceof Node) {
        return '';
    }
    return element.textContent.replace(PT_MULTISPACE, ' ').trim();
}

function getHeadText(element) {
    var text = element && element.previousSibling
        && element.previousSibling.nodeType === Node.TEXT_NODE
        && element.previousSibling.nodeValue
        && element.previousSibling.nodeValue.trim();
    if (!!text) {
        return { text: text, element: null };
    }
    return null;
}

function getTailText(element) {
    var text = element && element.nextSibling
        && element.nextSibling.nodeType === Node.TEXT_NODE
        && element.nextSibling.nodeValue
        && element.nextSibling.nodeValue.trim();
    if (!!text) {
        return { text: text, element: null };
    }
    return null;
}

function getToolTipLabel(element) {
    var attributes = ['alt', 'title'];
    for (var i = 0; i < attributes.length; i++) {
        label = element.getAttribute(attributes[i]);
        if (label !== null) {
            return { text: label.trim(), element: null };
        }
    }
    return null;
}

function getAnchorLabel(element) {
    // text content
    var label = textContent(element);
    if (isValidLabel(label)) {
        return { text: label, element: null };
    }

    // handle embedded images
    var descendant = element.querySelector('img');
    if (descendant !== null) {
        var xLabel = getImageLabel(descendant);
        if (xLabel !== null) {
            return xLabel;
        }
    }

    // handle tool tip
    return getToolTipLabel(element);
}

function getButtonLabel(element) {
    // text content & value attribute
    var label = textContent(element) || element.getAttribute('value');
    if (isValidLabel(label)) {
        return { text: label, element: null };
    }

    // handle embedded images
    var descendant = element.querySelector('img');
    if (descendant !== null) {
        var xLabel = getImageLabel(descendant);
        if (xLabel !== null) {
            return xLabel;
        }
    }

    // handle icons
    for (var i = 0; i < element.children.length; i++) {
        var child = element.children[i];
        for (var j = 0; j < child.classList.length; j++) {
            var className = child.classList[j];
            if (/(?:glyphicon|icon)\-/i.test(className)) {
                var icon = className.replace(/(?:glyphicon|icon)\-/ig, '').trim();
                if (!!icon) {
                    return { text: icon, element: null };
                }
            }
        }
    }

    // handle submit & reset buttons
    var type="";
    try{
        type = element.getAttribute('type').toLowerCase();
    }catch(err){
        type = element.getAttribute('onclick');
        type = type?type.split("(")[0].toLowerCase():type;
    }
    if (type === 'submit') {
        return { text: 'Submit', element: null };
    } else if (type === 'reset') {
        return { text: 'Reset', element: null };
    } else {
        return { text: type, element: null };
    }

    // handle tool tip
    return this.getToolTipLabel(element);
}

function getRadioLabel(element) {
    // tail text
    var xLabel = getTailText(element);
    if (xLabel !== null) {
        return xLabel;
    }

    // following sibling text
    xLabel = getLabelFromSiblings(element, LabelPreference.RIGHT);
    if (xLabel !== null) {
        return xLabel;
    }

    // handle tool tip
    return getToolTipLabel(element);
}

function getImageLabel(element) {
    // handle tool tip
    return getToolTipLabel(element);
}

function getAttributeLabel(element) {
    for (var i = 0; i < ATTRIBUTE_LABELS.length; i++) {
        var attribute = ATTRIBUTE_LABELS[i];
        var label = element.getAttribute(attribute);
        if (label !== null) {
            return { text: label, element: null };
        }
    }
    return null;
}

function getFallbackTextLabel(element) {
    var attributes = ['placeholder', 'alt', 'title'];
    var label;
    for (var i = 0; i < attributes.length; i++) {
        label = element.getAttribute(attributes[i]);
        if (label !== null) {
            return { text: label.trim(), element: null };
        }
    }

    if ((element.getAttribute('type') || '').toLowerCase() === 'search') {
        return { text: 'Search', element: null };
    }
}

function getFallbackInputLabel(element, type) {
    var xLabel = getFallbackTextLabel(element);
    if (xLabel !== null) {
        return xLabel;
    }

    var label;
    switch (type) {
        case LabelPreference.EMAIL:
            label = 'eMail'; break;
        case LabelPreference.FILE:
            label = 'File'; break;
        case LabelPreference.PHONE:
            label = 'Phone'; break;
        default:
            label = null;
    }
    return label === null ? label : { text: label, element: null };
}

function getFallbackSelectLabel(element) {
    // handle tool tip
    var xLabel = getToolTipLabel(element);
    if (xLabel !== null) {
        return xLabel;
    }

    var tag = element.tagName.toLowerCase();
    var role = (element.getAttribute('role') || '').toLowerCase();

    // retrieve the first selected option
    var optionElement;
    if (tag === 'select') {
        optionElement = element.querySelector('option[selected]')
            || element.querySelector('option');
    } else if (role === 'listbox') {
        optionElement = element.querySelector('*[role=option][class~=selected]')
            || element.querySelector('*[role=option]');
    }
    if (optionElement !== null) {
        var label = textContent(optionElement);
        if (isValidLabel(label) && !/none/.test(label.toLowerCase())) {
            return { text: label.replace(/\-/g, '').trim(), element: null };
        }
    }
    return null;
}

function getFallbackAttributeLabel(element) {
    var attributes = ['name', 'data-name'];
    for (var i = 0; i < attributes.length; i++) {
        var label = element.getAttribute(attributes[i]);
        if (label !== null) {
            return { text: label.trim(), element: null };
        }
    }
    return null;
}

function getLabelFromSiblings(element, labelPref) {
    var label, labelMethod, siblings;

    if (labelPref === LabelPreference.LEFT) {
        siblings = getSiblings(element, true);
    } else if (labelPref === LabelPreference.RIGHT) {
        siblings = getSiblings(element, false);
    } else if (labelPref === LabelPreference.NONE) {
        siblings = getSiblings(element, true);
        siblings = siblings.concat(getSiblings(element, false));
    }

    // check for label elements preceding or following the current element
    for (var i = 0; i < siblings.length; i++) {
        var sibling = siblings[i];

        // if sibling is a label tag without a 'for' attribute
        // then it most likely should be the label
        if (sibling.tagName.toLowerCase() === 'label'
            && !!!sibling.getAttribute('for')) {
            label = textContent(sibling);
            if (isValidLabel(label)) {
                return { text: label, element: sibling };
            }
        }

        // possible label element being present
        var descendant = sibling.querySelector(SIBLING_LABEL_ELEMENTS);
        if (descendant !== null) {
            label = textContent(cloneAndClean(descendant));
            if (isValidLabel(label)) {
                return { text: label, element: descendant };
            }
        }
    }

    for (var i = 0; i < siblings.length; i++) {
        var sibling = siblings[i];

        // head/tail text
        labelMethod = labelPref === LabelPreference.LEFT ? getHeadText
            : (labelPref === LabelPreference.RIGHT ? getTailText : null);
        xLabel = labelMethod !== null && labelMethod(sibling);
        if (xLabel !== null) {
            return xLabel;
        }

        // if the sibling has any text content it is the label
        label = textContent(cloneAndClean(sibling));
        if (isValidLabel(label)) {
            return { text: label, element: sibling };
        }
    }
    return null;
}

function getDirectLabelMap() {
    var map = new Map();
    var self = this;

    this.document
        .querySelectorAll(CSS_DIRECT_LABELS)
        .forEach(function (labelElement) {
            var element, label;

            var forAttr = labelElement.getAttribute('for');
            if (forAttr !== null) {
                element = self.document.getElementById(forAttr);
                label = textContent(labelElement);

                if (element !== null && isValidLabel(label)) {
                    var type = getElementType(element);
                    if (type === ElementType.RADIO || type === ElementType.CHECKBOX) {
                        xLabel = getRadioLabel(element);
                        label = xLabel === null ? null : xLabel.text;
                    }
                }
            }

            var labelledbyAttr = labelElement.getAttribute('aria-labelledby');
            if (labelledbyAttr !== null) {
                element = labelElement;
                labelElement = self.document.getElementById(labelledbyAttr);

                var parts = labelledbyAttr.split(' ');
                var index = parts.length - 1;
                while (labelElement === null && index >= 0) {
                    labelElement = self.document.getElementById(parts[index--]);
                }

                label = textContent(labelElement);
            }

            if (!!element && !!label) {
                var xLabel = { text: label, element: labelElement };
                if (map.has(element)) {
                    var xPrevLabel = map[element];

                    if (isTemporaryLabel(xLabel.text)
                        || isElementHidden(xLabel.element)) {
                        // let the previous one be
                        return;
                    }

                    if (xPrevLabel && xPrevLabel.text && (isTemporaryLabel(xPrevLabel.text)
                        || !isElementHidden(xPrevLabel.element))) {
                        // override the previous one
                        map.set(element, xLabel);
                        return;
                    }

                    // both elements are valid
                    // allow the new one to override
                }
                map.set(element, xLabel);
            }
        });

    return map;
}

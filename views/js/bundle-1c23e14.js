(function() {
    "use strict";
  
    const mutationOptions = {
      attributes: true,
      attributeFilter: ["class"],
      childList: false,
      characterData: false
    };
  
    function hydrationCallback(target, callback, mutationObserver) {
      if (this.classList.contains("hydrated")) {
        mutationObserver.disconnect();
        callback(this);
      }
    }
  
    function formSubmission(event) {
      const form = event.target.closest("form");
      if (event.detail.target.name === "_eventId" && !this.isSubmitting) {
        const hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.name = "_eventId";
        hiddenInput.value = event.detail.target.value;
        this.isSubmitting = true;
        form.appendChild(hiddenInput);
        form.submit();
      }
    }
  
    function formValidation(event) {
      const element = event.target;
      if (
        !element.isSubmitting &&
        (!event.submitter || !event.submitter.hasAttribute("formnovalidate")) ||
        element.checkValidity()
      ) {
        const prismButton = event.submitter.closest("prism-button");
        if (prismButton && prismButton.getAttribute("display") !== "link") {
          prismButton.setAttribute("loading", "true");
        }
        element.isSubmitting = true;
      } else {
        event.preventDefault();
      }
    }
  
    function attachListeners() {
      const mainForm = document.querySelector("main form");
      if (mainForm) {
        mainForm.addEventListener("submit", formValidation);
        mainForm.addEventListener("prismPress", formSubmission);
        mainForm.addEventListener("prismClick", formSubmission);
      }
    }
  
    function addHydrationListener(target, callback) {
      const observer = new MutationObserver(hydrationCallback.bind(target, callback));
      observer.observe(target, mutationOptions);
    }
  
    (() => {
      const layout = document.querySelector("prism-layout");
      if (layout) {
        addHydrationListener(layout, attachListeners);
      } else {
        attachListeners();
      }
    })();
  
    function updateErrorMessage(event) {
      const target = event.target;
      let input = null;
      if (!event.detail || !(input = event.detail.target)) {
        input = target.querySelector("input,select");
      }
      validateAndUpdateError(target, input);
    }
  
    function validateAndUpdateError(target, input) {
      const validityType = Object.keys(input.validity).find(key => input.validity[key]);
      if (validityType) {
        const errorType = getErrorType(validityType, target, input);
        target.setAttribute("invalid-message", errorType);
      }
    }
  
    function getErrorType(type, target, input) {
      let error = null;
      const customError = type === "customError" ? type + input.validationMessage.charAt(0).toUpperCase() + input.validationMessage.substring(1) : null;
      const datasetError = customError && input.dataset[customError] || input.dataset[type] || input._originalInvalidMessage;
      if (typeof datasetError !== "string") {
        console.warn(`No error message found for "${type}" constraint for "${input.getAttribute("name")}" field.`);
      }
      return datasetError || "";
    }
  
    const inputTypes = ["prism-input-text", "prism-select", "prism-checkbox"];
  
    function handleInputChange(event) {
      const target = event.target;
      if (target && inputTypes.includes(target.nodeName.toLowerCase())) {
        updateErrorMessage(event);
      }
    }
  
    function mimicSubmit(event) {
      const target = event.detail.target;
      const parent = document.createElement("button");
      parent.type = "submit";
      parent.hidden = true;
      parent.formNoValidate = target.formNoValidate;
      parent.name = target.value.indexOf("=") === -1 ? target.value : target.value.substring(0, target.value.indexOf("="));
      parent.value = target.value.indexOf("=") === -1 ? "" : target.value.substring(target.value.indexOf("=") + 1);
      target.parentElement.insertBefore(parent, target);
      parent.click();
    }
  
    function addLoader(event) {
      event.target.setAttribute("loading", "true");
    }
  
    function setAttributesFromDataset(element) {
      const attribute = element.getAttribute("attr");
      if (attribute) {
        element.attr = JSON.parse(attribute);
      }
    }
  
    function openRelatedElement(event) {
      const id = event.target.dataset.idRef;
      const element = document.getElementById(id);
      if (element) {
        element.setAttribute("open", "true");
      }
    }
  
    document.addEventListener("prismInvalid", handleInputChange);
    document.addEventListener("prismChange", handleInputChange);
  
    document.querySelectorAll("prism-button[name=_submit]:not([type=submit],[type=reset])").forEach((button) => {
      button.addEventListener("prismPress", mimicSubmit);
    });
  
    document.querySelectorAll("prism-input-text[data-trim-on-blur]").forEach((input) => {
      input.addEventListener("prismChange", (event) => {
        const target = event.target;
        target.value = target.value.trim();
      });
    });
  
    document.querySelectorAll("prism-button[data-loader]").forEach((button) => {
      button.addEventListener("prismPress", addLoader);
    });
  
    document.querySelectorAll("prism-lineitem").forEach(setAttributesFromDataset);
  
    document.querySelectorAll("button[data-id-ref],prism-button[data-id-ref]").forEach((button) => {
      button.localName === "prism-button" ? button.addEventListener("prismPress", openRelatedElement) : button.addEventListener("click", openRelatedElement);
    });
  
    // Async function...
    (async () => {
      const signinForm = document.querySelector("form[name=signin]");
      if (signinForm) {
        const userAvailable = await checkUserAvailability();
        const hiddenInput = createHiddenInput("userVerifyingPlatformAuthenticatorAvailable", userAvailable.toString());
        signinForm.appendChild(hiddenInput);
      }
    })();
  
    async function checkUserAvailability() {
      return !!window.PublicKeyCredential && await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  
    function createHiddenInput(name, value) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      return input;
    }
  
  })();
  
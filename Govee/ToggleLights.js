// main.js
var buttonManager = require("buttons");
var http = require("http");

// Govee configuration
var goveeApiKey = YOUR-GOVEE-API-KEY;
var deviceIds = [DEVICE-ID-1, DEVICE-ID-2];  // Get from Govee Home app -> Device Settings
var goveeUrl = "https://openapi.govee.com/router/api/v1/device/control";

// Function to generate a UUID for requestId
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function toggleLights(callback) {
    // Get the current state of the light
    const stateRequest = {
        url: `https://openapi.api.govee.com/router/api/v1/device/state`,
        method: "POST",
        headers: {
            "Govee-API-Key": goveeApiKey,
            "Content-Type": "application/json"
        },
        content: JSON.stringify({
            requestId: generateUUID(),
            payload: {
                device: deviceIds[0],
                sku: "H6008" // Model number of the Light
            }
        })
    };

//    Can be used for debugging
//    console.log("State request:", JSON.stringify(stateRequest, null, 2));

    http.makeRequest(stateRequest, function(err, res) {
        if (err) {
            console.log("Error getting state:", err);
            return;
        }

//        Can be used for debugging
//        console.log("State response:", res.content);
        
        let data;
        try {
            data = JSON.parse(res.content);
        } catch (e) {
            console.log("Error parsing response:", e);
            return;
        }

        let currentState = false;
        if (data.payload && data.payload.capabilities) {
            const powerSwitch = data.payload.capabilities.find(cap => cap.instance === "powerSwitch");
            if (powerSwitch) {
//              light is currently on
                currentState = powerSwitch.state.value === 1;
//                console.log("Current power state:", currentState);
            } else {
//                console.log("No powerSwitch capability found in response");
            }
        } else {
//            console.log("No capabilities found in response");
        }

        const newState = currentState ? 0 : 1; // Toggle to opposite state
//        Can be used for debugging
//        console.log("Setting new state to:", newState);

        // Toggle each light
        deviceIds.forEach(function(deviceId) {
            const controlRequest = {
                url: `https://openapi.api.govee.com/router/api/v1/device/control`,
                method: "POST",
                headers: {
                    "Govee-API-Key": goveeApiKey,
                    "Content-Type": "application/json"
                },
                content: JSON.stringify({
                    requestId: generateUUID(),
                    payload: {
                        sku: "H6008",  // Model number of light
                        device: deviceId,
                        capability: {
                            type: "devices.capabilities.on_off",
                            instance: "powerSwitch",
                            value: newState
                        }
                    }
                })
            };

//            Can be used for debugging
//            console.log("Control request for device", deviceId + ":", JSON.stringify(controlRequest, null, 2));

            http.makeRequest(controlRequest, function(err, res) {
                if (err) {
                    console.log("Error controlling device", deviceId + ":", err);
                } else {
                    console.log("Control response for device", deviceId + ":", res.content);
                }
                if (callback) callback(err, res);
            });
        });
    });
}


// Handle button events
buttonManager.on("buttonSingleOrDoubleClickOrHold", function(obj) {
    var button = buttonManager.getButton(obj.bdaddr);
    var clickType = obj.isSingleClick ? "click" : obj.isDoubleClick ? "double_click" : "hold";
	  var buttonSerial = "YOUR BUTTON SERIAL NUMBER"

//  Can be used for debugging
    console.log("Button pressed:", button.serialNumber, "Click type:", clickType);
    
    // Single click toggles lights
    if (clickType === "click" && button.serialNumber === buttonSerial) {
        toggleLights(function(err, res) {
            console.log("Toggle lights result:", err, res);
        });
    }
});

console.log("Started");

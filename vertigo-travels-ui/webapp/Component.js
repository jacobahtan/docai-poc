sap.ui.define(["sap/ui/core/UIComponent", "sap/ui/model/json/JSONModel"], function (UIComponent, JSONModel) {
    "use strict"; return UIComponent.extend("vt.Component", {
        metadata: { manifest: "json" }, init: function () {
            UIComponent.prototype.init.apply(this, arguments); // session model: travelerId, travelerName, role const oSession = new JSONModel({ travelerId: "", travelerName: "", role: "traveler" // or "admin" }); this.setModel(oSession, "session");

            this.getRouter().initialize();
        }
    });
});
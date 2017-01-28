if (!com) var net = {};
if (!com.github) com.github = {};
if (!com.github.haqer1) com.github.haqer1 = {};
if (!com.github.haqer1.app) com.github.haqer1.app = {};
if (!com.github.haqer1.logging) com.github.haqer1.logging = {};

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

// TODO: puts, i18n

/**
 * Logs to console, and optionally also dumps.
 */
com.github.haqer1.logging.Logger = function(isim, useDump, skipTimestamp) {
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

	this.log = function(text) {
		var mesaj = isim;
		if (!skipTimestamp) {
			var date = new Date();
			//mesaj += " (" +date.toLocaleFormat("%Y-%m-%d %T") + ')';
			mesaj += " (" +formatDate(date)+ ')';
		}
		mesaj += ": " +text;
		consoleService.logStringMessage(mesaj);
		if (useDump)
			dump(mesaj+ '\n');
	}

	function formatDate(d) {
		function pad(n) {return n<10 ? '0'+n : n}

		return d.getFullYear()+'-'
			+ pad(d.getMonth()+1)+'-'
			+ pad(d.getDate())+' '
			+ pad(d.getHours())+':'
			+ pad(d.getMinutes())+':'
			+ pad(d.getSeconds());
	}
}

/**
 * Currently, logs all HTTP requests, using Logger.
 */
com.github.haqer1.app.RequestAssistant = function() {
	const logger = new com.github.haqer1.logging.Logger("RequestAssistant", true);
	const DEBUG_ENABLED = false;

	this.observe = function(subject, topic, data) {
		if (topic == "http-on-modify-request") {
			var httpChannel = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
			if (httpChannel.URI.spec == httpChannel.originalURI.spec)
				logger.log(httpChannel.URI.spec);
			else
				logger.log("2. " +httpChannel.URI.spec+ " (1. " +httpChannel.originalURI.spec+ ')');
			return;
		} else if (topic == "profile-after-change") {
			if (DEBUG_ENABLED)	logger.log("profile-after-change...");
			var os = Components.classes["@mozilla.org/observer-service;1"]
					 .getService(Components.interfaces.nsIObserverService);
			os.addObserver(this, "http-on-modify-request", false);
		}
	};

	this.QueryInterface = function (iid) {
		if (iid.equals(Components.interfaces.nsIObserver) ||
		    iid.equals(Components.interfaces.nsISupports))
		    return this;
		
		Components.returnCode = Components.results.NS_ERROR_NO_INTERFACE;
		return null;
	};
}

com.github.haqer1.app.RequestAssistant.prototype = {
	classID: Components.ID("{e03aca24-5f35-477f-abd3-ae69f41256de}"),
	progID: "@haqer1.github.com/request-assistant;1",
	requestAssistantName: "Request Assistant"
};

if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([com.github.haqer1.app.RequestAssistant]);
else
    var NSGetModule = XPCOMUtils.generateNSGetModule([com.github.haqer1.app.RequestAssistant]);

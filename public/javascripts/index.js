// definitions
var pugEditor, dataEditor, cssEditor;
const CONFIG_KEY = 'pug-viewer-config';
const codeDefaults = {lineNumbers: true, indentUnit: 2, tabSize: 2, indentWithTabs: true};
const codeConfig = Object.assign({}, codeDefaults);

// init

if (!localStorage[CONFIG_KEY]) {
	localStorage[CONFIG_KEY] = JSON.stringify(codeConfig);
} else {
	Object.assign(codeConfig, JSON.parse(localStorage[CONFIG_KEY]));
}
setSettingsFields(codeConfig);

const codemirrorConfig = function (mode) { return { ...codeConfig, mode: mode }; }

pugEditor = CodeMirror.fromTextArea(document.getElementById("pug-input"), codemirrorConfig('pug'));
dataEditor = CodeMirror.fromTextArea(document.getElementById("data-input"), codemirrorConfig({name: 'javascript', json: true}));
cssEditor = CodeMirror.fromTextArea(document.getElementById("css-input"), codemirrorConfig('css'));

pugEditor.setSize(null, "100%");
dataEditor.setSize(null, "100%");
cssEditor.setSize(null, "100%");

$(".ui.checkbox").checkbox();

$('#settings-modal')
  .modal({
    closable  : false,
    onDeny    : function(){
    	setSettingsFields(codeConfig);
    },
    onApprove : function() {
    	Object.assign(codeConfig, getSettingsFields());
    	setConfigAndRefreshEditors();
    }
  });

// dom actions

$("a#download-output").click(function(){
	startLoading('output');
	compile().then(data => {
		let html = data.html || data.error;
		if (/<\/head>/.test(html)) html = html.replace(/<\/head>/, "<style>" + $("#output-style").html() + "</style></head>");
	    else html += "<style>" + $("#output-style").html() + "</style>";
	    var a = document.createElement('A');
		a.href = "data:text/plain;charset=UTF-8,"  + encodeURIComponent(html);
		a.download = "output.html";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		endLoading('output');
	}, () => {});
});

$("#settings").on("click", function() {
	$('#settings-modal').modal('show');
});

startLoading();
$.get("/api/default", function(data) {
	pugEditor.setValue(data.defaultPug);
	cssEditor.setValue(data.defaultCss);
	dataEditor.setValue(data.defaultData);
	$("#output").html((data.defaultHtml || '').replace(/\n/g, '<br>'));
	$("#output-style").html((data.defaultCss || '').replace(/\n/, ''));
	$(".active.tab").removeClass("active");
	$(".active.tb.item").click();
	
	setTimeout(() => {
		pugEditor.refresh();
	});

	$(".tb.item[data-tab=css]").on("click.onlyonce", () => {
		setTimeout(() => cssEditor.refresh());
		$(".tb.item[data-tab=css]").off("click.onlyonce");
	});

	$(".tb.item[data-tab=data]").on("click.onlyonce", () => {
		setTimeout(() => dataEditor.refresh());
		$(".tb.item[data-tab=data]").off("click.onlyonce");
	});

	endLoading();
}, "json");

$("#compile").on("click", function () {
	startLoading('output');
	compile().then(data => {
		renderOutput(data);
		endLoading('output');
	}, () => {});
});

$('#save').on("click", function() {
	startLoading();
	$.post('/api/save', {pug: pugEditor.getValue(), data: dataEditor.getValue(), css: cssEditor.getValue()})
		.done(function (data) {
			renderOutput(data);
			alert("Saved.");
		}).fail(function () {
			alert("Save failed!");
		}).always(function() {
			endLoading();
		});
});

// methods

function compile() {
	return new Promise((resolve, reject) => {
		$.post('/api/compile', {pug: pugEditor.getValue(), data: dataEditor.getValue('')})
			.done(function (data) {
				resolve(data);
			}).fail(function() { reject(); });
	});
}

function renderOutput(data) {
	if (!data.error) {
		$("#output").html(data.html);
		$("#output-style").html(' ');
		$("#output-style").html(cssEditor.getValue(''));
	}
	else
		$("#output").html('<code style="color: red;">' + data.error.replace(/\n/g, '<br>') + '</code>');
}

window.onbeforeunload = function(e) {
  return "Do you want to exit this page? All progress will be lost.";
};

function startLoading(section) {
	$(`#${section || 'main'}-loader`).addClass("active");
}

function endLoading(section) {
	$(`#${section || 'main'}-loader`).removeClass("active");
}

function storeSettings(config) {
	localStorage[CONFIG_KEY] = JSON.stringify(config);
}

function getSettingsFields() {
	return {
		indentUnit: $("#indent-unit").val(),
		tabSize: $("#tab-size").val(),
		indentWithTabs: $("#indent-with-tabs").prop("checked")
	}
}

function setSettingsFields(config) {
	$("#indent-unit").val(config.indentUnit);
	$("#tab-size").val(config.tabSize);
	$("#indent-with-tabs").prop("checked", config.indentWithTabs);
}

function setConfigAndRefreshEditors() {
	for (const editor of [pugEditor, dataEditor, cssEditor]) {
		editor.setOption('indentUnit', codeConfig.indentUnit);
		editor.setOption('tabSize', codeConfig.tabSize);
		editor.setOption('indentWithTabs', codeConfig.indentWithTabs);
		setTimeout(editor.refresh());
	}
	storeSettings(codeConfig);
}


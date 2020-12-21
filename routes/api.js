var express = require('express');
var router = express.Router();
const path = require('path');
const fs = require('fs');
const pug = require('pug');

const templateRoot = path.join(__dirname, '../templates/');

const pugPath = path.join(templateRoot, 'template.pug');
const cssPath = path.join(templateRoot, 'template.css');
const dataPath = path.join(templateRoot, 'data.json');

let defaultPug = fs.readFileSync(pugPath, 'utf-8');
let defaultCss = fs.readFileSync(cssPath, 'utf-8');
let defaultData = fs.readFileSync(dataPath, 'utf-8');

/* GET users listing. */
router.get('/default', function(req, res, next) {
	let html = '';
	try {
		html = pug.compileFile(pugPath)(JSON.parse(defaultData));
	} catch (err) {
		html = `<code style="color: red">${err}</code>`;
	}
  res.send({defaultPug, defaultCss, defaultData, defaultHtml: html});
});

router.post('/compile', function(req, res, next) {
	const _pug = req.body.pug;
	const _data = req.body.data;
	try {
		res.send({
			html: pug.compile(_pug)(JSON.parse(_data))
		});
	} catch (err) {
		res.send({
			error: err.toString()
		});
	}
});

router.post('/save', function(req, res, next) {
	const _pug = req.body.pug;
	const _data = req.body.data;
	const _css = req.body.css;
	try {
		fs.writeFileSync(pugPath, _pug, 'utf-8');
		fs.writeFileSync(dataPath, _data, 'utf-8');
		fs.writeFileSync(cssPath, _css, 'utf-8');
		defaultPug = _pug;
		defaultData = _data;
		defaultCss = _css;
		try {
			res.send({
				html: pug.compile(_pug)(JSON.parse(_data))
			});
		} catch (err) {
			res.send({
				error: err.toString()
			});
		}
	} catch (err) {
		fs.writeFileSync(pugPath, defaultPug, 'utf-8');
		fs.writeFileSync(dataPath, defaultData, 'utf-8');
		fs.writeFileSync(cssPath, defaultCss, 'utf-8');
		res.status(400);
		next(err);
	}
});

module.exports = router;
